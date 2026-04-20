import { useEffect, useRef, useState } from "react";
import { css } from "@emotion/react";
import { ChevronDown } from "lucide-react";
import { AutosizeButton } from "./AutosizeButton";
import { AutosizeText } from "./AutosizeText";
import { getSharedFittingFontSize } from "@/lib/font-fit";
import { WidgetTheme } from "@/lib/widget-theme";

type HeaderLabelKey = "month" | "year";
type HeaderMenuKey = HeaderLabelKey | null;

const HeaderSelectButton = ({
  label,
  textColor,
  isOpen,
  onClick,
  fontSize,
  onFontSizeChange,
}: {
  label: string;
  textColor: string;
  isOpen: boolean;
  onClick: () => void;
  fontSize?: number;
  onFontSizeChange?: (fontSize: number) => void;
}) => {
  return (
    <button
      type="button"
      className="relative flex h-full w-full min-w-0 items-center rounded-[8px] px-1"
      onClick={onClick}
    >
      <div className="pointer-events-none absolute inset-0 pr-6">
        <AutosizeText
          wrapperTw="px-1"
          overrideTw="font-sans font-medium uppercase tracking-[0.08em]"
          overrideCss={css`
            color: ${textColor};
          `}
          heightRatio={0.74}
          fontScale={0.93}
          fontSize={fontSize ?? 22}
          onFontSizeChange={onFontSizeChange}
        >
          {label}
        </AutosizeText>
      </div>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute inset-y-0 right-0.5 my-auto transition-transform"
        style={{
          color: textColor,
          transform: `rotate(${isOpen ? 180 : 0}deg)`,
        }}
      />
    </button>
  );
};

const CalendarHeader = ({
  currentMonth,
  currentYear,
  generateCalendar,
  changeMonth,
  theme,
}: {
  currentMonth: number;
  currentYear: number;
  generateCalendar: (month: number, year: number) => void;
  changeMonth: (month: number) => void;
  theme: WidgetTheme;
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [openMenu, setOpenMenu] = useState<HeaderMenuKey>(null);
  const [menuMaxHeight, setMenuMaxHeight] = useState(180);
  const [measuredSizes, setMeasuredSizes] = useState<
    Record<HeaderLabelKey, number | undefined>
  >({
    month: undefined,
    year: undefined,
  });

  useEffect(() => {
    if (!openMenu) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpenMenu(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [openMenu]);

  useEffect(() => {
    const updateMenuMaxHeight = () => {
      const container = containerRef.current;
      const parent = container?.parentElement;

      if (!container || !parent) {
        return;
      }

      const availableHeight =
        parent.clientHeight - container.offsetTop - container.offsetHeight - 2;
      setMenuMaxHeight(Math.max(72, availableHeight));
    };

    updateMenuMaxHeight();

    const resizeObserver = new ResizeObserver(updateMenuMaxHeight);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    if (containerRef.current?.parentElement) {
      resizeObserver.observe(containerRef.current.parentElement);
    }

    window.addEventListener("resize", updateMenuMaxHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateMenuMaxHeight);
    };
  }, []);

  const months = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre",
  ];
  const years = Array.from(
    { length: 21 },
    (_, index) => currentYear - 10 + index
  );
  const textColor = theme.color2;
  const monthLabel = months[currentMonth];
  const yearLabel = currentYear.toString();
  const sharedFontSize = getSharedFittingFontSize([
    measuredSizes.month,
    measuredSizes.year,
  ]);

  const updateMeasuredSize = (key: HeaderLabelKey, fontSize: number) => {
    setMeasuredSizes((current) =>
      current[key] === fontSize ? current : { ...current, [key]: fontSize }
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative flex h-1/5 w-full items-center justify-between rounded-[8px] px-3"
      style={{
        backgroundColor: theme.color1,
        color: textColor,
      }}
    >
      <AutosizeButton
        overrideTw="h-full aspect-1/2 inline-flex items-center text-current"
        overrideCss={{ color: textColor }}
        onClick={() => changeMonth(-1)}
      >
        {"<"}
      </AutosizeButton>

      <div className="flex h-full min-w-0 flex-1 items-center justify-center gap-2 px-2">
        <div className="relative flex h-full min-w-0 flex-[1.2] items-center">
          <HeaderSelectButton
            label={monthLabel}
            textColor={textColor}
            isOpen={openMenu === "month"}
            fontSize={sharedFontSize}
            onFontSizeChange={(fontSize) =>
              updateMeasuredSize("month", fontSize)
            }
            onClick={() =>
              setOpenMenu((current) => (current === "month" ? null : "month"))
            }
          />
          {openMenu === "month" && (
            <div
              className="absolute left-0 top-full z-30 mt-[2px] w-full overflow-y-auto rounded-[8px] border shadow-[0_12px_30px_rgba(0,0,0,0.18)]"
              style={{
                backgroundColor: theme.color2,
                borderColor: theme.color1,
                maxHeight: `${menuMaxHeight}px`,
              }}
            >
              {months.map((month, index) => (
                <button
                  key={month}
                  type="button"
                  className="w-full px-3 py-2 text-left font-sans text-[18px] leading-none uppercase"
                  style={{
                    color: theme.color1,
                    backgroundColor:
                      index === currentMonth ? theme.color1 : theme.color2,
                    WebkitTextFillColor:
                      index === currentMonth ? theme.color2 : theme.color1,
                  }}
                  onClick={() => {
                    generateCalendar(index, currentYear);
                    setOpenMenu(null);
                  }}
                >
                  {month}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative flex h-full min-w-0 flex-[0.8] items-center">
          <HeaderSelectButton
            label={yearLabel}
            textColor={textColor}
            isOpen={openMenu === "year"}
            fontSize={sharedFontSize}
            onFontSizeChange={(fontSize) =>
              updateMeasuredSize("year", fontSize)
            }
            onClick={() =>
              setOpenMenu((current) => (current === "year" ? null : "year"))
            }
          />
          {openMenu === "year" && (
            <div
              className="absolute left-0 top-full z-30 mt-[2px] w-full overflow-y-auto rounded-[8px] border shadow-[0_12px_30px_rgba(0,0,0,0.18)]"
              style={{
                backgroundColor: theme.color2,
                borderColor: theme.color1,
                maxHeight: `${menuMaxHeight}px`,
              }}
            >
              {years.map((year) => (
                <button
                  key={year}
                  type="button"
                  className="w-full px-3 py-2 text-left font-sans text-[18px] leading-none uppercase"
                  style={{
                    color: theme.color1,
                    backgroundColor:
                      year === currentYear ? theme.color1 : theme.color2,
                    WebkitTextFillColor:
                      year === currentYear ? theme.color2 : theme.color1,
                  }}
                  onClick={() => {
                    generateCalendar(currentMonth, year);
                    setOpenMenu(null);
                  }}
                >
                  {year}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <AutosizeButton
        overrideTw="h-full aspect-1/2 inline-flex items-center text-current"
        overrideCss={{ color: textColor }}
        onClick={() => changeMonth(1)}
      >
        {">"}
      </AutosizeButton>
    </div>
  );
};

export default CalendarHeader;
