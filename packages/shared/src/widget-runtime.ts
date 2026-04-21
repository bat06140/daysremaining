import type { WidgetKey } from "./widget-types.js";

export type WidgetRuntime = {
  widget?: WidgetKey;
  accessGranted: boolean;
  purchaseUrl: string;
  reason?: string;
};
