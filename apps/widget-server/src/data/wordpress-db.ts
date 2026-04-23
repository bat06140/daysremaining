import mysql, { type Pool } from "mysql2/promise";

export type WordPressLicenseRow = {
  license_key: string;
  status: number | string;
  expires_at: string | null;
};

let pool: Pool | undefined;

function parsePort(value: string | undefined) {
  if (!value) {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function resolveDbConnectionConfig(env = process.env) {
  const explicitPort = parsePort(env.DB_PORT);
  const hostValue = env.DB_HOST;

  if (explicitPort !== undefined) {
    return {
      host: hostValue?.split(":")[0] ?? hostValue,
      port: explicitPort,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
    };
  }

  if (typeof hostValue === "string") {
    const colonIndex = hostValue.lastIndexOf(":");
    if (colonIndex > 0) {
      const host = hostValue.slice(0, colonIndex);
      const port = parsePort(hostValue.slice(colonIndex + 1));

      if (port !== undefined) {
        return {
          host,
          port,
          user: env.DB_USER,
          password: env.DB_PASSWORD,
          database: env.DB_NAME,
        };
      }
    }
  }

  return {
    host: hostValue,
    port: undefined,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
  };
}

export function getDbPool() {
  if (!pool) {
    const config = resolveDbConnectionConfig();
    pool = mysql.createPool({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: config.database,
      waitForConnections: true,
      connectionLimit: 10,
    });
  }

  return pool;
}

export async function fetchLicenseRows() {
  const [rows] = await getDbPool().query(`
    SELECT license_key, status, expires_at
    FROM wp_lmfwc_licenses
    WHERE status IN (2, 3)
  `);

  return rows as WordPressLicenseRow[];
}
