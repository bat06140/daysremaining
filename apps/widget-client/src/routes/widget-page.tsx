import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import WidgetShowcase from "../components/WidgetShowcase.js";
import { renderWidget } from "../components/widget-registry.js";
import { WidgetThemeProvider } from "../context/WidgetThemeContext.js";
import {
  DEFAULT_WIDGET_PURCHASE_URL,
  fetchWidgetAccess,
  type WidgetAccessState,
} from "../lib/widget-access-api.js";
import { getWidgetFromPathname } from "../lib/widget-route.js";
import { resolveAppView } from "../lib/view-config.js";

export function WidgetPage() {
  const location = useLocation();
  const view = resolveAppView(location.search, undefined, location.pathname);
  const widget = getWidgetFromPathname(location.pathname);
  const [access, setAccess] = useState<WidgetAccessState | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!widget) {
      setAccess({
        accessGranted: false,
        purchaseUrl: DEFAULT_WIDGET_PURCHASE_URL,
      });
      return () => {
        cancelled = true;
      };
    }

    void fetchWidgetAccess({
      widget,
      search: location.search,
    }).then((nextAccess) => {
      if (!cancelled) {
        setAccess(nextAccess);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [location.search, widget]);

  if (access === null) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        Loading widget...
      </div>
    );
  }

  return (
    <WidgetThemeProvider>
      <div
        className={
          view.kind === "widget" && view.layout === "square"
            ? "flex h-screen w-screen items-center justify-center p-4"
            : "h-screen w-screen"
        }
      >
        {view.kind === "showcase" ? (
          <WidgetShowcase
            accessGranted={access.accessGranted}
            purchaseUrl={access.purchaseUrl}
          />
        ) : (
          renderWidget({
            widget: view.widget,
            layout: view.layout,
            accessGranted: access.accessGranted,
            purchaseUrl: access.purchaseUrl,
          })
        )}
      </div>
    </WidgetThemeProvider>
  );
}
