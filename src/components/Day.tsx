import clsx from "clsx";
import { AutosizeText } from "./AutosizeText";
import { WidgetTheme } from "@/lib/widget-theme";
import { getCalendarDayAppearance } from "@/lib/calendar-theme";

export const Day = ({
  isWeekdayHeader = false,
  isToday = false,
  isOtherMonth = false,
  onClick,
  theme,
  children,
}: {
  isWeekdayHeader?: boolean;
  isToday?: boolean;
  isOtherMonth?: boolean;
  hoverEnabled?: boolean;
  date?: Date;
  onClick?: React.MouseEventHandler<HTMLElement>;
  theme: WidgetTheme;
  children: string;
}) => {
  const appearance = getCalendarDayAppearance(theme, {
    isWeekdayHeader,
    isToday,
    isOtherMonth,
  });

  return (
    <div className="w-full h-full flex items-center justify-center">
      <AutosizeText
        wrapperTw={clsx(
          "h-full w-full rounded-[8px]",
          "border border-[var(--day-border)] bg-[var(--day-bg)] text-[var(--day-text)] transition-colors",
          appearance.borderStyle === "none" && "border-transparent",
          appearance.borderStyle === "solid" && "border-solid",
          appearance.interactive &&
            "hover:border-[var(--day-hover-border)] hover:border-dashed hover:bg-[var(--day-hover-bg)] hover:text-[var(--day-hover-text)]"
        )}
        wrapperStyle={{
          ["--day-bg" as string]: appearance.backgroundColor,
          ["--day-text" as string]: appearance.textColor,
          ["--day-border" as string]: appearance.borderColor,
          ["--day-hover-border" as string]: appearance.hoverBorderColor,
          ["--day-hover-bg" as string]: appearance.hoverBackgroundColor,
          ["--day-hover-text" as string]: appearance.hoverTextColor,
        }}
        heightRatio={isWeekdayHeader ? 0.46 : 0.7}
        onClick={onClick}
      >
        {children}
      </AutosizeText>
    </div>
  );
};
