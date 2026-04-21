import mysql, { type Pool } from "mysql2/promise";

export type WordPressLicenseRow = {
  license_key: string;
  status: number | string;
  expires_at: string | null;
};

let pool: Pool | undefined;

export function getDbPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
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
