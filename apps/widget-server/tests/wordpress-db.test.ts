import assert from "node:assert/strict";
import test from "node:test";
import { resolveDbConnectionConfig } from "../src/data/wordpress-db.js";

test("resolveDbConnectionConfig prefers explicit DB_PORT over a host suffix", () => {
  const config = resolveDbConnectionConfig({
    DB_HOST: "localhost:8889",
    DB_PORT: "3306",
    DB_USER: "wp_user",
    DB_PASSWORD: "secret",
    DB_NAME: "wordpress",
  });

  assert.equal(config.host, "localhost");
  assert.equal(config.port, 3306);
  assert.equal(config.user, "wp_user");
  assert.equal(config.password, "secret");
  assert.equal(config.database, "wordpress");
});

test("resolveDbConnectionConfig extracts the port from DB_HOST when DB_PORT is unset", () => {
  const config = resolveDbConnectionConfig({
    DB_HOST: "127.0.0.1:8889",
    DB_USER: "wp_user",
    DB_PASSWORD: "secret",
    DB_NAME: "wordpress",
  });

  assert.equal(config.host, "127.0.0.1");
  assert.equal(config.port, 8889);
});

test("resolveDbConnectionConfig keeps DB_HOST untouched when no port is present", () => {
  const config = resolveDbConnectionConfig({
    DB_HOST: "db.internal",
    DB_USER: "wp_user",
    DB_PASSWORD: "secret",
    DB_NAME: "wordpress",
  });

  assert.equal(config.host, "db.internal");
  assert.equal(config.port, undefined);
});
