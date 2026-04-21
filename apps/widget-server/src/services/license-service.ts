import NodeCache from "node-cache";
import { decryptLicenseKey as decryptLicenseKeyDefault } from "../crypto/lm4wc-defuse.js";
import {
  fetchLicenseRows,
  type WordPressLicenseRow,
} from "../data/wordpress-db.js";

const INVALID_EXPIRY = Symbol("invalid-expiry");

type AccessGranted = {
  access: true;
  reason?: undefined;
};

type AccessDenied = {
  access: false;
  reason: string;
};

export type LicenseAccessResult = AccessGranted | AccessDenied;

type LicenseRecord = {
  status: number;
  expiresAt: Date | null | typeof INVALID_EXPIRY;
};

type CacheEntry = {
  result: LicenseAccessResult;
  expiresAt?: Date;
};

export type FetchRows = () => Promise<readonly WordPressLicenseRow[]>;

export type LicenseServiceOptions = {
  cacheTtlSeconds?: number;
  fetchRows?: FetchRows;
  decryptLicenseKey?: (encrypted: string) => string;
  now?: () => Date;
};

function grantAccess(): LicenseAccessResult {
  return { access: true };
}

function denyAccess(reason: string): LicenseAccessResult {
  return { access: false, reason };
}

function normalizeKey(key: unknown) {
  return typeof key === "string" ? key.trim() : "";
}

function createExpiresAt(value: string | null) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? INVALID_EXPIRY : parsed;
}

function getCacheTtlSeconds({
  cacheTtlSeconds,
  expiresAt,
  currentTime,
}: {
  cacheTtlSeconds: number;
  expiresAt?: Date;
  currentTime: Date;
}) {
  if (!expiresAt) {
    return cacheTtlSeconds;
  }

  const remainingMs = expiresAt.getTime() - currentTime.getTime();
  if (remainingMs <= 0) {
    return 0;
  }

  return Math.max(1, Math.ceil(Math.min(cacheTtlSeconds * 1000, remainingMs) / 1000));
}

export function createLicenseService({
  cacheTtlSeconds = Number(process.env.CACHE_TTL_SECONDS ?? 3600),
  fetchRows = fetchLicenseRows,
  decryptLicenseKey = decryptLicenseKeyDefault,
  now = () => new Date(),
}: LicenseServiceOptions = {}) {
  const cache = new NodeCache({
    stdTTL: cacheTtlSeconds,
    useClones: false,
  });
  let records = new Map<string, LicenseRecord>();
  let lastRefreshAt = 0;

  async function refreshIndex() {
    const nextRecords = new Map<string, LicenseRecord>();
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

  async function checkAccess(key: string | undefined): Promise<LicenseAccessResult> {
    const normalizedKey = normalizeKey(key);

    if (!normalizedKey) {
      return denyAccess("Licence manquante");
    }

    const cached = cache.get(normalizedKey) as CacheEntry | undefined;
    if (cached) {
      if (cached.expiresAt && cached.expiresAt <= now()) {
        cache.del(normalizedKey);
      } else {
        return cached.result;
      }
    }

    const hadSnapshot = records.size > 0;

    try {
      if (records.size === 0 || Date.now() - lastRefreshAt > cacheTtlSeconds * 1000) {
        await refreshIndex();
      }
    } catch {
      if (!hadSnapshot) {
        return denyAccess("Service indisponible");
      }
    }

    const record = records.get(normalizedKey);
    const currentTime = now();
    const result: LicenseAccessResult =
      !record
        ? denyAccess("Licence introuvable")
        : record.status !== 3
          ? denyAccess("Licence inactive")
          : record.expiresAt === INVALID_EXPIRY
            ? denyAccess("Licence expirée")
            : record.expiresAt && record.expiresAt <= currentTime
              ? denyAccess("Licence expirée")
              : grantAccess();

    const entry: CacheEntry =
      record?.expiresAt instanceof Date && result.access
        ? { result, expiresAt: record.expiresAt }
        : { result };
    const ttlSeconds = getCacheTtlSeconds({
      cacheTtlSeconds,
      expiresAt: entry.expiresAt,
      currentTime,
    });

    if (ttlSeconds > 0) {
      cache.set(normalizedKey, entry, ttlSeconds);
    }

    return result;
  }

  return { checkAccess, refreshIndex };
}

export const { checkAccess, refreshIndex } = createLicenseService();
