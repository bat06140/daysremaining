import crypto from "node:crypto";

export type DebugLogger = Pick<Console, "info" | "warn" | "error">;

export function isLicenseDebugEnabled(debugLicenses = process.env.DEBUG_LICENSES) {
  return debugLicenses === "1" || debugLicenses === "true";
}

export function createDebugLogger(logger?: DebugLogger): DebugLogger {
  return logger ?? console;
}

export function fingerprintLicense(license: string | undefined) {
  if (!license) {
    return "missing";
  }

  const normalized = license.trim();
  if (!normalized) {
    return "missing";
  }

  return `sha256:${crypto.createHash("sha256").update(normalized).digest("hex").slice(0, 12)}`;
}

export function logStartupDiagnostics({
  logger,
  port,
  templatePath,
  staticDir,
}: {
  logger: DebugLogger;
  port: number;
  templatePath?: string;
  staticDir?: string;
}) {
  logger.info(
    [
      "[license-debug] startup",
      `port=${port}`,
      `DB_HOST=${process.env.DB_HOST ? "set" : "missing"}`,
      `DB_PORT=${process.env.DB_PORT ? "set" : "missing"}`,
      `DB_USER=${process.env.DB_USER ? "set" : "missing"}`,
      `DB_PASSWORD=${process.env.DB_PASSWORD ? "set" : "missing"}`,
      `DB_NAME=${process.env.DB_NAME ? "set" : "missing"}`,
      `LMFWC_SECRET=${process.env.LMFWC_SECRET ? "set" : "missing"}`,
      `LMFWC_DEFUSE=${process.env.LMFWC_DEFUSE ? "set" : "missing"}`,
      `WIDGET_TEMPLATE_PATH=${templatePath ? "set" : "missing"}`,
      `WIDGET_STATIC_DIR=${staticDir ? "set" : "missing"}`,
    ].join(" ")
  );
}
