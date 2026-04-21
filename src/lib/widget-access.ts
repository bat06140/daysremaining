export type ThemeEditorMode = "premium" | "locked" | "hidden";

export const DEFAULT_WIDGET_PURCHASE_URL =
  "https://atomicskills.academy/widgets-notion/";

export const getThemeEditorMode = (
  accessGranted: boolean,
  allowThemeEditor: boolean
): ThemeEditorMode => {
  if (!allowThemeEditor) {
    return "hidden";
  }

  return accessGranted ? "premium" : "locked";
};

export const shouldShowWidgetBranding = (
  accessGranted: boolean,
  showBranding?: boolean
) => {
  return showBranding ?? !accessGranted;
};
