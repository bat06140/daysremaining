import Calendar from "./Calendar.js";
import { DaysRemaining } from "./DaysRemaining.js";
import FlipClock from "./FlipClock.js";
import { DEFAULT_WIDGET_PURCHASE_URL } from "../lib/widget-access.js";
import { AppLocale, getTranslationSet } from "../lib/locale.js";
import { WidgetKey, WidgetLayout } from "../lib/view-config.js";

export const getWidgetOptions = (
  locale: AppLocale
): Array<{ value: WidgetKey; label: string }> => {
  const translations = getTranslationSet(locale);

  return [
    { value: "calendar", label: translations.widgetOptions.calendar },
    { value: "daysRemaining", label: translations.widgetOptions.daysRemaining },
    { value: "clock", label: translations.widgetOptions.clock },
  ];
};

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
