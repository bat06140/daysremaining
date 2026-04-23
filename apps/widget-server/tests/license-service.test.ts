import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import { createLicenseService } from "../src/services/license-service.js";

const rows = [
  { license_key: "enc-active", status: 3, expires_at: "2099-01-01 00:00:00" },
  { license_key: "enc-inactive", status: 2, expires_at: null },
  { license_key: "enc-expired", status: 3, expires_at: "2000-01-01 00:00:00" },
  { license_key: "enc-bad", status: 3, expires_at: null },
];
const DEFUSE_VERSION = Buffer.from("def50200", "hex");
const DEFUSE_KEY_HEADER = Buffer.from("def00000", "hex");
const AUTH_INFO = Buffer.from("DefusePHP|V2|KeyForAuthentication", "utf8");
const ENCRYPTION_INFO = Buffer.from("DefusePHP|V2|KeyForEncryption", "utf8");

function createAsciiSafeKey(rawKey: Buffer) {
  const checksum = crypto
    .createHash("sha256")
    .update(Buffer.concat([DEFUSE_KEY_HEADER, rawKey]))
    .digest();

  return Buffer.concat([DEFUSE_KEY_HEADER, rawKey, checksum]).toString("hex");
}

function deriveKey(rawKey: Buffer, salt: Buffer, info: Buffer) {
  return Buffer.from(crypto.hkdfSync("sha256", rawKey, salt, info, 32));
}

