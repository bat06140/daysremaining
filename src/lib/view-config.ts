export type WidgetKey = "calendar" | "daysRemaining" | "clock";
export type WidgetLayout = "square" | "full";

export type AppView =
  | {
      kind: "widget";
      widget: WidgetKey;
      layout: WidgetLayout;
      hasLicense: boolean;
    }
  | {
      kind: "showcase";
      hasLicense: boolean;
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

function isEnabledFlag(value: string | null | undefined): boolean {
  return value === "true" || value === "1";
}

export function resolveAppView(search: string, envWidget?: string): AppView {
  const params = new URLSearchParams(search);
  const requestedWidget = params.get("widget");
  const requestedLayout = params.get("layout");
  const hasLicense = isEnabledFlag(
    params.get("hasLicense") ?? params.get("license")
  );

  if (params.get("view") === "showcase") {
    return {
      kind: "showcase",
      hasLicense,
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
    hasLicense,
  };
}
