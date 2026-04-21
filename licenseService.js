import NodeCache from "node-cache";
import { fetchLicenseRows } from "./db.js";
import { decryptLicenseKey as decryptLicenseKeyDefault } from "./crypto.js";

const INVALID_EXPIRY = Symbol("invalid-expiry");

function normalizeKey(key) {
  return typeof key === "string" ? key.trim() : "";
}

function createExpiresAt(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? INVALID_EXPIRY : parsed;
}

export function createLicenseService({
  cacheTtlSeconds = Number(process.env.CACHE_TTL_SECONDS ?? 3600),
  fetchRows = fetchLicenseRows,
  decryptLicenseKey = decryptLicenseKeyDefault,
  now = () => new Date(),
} = {}) {
  const cache = new NodeCache({ stdTTL: cacheTtlSeconds, useClones: false });
  let records = new Map();
  let lastRefreshAt = 0;

  async function refreshIndex() {
    const nextRecords = new Map();
    const rows = await fetchRows();

    for (const row of rows) {
      try {
        const key = normalizeKey(decryptLicenseKey(row.license_key));

        if (!key) {
          continue;
        }

        nextRecords.set(key, {
          status: Number(row.status),
          expiresAt: createExpiresAt(row.expires_at),
        });
      } catch {
        // Ignore malformed or undecryptable rows and keep indexing the rest.
      }
    }

    records = nextRecords;
    cache.flushAll();
    lastRefreshAt = Date.now();
  }

  async function checkAccess(key) {
    const normalizedKey = normalizeKey(key);

    if (!normalizedKey) {
      return { access: false, reason: "Licence manquante" };
    }

    const cached = cache.get(normalizedKey);
    if (cached) {
      return cached;
    }

    const hadSnapshot = records.size > 0;

    try {
      if (records.size === 0 || Date.now() - lastRefreshAt > cacheTtlSeconds * 1000) {
        await refreshIndex();
      }
    } catch {
      if (!hadSnapshot) {
        return { access: false, reason: "Service indisponible" };
      }
    }

    const record = records.get(normalizedKey);
    const result =
      !record
        ? { access: false, reason: "Licence introuvable" }
        : record.status !== 3
          ? { access: false, reason: "Licence inactive" }
          : record.expiresAt === INVALID_EXPIRY
            ? { access: false, reason: "Licence expirée" }
            : record.expiresAt && record.expiresAt <= now()
            ? { access: false, reason: "Licence expirée" }
            : { access: true };

    cache.set(normalizedKey, result);
    return result;
  }

  return { checkAccess, refreshIndex };
}

export const { checkAccess, refreshIndex } = createLicenseService();
