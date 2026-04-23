import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";
import { resolveWidgetAssetPaths } from "../src/index.js";

test("resolveWidgetAssetPaths falls back to the built widget client assets", () => {
  const resolved = resolveWidgetAssetPaths();

  assert.match(resolved.templatePath, /apps\/widget-client\/dist\/index\.html$/);
  assert.match(resolved.staticDir, /apps\/widget-client\/dist$/);
  assert.equal(existsSync(resolved.templatePath), true);
  assert.equal(existsSync(resolved.staticDir), true);
});
