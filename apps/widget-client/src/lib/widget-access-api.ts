import type { WidgetKey } from "@repo/shared";
import {
  DEFAULT_WIDGET_PURCHASE_URL,
  getThemeEditorMode,
  shouldShowWidgetBranding,
} from "./widget-access.js";

export { DEFAULT_WIDGET_PURCHASE_URL, getThemeEditorMode, shouldShowWidgetBranding };

export type WidgetAccessState = {
  accessGranted: boolean;
  purchaseUrl: string;
  reason?: string;
};

export async function fetchWidgetAccess(
  {
    widget,
    search,
  }: {
    widget: WidgetKey;
    search: string;
  },
  fetchImpl: typeof fetch = fetch
): Promise<WidgetAccessState> {
  const params = new URLSearchParams(search);
  params.set("widget", widget);

  try {
    const response = await fetchImpl(`/api/widget-access?${params.toString()}`);

    if (!response.ok) {
      return {
        accessGranted: false,
        purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
      };
    }

    const payload = (await response.json()) as {
      accessGranted?: unknown;
      purchaseUrl?: unknown;
      reason?: unknown;
    };

    return {
      accessGranted: payload.accessGranted === true,
      purchaseUrl:
        typeof payload.purchaseUrl === "string"
          ? payload.purchaseUrl
          : DEFAULT_WIDGET_PURCHASE_URL,
      ...(typeof payload.reason === "string" ? { reason: payload.reason } : {}),
    };
  } catch {
    return {
      accessGranted: false,
      purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
    };
  }
}
