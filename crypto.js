import crypto from "node:crypto";

const DEFUSE_CIPHERTEXT_VERSION = Buffer.from("def50200", "hex");
const DEFUSE_KEY_HEADER = Buffer.from("def00000", "hex");
const DEFUSE_KEY_BYTES = 32;
const DEFUSE_CHECKSUM_BYTES = 32;
const DEFUSE_SALT_BYTES = 32;
const DEFUSE_IV_BYTES = 16;
const DEFUSE_HMAC_BYTES = 32;
const AUTH_INFO = Buffer.from("DefusePHP|V2|KeyForAuthentication", "utf8");
const ENCRYPTION_INFO = Buffer.from("DefusePHP|V2|KeyForEncryption", "utf8");

function createCryptoError() {
  return new Error("Unable to decrypt license key");
}

function trimTrailingWhitespace(value) {
  return value.replace(/[\u0000\t\n\r ]+$/u, "");
}

function decodeHexString(value) {
  if (typeof value !== "string") {
    throw createCryptoError();
  }

  const normalized = trimTrailingWhitespace(value);

  if (normalized.length === 0 || normalized.length % 2 !== 0 || /[^0-9a-f]/iu.test(normalized)) {
    throw createCryptoError();
  }

  return Buffer.from(normalized, "hex");
}

function loadRawDefuseKey() {
  const serializedKey = decodeHexString(process.env.LMFWC_DEFUSE ?? "");
  const expectedLength =
    DEFUSE_KEY_HEADER.length + DEFUSE_KEY_BYTES + DEFUSE_CHECKSUM_BYTES;

  if (serializedKey.length !== expectedLength) {
    throw createCryptoError();
  }

  const header = serializedKey.subarray(0, DEFUSE_KEY_HEADER.length);
  if (!header.equals(DEFUSE_KEY_HEADER)) {
    throw createCryptoError();
  }

  const rawKey = serializedKey.subarray(
    DEFUSE_KEY_HEADER.length,
    DEFUSE_KEY_HEADER.length + DEFUSE_KEY_BYTES
  );
  const checksum = serializedKey.subarray(serializedKey.length - DEFUSE_CHECKSUM_BYTES);
  const expectedChecksum = crypto
    .createHash("sha256")
    .update(serializedKey.subarray(0, serializedKey.length - DEFUSE_CHECKSUM_BYTES))
    .digest();

  if (!crypto.timingSafeEqual(checksum, expectedChecksum)) {
    throw createCryptoError();
  }

  return Buffer.from(rawKey);
}

function deriveDefuseSubkey(rawKey, salt, info) {
  return Buffer.from(crypto.hkdfSync("sha256", rawKey, salt, info, DEFUSE_KEY_BYTES));
}

export function decryptLicenseKey(encryptedHex) {
  try {
    const payload = decodeHexString(encryptedHex);
    const minimumPayloadLength =
      DEFUSE_CIPHERTEXT_VERSION.length +
      DEFUSE_SALT_BYTES +
      DEFUSE_IV_BYTES +
      DEFUSE_HMAC_BYTES;

    if (payload.length < minimumPayloadLength) {
      throw createCryptoError();
    }

    const version = payload.subarray(0, DEFUSE_CIPHERTEXT_VERSION.length);
    if (!version.equals(DEFUSE_CIPHERTEXT_VERSION)) {
      throw createCryptoError();
    }

    const saltStart = DEFUSE_CIPHERTEXT_VERSION.length;
    const saltEnd = saltStart + DEFUSE_SALT_BYTES;
    const ivEnd = saltEnd + DEFUSE_IV_BYTES;
    const hmacStart = payload.length - DEFUSE_HMAC_BYTES;
    const salt = payload.subarray(saltStart, saltEnd);
    const iv = payload.subarray(saltEnd, ivEnd);
    const ciphertext = payload.subarray(ivEnd, hmacStart);
    const mac = payload.subarray(hmacStart);
    const rawKey = loadRawDefuseKey();
    const authenticationKey = deriveDefuseSubkey(rawKey, salt, AUTH_INFO);
    const encryptionKey = deriveDefuseSubkey(rawKey, salt, ENCRYPTION_INFO);
    const signedPayload = payload.subarray(0, hmacStart);
    const expectedMac = crypto
      .createHmac("sha256", authenticationKey)
      .update(signedPayload)
      .digest();

    if (!crypto.timingSafeEqual(mac, expectedMac)) {
      throw createCryptoError();
    }

    const decipher = crypto.createDecipheriv("aes-256-ctr", encryptionKey, iv);

    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  } catch {
    throw createCryptoError();
  }
}
