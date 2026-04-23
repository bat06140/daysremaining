export type ThemeEditorMode = "premium" | "freemium" | "locked" | "hidden";

export { DEFAULT_WIDGET_PURCHASE_URL } from "@repo/shared";

export const getThemeEditorMode = (
  accessGranted: boolean,
  allowThemeEditor: boolean
): ThemeEditorMode => {
  if (!allowThemeEditor) {
    return "hidden";
  }

  return accessGranted ? "premium" : "freemium";
};

export const shouldShowWidgetBranding = (
  accessGranted: boolean,
  showBranding?: boolean
) => {
  return showBranding ?? !accessGranted;
};
