import { useContext } from "react";
import { WidgetThemeContext } from "@/context/WidgetThemeContext";

export const useWidgetTheme = () => {
  const context = useContext(WidgetThemeContext);

  if (!context) {
    throw new Error("useWidgetTheme must be used within WidgetThemeProvider");
  }

  return context;
};
