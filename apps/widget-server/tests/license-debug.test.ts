import assert from "node:assert/strict";
import test from "node:test";
import {
  fingerprintLicense,
  logStartupDiagnostics,
} from "../src/logging/license-debug.js";

test("fingerprintLicense masks plaintext license values", () => {
  const fingerprint = fingerprintLicense("VALID-KEY-123");

  assert.match(fingerprint, /^sha256:/);
  assert.doesNotMatch(fingerprint, /VALID-KEY-123/);
  assert.equal(fingerprintLicense(undefined), "missing");
});

test("logStartupDiagnostics reports env presence without leaking secrets", () => {
  const logs: string[] = [];
  const previousEnv = {
    DB_HOST: process.env.DB_HOST,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME,
    LMFWC_SECRET: process.env.LMFWC_SECRET,
    LMFWC_DEFUSE: process.env.LMFWC_DEFUSE,
  };

  process.env.DB_HOST = "127.0.0.1";
  process.env.DB_USER = "wp_user";
  process.env.DB_PASSWORD = "super-secret";
  delete process.env.DB_NAME;
  delete process.env.LMFWC_SECRET;
  process.env.LMFWC_DEFUSE = "defuse-secret";

  try {
    logStartupDiagnostics({
      logger: {
        info: (message: string) => logs.push(message),
        warn: () => undefined,
        error: () => undefined,
      },
      port: 3000,
      templatePath: "/tmp/widget.html",
      staticDir: "/tmp/static",
    });
  } finally {
    if (previousEnv.DB_HOST === undefined) delete process.env.DB_HOST;
    else process.env.DB_HOST = previousEnv.DB_HOST;
    if (previousEnv.DB_USER === undefined) delete process.env.DB_USER;
    else process.env.DB_USER = previousEnv.DB_USER;
    if (previousEnv.DB_PASSWORD === undefined) delete process.env.DB_PASSWORD;
    else process.env.DB_PASSWORD = previousEnv.DB_PASSWORD;
    if (previousEnv.DB_NAME === undefined) delete process.env.DB_NAME;
    else process.env.DB_NAME = previousEnv.DB_NAME;
    if (previousEnv.LMFWC_SECRET === undefined) delete process.env.LMFWC_SECRET;
    else process.env.LMFWC_SECRET = previousEnv.LMFWC_SECRET;
    if (previousEnv.LMFWC_DEFUSE === undefined) delete process.env.LMFWC_DEFUSE;
    else process.env.LMFWC_DEFUSE = previousEnv.LMFWC_DEFUSE;
  }

  const output = logs.join("\n");
  assert.match(output, /\[license-debug\] startup/);
  assert.match(output, /DB_HOST=set/);
  assert.match(output, /DB_PORT=missing/);
  assert.match(output, /DB_USER=set/);
  assert.match(output, /DB_PASSWORD=set/);
  assert.match(output, /DB_NAME=missing/);
  assert.match(output, /LMFWC_SECRET=missing/);
  assert.match(output, /LMFWC_DEFUSE=set/);
  assert.match(output, /WIDGET_TEMPLATE_PATH=set/);
  assert.match(output, /WIDGET_STATIC_DIR=set/);
  assert.doesNotMatch(output, /super-secret/);
  assert.doesNotMatch(output, /defuse-secret/);
});
