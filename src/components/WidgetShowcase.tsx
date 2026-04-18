import { useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { WidgetKey } from "@/lib/view-config";
import {
  getPanelRatioFromPointer,
  PANEL_MIN_RATIO,
} from "@/lib/showcase-layout";
import { renderWidget, widgetOptions } from "./widget-registry";

type ShowcasePanelKey = "primary" | "secondary" | "tertiary";

const initialWidgets: Record<ShowcasePanelKey, WidgetKey> = {
  primary: "clock",
  secondary: "calendar",
  tertiary: "daysRemaining",
};

const panelOrder: ShowcasePanelKey[] = ["primary", "secondary", "tertiary"];

const ShowcasePanel = ({
  widget,
  hasLicense,
  onWidgetChange,
}: {
  widget: WidgetKey;
  hasLicense: boolean;
  onWidgetChange: (widget: WidgetKey) => void;
}) => {
  return (
    <section className="flex min-h-0 flex-col overflow-hidden rounded-[24px] border border-black/10 bg-[#ddd6c8] shadow-[0_18px_40px_rgba(55,53,47,0.12)]">
      <div className="flex justify-end px-3 pt-3">
        <select
          value={widget}
          onChange={(event) => onWidgetChange(event.target.value as WidgetKey)}
          className="rounded-full border border-black/10 bg-white/90 px-3 py-2 text-sm font-medium text-notion-black shadow-sm backdrop-blur"
          aria-label="Choose the widget shown in this panel"
        >
          {widgetOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="h-full w-full min-h-0 flex-1 p-2 pt-[2px] md:p-3 md:pt-[2px]">
        {renderWidget({ widget, layout: "full", hasLicense })}
      </div>
    </section>
  );
};

const WidgetShowcase = ({ hasLicense = false }: { hasLicense?: boolean }) => {
  const showcaseRef = useRef<HTMLDivElement>(null);
  const rightColumnRef = useRef<HTMLDivElement>(null);
  const [leftRatio, setLeftRatio] = useState(0.58);
  const [topRatio, setTopRatio] = useState(0.5);
  const [panelWidgets, setPanelWidgets] =
    useState<Record<ShowcasePanelKey, WidgetKey>>(initialWidgets);

  const updatePanel = (panel: ShowcasePanelKey, widget: WidgetKey) => {
    setPanelWidgets((current) => ({
      ...current,
      [panel]: widget,
    }));
  };

  const startVerticalResize = (event: React.PointerEvent<HTMLButtonElement>) => {
    event.preventDefault();

    const onPointerMove = (moveEvent: PointerEvent) => {
      const bounds = showcaseRef.current?.getBoundingClientRect();
      if (!bounds) {
        return;
      }

      setLeftRatio(
        getPanelRatioFromPointer(moveEvent.clientX - bounds.left, bounds.width)
      );
    };

    const stopResize = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopResize);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopResize);
  };

  const startHorizontalResize = (
    event: React.PointerEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();

    const onPointerMove = (moveEvent: PointerEvent) => {
      const bounds = rightColumnRef.current?.getBoundingClientRect();
      if (!bounds) {
        return;
      }

      setTopRatio(
        getPanelRatioFromPointer(moveEvent.clientY - bounds.top, bounds.height)
      );
    };

    const stopResize = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", stopResize);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", stopResize);
  };

  return (
    <div className="h-full w-full bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.9),_rgba(239,233,223,1)_38%,_rgba(214,203,185,1)_100%)] p-4 md:p-6">
      <div className="mb-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-black/45">
            Widget Showcase
          </p>
          <h1 className="font-sans text-4xl text-notion-black md:text-6xl">
            Three panels, all configurable
          </h1>
        </div>
        <p className="hidden max-w-sm text-right text-sm text-black/60 md:block">
          Drag the separators to resize the grid. Each panel can display any of
          the three widgets.
        </p>
      </div>

      <div className="flex h-[calc(100%-5rem)] min-h-0 flex-col gap-4 md:hidden">
        {panelOrder.map((panel) => (
          <div key={panel} className="min-h-[280px] flex-1">
            <ShowcasePanel
              widget={panelWidgets[panel]}
              hasLicense={hasLicense}
              onWidgetChange={(widget) => updatePanel(panel, widget)}
            />
          </div>
        ))}
      </div>

      <div
        ref={showcaseRef}
        className="hidden h-[calc(100%-5rem)] min-h-0 md:grid"
        style={{
          gridTemplateColumns: `${leftRatio}fr 14px ${1 - leftRatio}fr`,
        }}
      >
        <ShowcasePanel
          widget={panelWidgets.primary}
          hasLicense={hasLicense}
          onWidgetChange={(widget) => updatePanel("primary", widget)}
        />

        <button
          type="button"
          onPointerDown={startVerticalResize}
          className={cn(
            "showcase-handle mx-auto h-full w-[14px] cursor-col-resize rounded-full border-none bg-transparent p-0",
            leftRatio <= PANEL_MIN_RATIO || leftRatio >= 1 - PANEL_MIN_RATIO
              ? "opacity-60"
              : "opacity-100"
          )}
          aria-label="Resize the left and right showcase panels"
        />

        <div
          ref={rightColumnRef}
          className="grid min-h-0"
          style={{
            gridTemplateRows: `${topRatio}fr 14px ${1 - topRatio}fr`,
          }}
        >
          <ShowcasePanel
            widget={panelWidgets.secondary}
            hasLicense={hasLicense}
            onWidgetChange={(widget) => updatePanel("secondary", widget)}
          />

          <button
            type="button"
            onPointerDown={startHorizontalResize}
            className={cn(
              "showcase-handle my-auto h-[14px] w-full cursor-row-resize rounded-full border-none bg-transparent p-0",
              topRatio <= PANEL_MIN_RATIO || topRatio >= 1 - PANEL_MIN_RATIO
                ? "opacity-60"
                : "opacity-100"
            )}
            aria-label="Resize the top and bottom panels on the right"
          />

          <ShowcasePanel
            widget={panelWidgets.tertiary}
            hasLicense={hasLicense}
            onWidgetChange={(widget) => updatePanel("tertiary", widget)}
          />
        </div>
      </div>
    </div>
  );
};

export default WidgetShowcase;
