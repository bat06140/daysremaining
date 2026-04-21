import test from "node:test";
import assert from "node:assert/strict";
import {
  getThemeEditorMode,
  shouldShowWidgetBranding,
} from "../src/lib/widget-access.js";

test("licensed widgets use premium mode when the editor is allowed", () => {
  assert.equal(getThemeEditorMode(true, true), "premium");
});

test("locked widgets keep the palette visible when the editor is allowed", () => {
  assert.equal(getThemeEditorMode(false, true), "locked");
});

test("widgets without editor permission hide the palette entirely", () => {
  assert.equal(getThemeEditorMode(false, false), "hidden");
  assert.equal(getThemeEditorMode(true, false), "hidden");
});

test("branding stays visible only when access is locked", () => {
  assert.equal(shouldShowWidgetBranding(false, undefined), true);
  assert.equal(shouldShowWidgetBranding(true, undefined), false);
  assert.equal(shouldShowWidgetBranding(true, true), true);
});