function encryptDefuseV2(plaintext: string, rawKey: Buffer, saltByte = 0x11, ivByte = 0x22) {
  const salt = Buffer.alloc(32, saltByte);
  const iv = Buffer.alloc(16, ivByte);
  const encryptionKey = deriveKey(rawKey, salt, ENCRYPTION_INFO);
  const authenticationKey = deriveKey(rawKey, salt, AUTH_INFO);
  const cipher = crypto.createCipheriv("aes-256-ctr", encryptionKey, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const header = Buffer.concat([DEFUSE_VERSION, salt, iv, ciphertext]);
  const hmac = crypto.createHmac("sha256", authenticationKey).update(header).digest();

  return Buffer.concat([header, hmac]).toString("hex");
}

test("checkAccess grants a matching active key through the default decryptor", async (t) => {
  const rawKey = Buffer.from("22".repeat(32), "hex");
  const previousDefuse = process.env.LMFWC_DEFUSE;

  process.env.LMFWC_DEFUSE = createAsciiSafeKey(rawKey);

  t.after(() => {
    if (previousDefuse === undefined) {
      delete process.env.LMFWC_DEFUSE;
      return;
    }

    process.env.LMFWC_DEFUSE = previousDefuse;
  });

  const service = createLicenseService({
    cacheTtlSeconds: 3600,
    fetchRows: async () => [
      {
        license_key: encryptDefuseV2("REAL-KEY", rawKey, 0x12, 0x34),
        status: 3,
        expires_at: "2099-01-01 00:00:00",
      },
      { license_key: "deadbeef", status: 3, expires_at: null },
    ],
    now: () => new Date("2026-04-21T10:00:00Z"),
  });

  assert.deepEqual(await service.checkAccess("REAL-KEY"), { access: true });
});

test("checkAccess grants a matching active key", async () => {
  const service = createLicenseService({
    cacheTtlSeconds: 3600,
    fetchRows: async () => rows,
    decryptLicenseKey: (encrypted: string) =>
      ({
        "enc-active": "VALID-KEY",
        "enc-inactive": "INACTIVE-KEY",
        "enc-expired": "EXPIRED-KEY",
      })[encrypted] ?? (() => {
        throw new Error("bad row");
      })(),
    now: () => new Date("2026-04-21T10:00:00Z"),
  });

  assert.deepEqual(await service.checkAccess("VALID-KEY"), { access: true });
});

test("checkAccess rejects inactive and expired keys", async () => {
  const service = createLicenseService({
    cacheTtlSeconds: 3600,
    fetchRows: async () => rows,
    decryptLicenseKey: (encrypted: string) =>
      ({
        "enc-active": "VALID-KEY",
        "enc-inactive": "INACTIVE-KEY",
        "enc-expired": "EXPIRED-KEY",
      })[encrypted] ?? (() => {
        throw new Error("bad row");
      })(),
    now: () => new Date("2026-04-21T10:00:00Z"),
  });

  assert.deepEqual(await service.checkAccess("INACTIVE-KEY"), {
    access: false,
    reason: "Licence inactive",
  });
  assert.deepEqual(await service.checkAccess("EXPIRED-KEY"), {
    access: false,
    reason: "Licence expirée",
  });
});

test("checkAccess fails closed when expires_at is invalid", async () => {
  const service = createLicenseService({
    cacheTtlSeconds: 3600,
    fetchRows: async () => [
      { license_key: "enc-invalid-expiry", status: 3, expires_at: "not-a-date" },
    ],
    decryptLicenseKey: (encrypted: string) =>
      ({
        "enc-invalid-expiry": "BROKEN-EXPIRY",
      })[encrypted] ?? (() => {
        throw new Error("bad row");
      })(),
    now: () => new Date("2026-04-21T10:00:00Z"),
  });

  assert.deepEqual(await service.checkAccess("BROKEN-EXPIRY"), {
    access: false,
    reason: "Licence expirée",
  });
});

test("checkAccess returns service unavailable when the database fetch fails", async () => {
  const logs: string[] = [];
  const service = createLicenseService({
    cacheTtlSeconds: 3600,
    fetchRows: async () => {
      throw new Error("db down");
    },
    decryptLicenseKey: () => "IGNORED",
    now: () => new Date("2026-04-21T10:00:00Z"),
    debugLicenses: true,
    logger: {
      info: (message: string) => logs.push(`info:${message}`),
      warn: (message: string) => logs.push(`warn:${message}`),
      error: (message: string) => logs.push(`error:${message}`),
    },
  });

  assert.deepEqual(await service.checkAccess("ANY-KEY"), {
    access: false,
    reason: "Service indisponible",
  });
  assert.match(logs.join("\n"), /refresh failed/i);
  assert.match(logs.join("\n"), /sha256:/i);
  assert.doesNotMatch(logs.join("\n"), /ANY-KEY/);
});

test("checkAccess skips rows that fail decryption and caches the first result", async () => {
  let fetchCount = 0;
  const logs: string[] = [];

  const service = createLicenseService({
    cacheTtlSeconds: 3600,
    fetchRows: async () => {
      fetchCount += 1;
      return rows;
    },
    decryptLicenseKey: (encrypted: string) =>
      ({
        "enc-active": "VALID-KEY",
        "enc-inactive": "INACTIVE-KEY",
        "enc-expired": "EXPIRED-KEY",
      })[encrypted] ?? (() => {
        throw new Error("bad row");
      })(),
    now: () => new Date("2026-04-21T10:00:00Z"),
    debugLicenses: true,
    logger: {
      info: (message: string) => logs.push(`info:${message}`),
      warn: (message: string) => logs.push(`warn:${message}`),
      error: (message: string) => logs.push(`error:${message}`),
    },
  });

  await service.checkAccess("VALID-KEY");
  await service.checkAccess("VALID-KEY");

  assert.equal(fetchCount, 1);
  assert.match(logs.join("\n"), /rows=4/);
  assert.match(logs.join("\n"), /indexed=3/);
  assert.match(logs.join("\n"), /decryptFailures=1/);
  assert.match(logs.join("\n"), /cache hit/i);
});

test("checkAccess falls back to the last good snapshot when refresh fails later", async (t) => {
  const originalDateNow = Date.now;
  let nowMs = Date.parse("2026-04-21T10:00:00Z");
  let shouldFailRefresh = false;

  Date.now = () => nowMs;
  t.after(() => {
    Date.now = originalDateNow;
  });

  const service = createLicenseService({
    cacheTtlSeconds: 1,
    fetchRows: async () => {
      if (shouldFailRefresh) {
        throw new Error("db down");
      }

      return [
        { license_key: "enc-active", status: 3, expires_at: "2099-01-01 00:00:00" },
        { license_key: "enc-second", status: 3, expires_at: "2099-01-01 00:00:00" },
      ];
    },
    decryptLicenseKey: (encrypted: string) =>
      ({
        "enc-active": "VALID-KEY",
        "enc-second": "SECOND-KEY",
      })[encrypted] ?? (() => {
        throw new Error("bad row");
      })(),
    now: () => new Date(nowMs),
  });

  assert.deepEqual(await service.checkAccess("VALID-KEY"), { access: true });

  shouldFailRefresh = true;
  nowMs += 2_000;

  assert.deepEqual(await service.checkAccess("SECOND-KEY"), { access: true });
});

test("checkAccess does not cache granted access beyond the license expiry", async () => {
  let nowMs = Date.parse("2026-04-21T10:00:00Z");

  const service = createLicenseService({
    cacheTtlSeconds: 3600,
    fetchRows: async () => [
      { license_key: "enc-soon-expired", status: 3, expires_at: "2026-04-21T10:00:01Z" },
    ],
    decryptLicenseKey: (encrypted: string) =>
      ({
        "enc-soon-expired": "SOON-EXPIRING-KEY",
      })[encrypted] ?? (() => {
        throw new Error("bad row");
      })(),
    now: () => new Date(nowMs),
  });

  assert.deepEqual(await service.checkAccess("SOON-EXPIRING-KEY"), { access: true });

  nowMs += 2_000;

  assert.deepEqual(await service.checkAccess("SOON-EXPIRING-KEY"), {
    access: false,
    reason: "Licence expirée",
  });
});
