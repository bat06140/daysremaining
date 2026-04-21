import type { WidgetKey } from "./widget-types";

export type WidgetRuntime = {
  widget?: WidgetKey;
  accessGranted: boolean;
  purchaseUrl: string;
  reason?: string;
};
