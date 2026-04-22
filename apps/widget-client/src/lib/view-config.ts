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
const PATH_WIDGETS: Readonly<Record<string, WidgetKey>> = {
  "/calendar": "calendar",
  "/clock": "clock",
  "/days-remaining": "daysRemaining",
};

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

function getPathWidget(pathname?: string): WidgetKey | undefined {
  if (typeof pathname !== "string") {
    return undefined;
  }

  return PATH_WIDGETS[pathname];
}

export function resolveAppView(
  search: string,
  envWidget?: string,
  pathname?: string
): AppView {
  const params = new URLSearchParams(search);
  const requestedWidget = params.get("widget");
  const requestedLayout = params.get("layout");
  const pathWidget = getPathWidget(pathname);

  if (params.get("view") === "showcase") {
    return {
      kind: "showcase",
    };
  }

  const widget = isWidgetKey(requestedWidget)
    ? requestedWidget
    : pathWidget
      ? pathWidget
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
