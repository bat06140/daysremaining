import Calendar from "./Calendar";
import { DaysRemaining } from "./DaysRemaining";
import FlipClock from "./FlipClock";
import { WidgetKey, WidgetLayout } from "@/lib/view-config";

export const widgetOptions: Array<{ value: WidgetKey; label: string }> = [
  { value: "calendar", label: "Calendar" },
  { value: "daysRemaining", label: "Days Remaining" },
  { value: "clock", label: "Clock" },
];

export const renderWidget = ({
  widget,
  layout,
  hasLicense = false,
  allowThemeEditor = true,
}: {
  widget: WidgetKey;
  layout: WidgetLayout;
  hasLicense?: boolean;
  allowThemeEditor?: boolean;
}) => {
  switch (widget) {
    case "calendar":
      return (
        <Calendar
          layout={layout}
          hasLicense={hasLicense}
          allowThemeEditor={allowThemeEditor}
        />
      );
    case "daysRemaining":
      return (
        <DaysRemaining
          layout={layout}
          hasLicense={hasLicense}
          allowThemeEditor={allowThemeEditor}
        />
      );
    case "clock":
      return (
        <FlipClock
          layout={layout}
          hasLicense={hasLicense}
          allowThemeEditor={allowThemeEditor}
        />
      );
    default:
      return (
        <Calendar
          layout={layout}
          hasLicense={hasLicense}
          allowThemeEditor={allowThemeEditor}
        />
      );
  }
};
