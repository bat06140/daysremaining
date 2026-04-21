import { useEffect, useState } from "react";
import WidgetShowcase from "./components/WidgetShowcase";
import { renderWidget } from "./components/widget-registry";
import { WidgetThemeProvider } from "./context/WidgetThemeContext";
import { getInitialAppState } from "./lib/widget-runtime";

function App() {
  const [state, setState] = useState(() =>
    getInitialAppState(window, import.meta.env.VITE_COMPONENT)
  );

  useEffect(() => {
    const updateView = () => {
      setState(getInitialAppState(window, import.meta.env.VITE_COMPONENT));
    };

    updateView();
    window.addEventListener("popstate", updateView);

    return () => {
      window.removeEventListener("popstate", updateView);
    };
  }, []);

  const { view, accessGranted } = state;

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
          ? <WidgetShowcase hasLicense={accessGranted} />
          : renderWidget({
              widget: view.widget,
              layout: view.layout,
              hasLicense: accessGranted,
            })}
      </div>
    </WidgetThemeProvider>
  );
}

export default App;
