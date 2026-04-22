import test from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_WIDGET_PURCHASE_URL } from "../src/lib/widget-access.js";
import {
  getInitialAppState,
  getWidgetSelection,
  readWidgetRuntime,
} from "../src/lib/widget-runtime.js";

test("readWidgetRuntime returns locked mode by default", () => {
  assert.deepEqual(readWidgetRuntime(undefined), {
    widget: undefined,
    accessGranted: false,
    purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
  });
});

test("readWidgetRuntime normalizes server-injected access state", () => {
  const runtime = readWidgetRuntime({
    __WIDGET_RUNTIME__: {
      widget: "calendar",
      accessGranted: true,
      reason: "license revoked",
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
    },
  });

  assert.deepEqual(runtime, {
    widget: "calendar",
    accessGranted: true,
    purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
    reason: "license revoked",
  });
});

test("readWidgetRuntime ignores invalid runtime payload fields", () => {
  const runtime = readWidgetRuntime({
    __WIDGET_RUNTIME__: {
      widget: "not-a-widget",
      accessGranted: "true" as unknown as boolean,
      purchaseUrl: 123 as unknown as string,
    },
  } as unknown as Window);

  assert.deepEqual(runtime, {
    widget: undefined,
    accessGranted: false,
    purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
  });
});

test("getWidgetSelection prefers the runtime widget over the env widget", () => {
  const runtime = readWidgetRuntime({
    __WIDGET_RUNTIME__: {
      widget: "clock",
      accessGranted: true,
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
    },
  });

  assert.equal(getWidgetSelection(runtime, "calendar"), "clock");
});

test("getWidgetSelection falls back to the env widget when runtime widget is absent", () => {
  const runtime = readWidgetRuntime({
    __WIDGET_RUNTIME__: {
      widget: "not-a-widget",
      accessGranted: true,
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
    },
  } as unknown as Window);

  assert.equal(getWidgetSelection(runtime, "daysRemaining"), "daysRemaining");
});

test("getInitialAppState uses the runtime widget on the first render", () => {
  const state = getInitialAppState({
    location: { search: "", pathname: "/" },
    __WIDGET_RUNTIME__: {
      widget: "clock",
      accessGranted: true,
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
      reason: "access granted",
    },
  } as unknown as Window);

  assert.deepEqual(state, {
    view: {
      kind: "widget",
      widget: "clock",
      layout: "square",
    },
    accessGranted: true,
  });
});

test("getInitialAppState uses the pathname widget when runtime and query are absent", () => {
  const state = getInitialAppState({
    location: { search: "", pathname: "/clock" },
    __WIDGET_RUNTIME__: {
      accessGranted: false,
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
    },
  } as unknown as Window);

  assert.deepEqual(state, {
    view: {
      kind: "widget",
      widget: "clock",
      layout: "square",
    },
    accessGranted: false,
  });
});
