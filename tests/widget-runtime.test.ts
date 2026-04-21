import test from "node:test";
import assert from "node:assert/strict";
import {
  getInitialAppState,
  getWidgetSelection,
  readWidgetRuntime,
} from "../src/lib/widget-runtime.js";

test("readWidgetRuntime returns locked mode by default", () => {
  assert.deepEqual(readWidgetRuntime(undefined), {
    widget: undefined,
    accessGranted: false,
    purchaseUrl: "https://atomicskills.academy/widgets-notion/",
  });
});

test("readWidgetRuntime normalizes server-injected access state", () => {
  const runtime = readWidgetRuntime({
    __WIDGET_RUNTIME__: {
      widget: "calendar",
      accessGranted: true,
      reason: "license revoked",
      purchaseUrl: "https://atomicskills.academy/widgets-notion/",
    },
  });

  assert.deepEqual(runtime, {
    widget: "calendar",
    accessGranted: true,
    purchaseUrl: "https://atomicskills.academy/widgets-notion/",
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
    purchaseUrl: "https://atomicskills.academy/widgets-notion/",
  });
});

test("getWidgetSelection prefers the runtime widget over the env widget", () => {
  const runtime = readWidgetRuntime({
    __WIDGET_RUNTIME__: {
      widget: "clock",
      accessGranted: true,
      purchaseUrl: "https://atomicskills.academy/widgets-notion/",
    },
  });

  assert.equal(getWidgetSelection(runtime, "calendar"), "clock");
});

test("getWidgetSelection falls back to the env widget when runtime widget is absent", () => {
  const runtime = readWidgetRuntime({
    __WIDGET_RUNTIME__: {
      widget: "not-a-widget",
      accessGranted: true,
      purchaseUrl: "https://atomicskills.academy/widgets-notion/",
    },
  } as unknown as Window);

  assert.equal(getWidgetSelection(runtime, "daysRemaining"), "daysRemaining");
});

test("getInitialAppState uses the runtime widget on the first render", () => {
  const state = getInitialAppState({
    location: { search: "" },
    __WIDGET_RUNTIME__: {
      widget: "clock",
      accessGranted: true,
      purchaseUrl: "https://atomicskills.academy/widgets-notion/",
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
