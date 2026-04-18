import { useEffect, useState } from "react";
import WidgetShowcase from "./components/WidgetShowcase";
import { renderWidget } from "./components/widget-registry";
import { WidgetThemeProvider } from "./context/WidgetThemeContext";
import { AppView, resolveAppView } from "./lib/view-config";

function App() {
  const [view, setView] = useState<AppView | null>(null);

  useEffect(() => {
    const updateView = () => {
      setView(
        resolveAppView(window.location.search, import.meta.env.VITE_COMPONENT)
      );
    };

    updateView();
    window.addEventListener("popstate", updateView);

    return () => {
      window.removeEventListener("popstate", updateView);
    };
  }, []);

  if (!view) {
    return "Loading...";
  }

  return (
    <WidgetThemeProvider>
      <div
        className={
          view.kind === "widget" && view.layout === "square"
            ? "flex h-screen w-screen items-center justify-center bg-[#f3efe7] p-4"
            : "h-screen w-screen"
        }
      >
        {view.kind === "showcase"
          ? <WidgetShowcase hasLicense={view.hasLicense} />
          : renderWidget({
              widget: view.widget,
              layout: view.layout,
              hasLicense: view.hasLicense,
            })}
      </div>
    </WidgetThemeProvider>
  );
}

export default App;
