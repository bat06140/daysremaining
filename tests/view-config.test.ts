import test from "node:test";
import assert from "node:assert/strict";
import { resolveAppView } from "../src/lib/view-config.js";

test("resolveAppView uses the selected widget with square layout by default", () => {
  assert.deepEqual(resolveAppView("?widget=clock"), {
    kind: "widget",
    widget: "clock",
    layout: "square",
    hasLicense: false,
  });
});

test("resolveAppView supports full-page widget mode", () => {
  assert.deepEqual(resolveAppView("?widget=daysRemaining&layout=full"), {
    kind: "widget",
    widget: "daysRemaining",
    layout: "full",
    hasLicense: false,
  });
});

test("resolveAppView renders the showcase view when requested", () => {
  assert.deepEqual(resolveAppView("?view=showcase&widget=clock", "calendar"), {
    kind: "showcase",
    hasLicense: false,
  });
});

test("resolveAppView falls back to the env widget when the url does not specify one", () => {
  assert.deepEqual(resolveAppView("", "daysRemaining"), {
    kind: "widget",
    widget: "daysRemaining",
    layout: "square",
    hasLicense: false,
  });
});

test("resolveAppView falls back to calendar for unknown widget and layout values", () => {
  assert.deepEqual(resolveAppView("?widget=unknown&layout=wide"), {
    kind: "widget",
    widget: "calendar",
    layout: "square",
    hasLicense: false,
  });
});

test("resolveAppView enables licensed mode from query params", () => {
  assert.deepEqual(resolveAppView("?widget=calendar&hasLicense=true"), {
    kind: "widget",
    widget: "calendar",
    layout: "square",
    hasLicense: true,
  });
});
