import test from "node:test";
import assert from "node:assert/strict";
import { resolveAppView } from "../src/lib/view-config.js";

test("resolveAppView uses the selected widget with square layout by default", () => {
  assert.deepEqual(resolveAppView("?widget=clock"), {
    kind: "widget",
    widget: "clock",
    layout: "square",
  });
});

test("resolveAppView supports full-page widget mode", () => {
  assert.deepEqual(resolveAppView("?widget=daysRemaining&layout=full"), {
    kind: "widget",
    widget: "daysRemaining",
    layout: "full",
  });
});

test("resolveAppView renders the showcase view when requested", () => {
  assert.deepEqual(resolveAppView("?view=showcase&widget=clock", "calendar"), {
    kind: "showcase",
  });
});

test("resolveAppView falls back to the env widget when the url does not specify one", () => {
  assert.deepEqual(resolveAppView("", "daysRemaining"), {
    kind: "widget",
    widget: "daysRemaining",
    layout: "square",
  });
});

test("resolveAppView uses the server runtime widget when the url does not specify one", () => {
  assert.deepEqual(resolveAppView("", "clock"), {
    kind: "widget",
    widget: "clock",
    layout: "square",
  });
});

test("resolveAppView falls back to calendar for unknown widget and layout values", () => {
  assert.deepEqual(resolveAppView("?widget=unknown&layout=wide"), {
    kind: "widget",
    widget: "calendar",
    layout: "square",
  });
});

test("resolveAppView no longer returns a license flag", () => {
  assert.deepEqual(resolveAppView("?widget=clock"), {
    kind: "widget",
    widget: "clock",
    layout: "square",
  });
});

test("resolveAppView ignores the license query param for access", () => {
  assert.deepEqual(resolveAppView("?widget=calendar&license=ABC-123"), {
    kind: "widget",
    widget: "calendar",
    layout: "square",
  });
});
