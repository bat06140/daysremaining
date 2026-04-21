import type { WidgetKey } from "@repo/shared";

export type { WidgetKey } from "@repo/shared";
export type WidgetLayout = "square" | "full";

export type AppView =
  | {
      kind: "widget";
      widget: WidgetKey;
      layout: WidgetLayout;
    }
  | {
      kind: "showcase";
    };

const FALLBACK_WIDGET: WidgetKey = "calendar";

function isWidgetKey(value: string | null | undefined): value is WidgetKey {
  return (
    value === "calendar" || value === "daysRemaining" || value === "clock"
  );
}

function isWidgetLayout(
  value: string | null | undefined
): value is WidgetLayout {
  return value === "square" || value === "full";
}

export function resolveAppView(search: string, envWidget?: string): AppView {
  const params = new URLSearchParams(search);
  const requestedWidget = params.get("widget");
  const requestedLayout = params.get("layout");

  if (params.get("view") === "showcase") {
    return {
      kind: "showcase",
    };
  }

  const widget = isWidgetKey(requestedWidget)
    ? requestedWidget
    : isWidgetKey(envWidget)
      ? envWidget
      : FALLBACK_WIDGET;
  const layout = isWidgetLayout(requestedLayout)
    ? requestedLayout
    : "square";

  return {
    kind: "widget",
    widget,
    layout,
  };
}
