import test from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { decryptLicenseKey } from "../../crypto.js";

const DEFUSE_VERSION = Buffer.from("def50200", "hex");
const DEFUSE_KEY_HEADER = Buffer.from("def00000", "hex");
const AUTH_INFO = Buffer.from("DefusePHP|V2|KeyForAuthentication", "utf8");
const ENCRYPTION_INFO = Buffer.from("DefusePHP|V2|KeyForEncryption", "utf8");

function createAsciiSafeKey(rawKey) {
  const checksum = crypto
    .createHash("sha256")
    .update(Buffer.concat([DEFUSE_KEY_HEADER, rawKey]))
    .digest();

  return Buffer.concat([DEFUSE_KEY_HEADER, rawKey, checksum]).toString("hex");
}

function deriveKey(rawKey, salt, info) {
  return Buffer.from(crypto.hkdfSync("sha256", rawKey, salt, info, 32));
}

function encryptDefuseV2(plaintext, rawKey) {
  const salt = Buffer.from(
    "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff",
    "hex"
  );
  const iv = Buffer.from("0f1e2d3c4b5a69788796a5b4c3d2e1f0", "hex");
  const encryptionKey = deriveKey(rawKey, salt, ENCRYPTION_INFO);
  const authenticationKey = deriveKey(rawKey, salt, AUTH_INFO);
  const cipher = crypto.createCipheriv("aes-256-ctr", encryptionKey, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const header = Buffer.concat([DEFUSE_VERSION, salt, iv, ciphertext]);
  const hmac = crypto.createHmac("sha256", authenticationKey).update(header).digest();

  return Buffer.concat([header, hmac]).toString("hex");
}

test("decryptLicenseKey decrypts a Defuse v2 payload from an ASCII-safe key", (t) => {
  const rawKey = Buffer.from("11".repeat(32), "hex");
  const ciphertext = encryptDefuseV2("VALID-KEY", rawKey);
  const previousDefuse = process.env.LMFWC_DEFUSE;
  const previousSecret = process.env.LMFWC_SECRET;

  process.env.LMFWC_DEFUSE = `${createAsciiSafeKey(rawKey)}\n`;
  delete process.env.LMFWC_SECRET;

  t.after(() => {
    if (previousDefuse === undefined) {
      delete process.env.LMFWC_DEFUSE;
    } else {
      process.env.LMFWC_DEFUSE = previousDefuse;
    }

    if (previousSecret === undefined) {
      delete process.env.LMFWC_SECRET;
    } else {
      process.env.LMFWC_SECRET = previousSecret;
    }
  });

  assert.equal(decryptLicenseKey(ciphertext), "VALID-KEY");
});

test("hkdfSync returns ArrayBuffer in this runtime and the crypto path still works", () => {
  const derived = crypto.hkdfSync(
    "sha256",
    Buffer.from("a"),
    Buffer.alloc(0),
    Buffer.from("b"),
    64
  );

  assert.equal(Object.prototype.toString.call(derived), "[object ArrayBuffer]");
});
