import { resolveAppView, type WidgetKey } from "./view-config.js";
import { DEFAULT_WIDGET_PURCHASE_URL } from "./widget-access.js";
const WIDGET_KEYS: readonly WidgetKey[] = ["calendar", "daysRemaining", "clock"];

export type WidgetRuntime = {
  widget?: WidgetKey;
  accessGranted: boolean;
  purchaseUrl: string;
  reason?: string;
};

export type AppState = {
  view: {
    kind: "widget";
    widget: WidgetKey;
    layout: "square" | "full";
  } | {
    kind: "showcase";
  };
  accessGranted: boolean;
};

type WidgetRuntimeInjection = {
  widget?: unknown;
  accessGranted?: unknown;
  purchaseUrl?: unknown;
  reason?: unknown;
};

type WidgetRuntimeWindow = {
  __WIDGET_RUNTIME__?: WidgetRuntimeInjection;
};

function isWidgetKey(value: unknown): value is WidgetKey {
  return typeof value === "string" && WIDGET_KEYS.includes(value as WidgetKey);
}

export function readWidgetRuntime(
  win: WidgetRuntimeWindow | undefined
): WidgetRuntime {
  const runtime = win?.__WIDGET_RUNTIME__;
  const widget = isWidgetKey(runtime?.widget) ? runtime.widget : undefined;
  const reason =
    typeof runtime?.reason === "string" ? runtime.reason : undefined;

  return {
    widget,
    accessGranted: runtime?.accessGranted === true,
    purchaseUrl:
      typeof runtime?.purchaseUrl === "string"
        ? runtime.purchaseUrl
        : DEFAULT_WIDGET_PURCHASE_URL,
    ...(reason !== undefined ? { reason } : {}),
  };
}

export function getWidgetSelection(
  runtime: WidgetRuntime,
  envWidget?: string
): string | undefined {
  return runtime.widget ?? envWidget;
}

export function getInitialAppState(
  currentWindow: Window,
  envWidget?: string
): AppState {
  const runtime = readWidgetRuntime(currentWindow);

  return {
    view: resolveAppView(
      currentWindow.location.search,
      getWidgetSelection(runtime, envWidget)
    ),
    accessGranted: runtime.accessGranted,
  };
}
