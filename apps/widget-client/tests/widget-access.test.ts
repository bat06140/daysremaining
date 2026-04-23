import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_WIDGET_PURCHASE_URL,
  fetchWidgetAccess,
  getThemeEditorMode,
  shouldShowWidgetBranding,
} from "../src/lib/widget-access-api.js";

test("fetchWidgetAccess normalizes a denied response", async () => {
  const access = await fetchWidgetAccess(
    {
      widget: "calendar",
      search: "?license=BAD-KEY",
    },
    async (input) => {
      assert.equal(input, "/api/widget-access?license=BAD-KEY&widget=calendar");
      return new Response(
        JSON.stringify({
          accessGranted: false,
          purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
          reason: "Licence introuvable",
        })
      );
    }
  );

  assert.deepEqual(access, {
    accessGranted: false,
    purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
    reason: "Licence introuvable",
  });
});

test("fetchWidgetAccess falls back to locked mode when the request fails", async () => {
  const access = await fetchWidgetAccess(
    {
      widget: "clock",
      search: "",
    },
    async () => {
      throw new Error("network down");
    }
  );

  assert.deepEqual(access, {
    accessGranted: false,
    purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
  });
});

test("licensed widgets use premium mode when the editor is allowed", () => {
  assert.equal(getThemeEditorMode(true, true), "premium");
});

test("freemium widgets keep the palette visible when the editor is allowed", () => {
  assert.equal(getThemeEditorMode(false, true), "freemium");
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
