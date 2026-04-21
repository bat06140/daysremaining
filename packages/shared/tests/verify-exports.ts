import {
  DEFAULT_WIDGET_PURCHASE_URL,
  type WidgetKey,
  type WidgetRuntime,
} from "../src/index";

const widgetKeys: WidgetKey[] = ["calendar", "daysRemaining", "clock"];

const runtime: WidgetRuntime = {
  widget: widgetKeys[0],
  accessGranted: true,
  purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
};

void widgetKeys;
void runtime;
