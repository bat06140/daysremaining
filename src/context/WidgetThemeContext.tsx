import { createContext, useEffect, useMemo, useState } from "react";
import {
  buildWidgetThemeCookie,
  DEFAULT_WIDGET_THEME,
  readWidgetThemeFromCookieString,
  WidgetTheme,
} from "@/lib/widget-theme";

export interface WidgetThemeContextValue {
  theme: WidgetTheme;
  saveTheme: (theme: WidgetTheme) => void;
}

export const WidgetThemeContext =
  createContext<WidgetThemeContextValue | null>(null);

export const WidgetThemeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [theme, setTheme] = useState<WidgetTheme>(DEFAULT_WIDGET_THEME);

  useEffect(() => {
    setTheme(readWidgetThemeFromCookieString(document.cookie));
  }, []);

  const value = useMemo<WidgetThemeContextValue>(
    () => ({
      theme,
      saveTheme: (nextTheme) => {
        setTheme(nextTheme);
        document.cookie = buildWidgetThemeCookie(nextTheme);
      },
    }),
    [theme]
  );

  return (
    <WidgetThemeContext.Provider value={value}>
      {children}
    </WidgetThemeContext.Provider>
  );
};
