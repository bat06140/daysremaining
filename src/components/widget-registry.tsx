import Calendar from "./Calendar";
import { DaysRemaining } from "./DaysRemaining";
import FlipClock from "./FlipClock";
import { WidgetKey, WidgetLayout } from "@/lib/view-config";

export const widgetOptions: Array<{ value: WidgetKey; label: string }> = [
  { value: "calendar", label: "Calendar" },
  { value: "daysRemaining", label: "Days Remaining" },
  { value: "clock", label: "Clock" },
];

export const renderWidget = (widget: WidgetKey, layout: WidgetLayout) => {
  switch (widget) {
    case "calendar":
      return <Calendar layout={layout} />;
    case "daysRemaining":
      return <DaysRemaining layout={layout} />;
    case "clock":
      return <FlipClock layout={layout} />;
    default:
      return <Calendar layout={layout} />;
  }
};
