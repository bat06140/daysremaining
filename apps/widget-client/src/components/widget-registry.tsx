import Calendar from "./Calendar.js";
import { DaysRemaining } from "./DaysRemaining.js";
import FlipClock from "./FlipClock.js";
import { DEFAULT_WIDGET_PURCHASE_URL } from "../lib/widget-access.js";
import { WidgetKey, WidgetLayout } from "../lib/view-config.js";

export const widgetOptions: Array<{ value: WidgetKey; label: string }> = [
  { value: "calendar", label: "Calendar" },
  { value: "daysRemaining", label: "Days Remaining" },
  { value: "clock", label: "Clock" },
];

export const renderWidget = ({
  widget,
  layout,
  accessGranted = false,
  allowThemeEditor = true,
  purchaseUrl = DEFAULT_WIDGET_PURCHASE_URL,
}: {
  widget: WidgetKey;
  layout: WidgetLayout;
  accessGranted?: boolean;
  allowThemeEditor?: boolean;
  purchaseUrl?: string;
}) => {
  switch (widget) {
    case "calendar":
      return (
        <Calendar
          layout={layout}
          accessGranted={accessGranted}
          allowThemeEditor={allowThemeEditor}
          purchaseUrl={purchaseUrl}
        />
      );
    case "daysRemaining":
      return (
        <DaysRemaining
          layout={layout}
          accessGranted={accessGranted}
          allowThemeEditor={allowThemeEditor}
          purchaseUrl={purchaseUrl}
        />
      );
    case "clock":
      return (
        <FlipClock
          layout={layout}
          accessGranted={accessGranted}
          allowThemeEditor={allowThemeEditor}
          purchaseUrl={purchaseUrl}
        />
      );
    default:
      return (
        <Calendar
          layout={layout}
          accessGranted={accessGranted}
          allowThemeEditor={allowThemeEditor}
          purchaseUrl={purchaseUrl}
        />
      );
  }
};
