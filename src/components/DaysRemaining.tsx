import { useEffect, useState, MouseEvent } from "react";
import "../index.css";
import { CenteredPopover } from "./CenteredPopover";
import Calendar from "./Calendar";
import { WidgetLayout } from "@/lib/view-config";
import {
  formatDaysRemainingLabel,
  getDaysRemainingFontScale,
} from "@/lib/days-remaining";

export const DaysRemaining = ({
  layout = "square",
  hasLicense = false,
  allowThemeEditor = true,
  showBranding,
}: {
  layout?: WidgetLayout;
  hasLicense?: boolean;
  allowThemeEditor?: boolean;
  showBranding?: boolean;
}) => {
  const [showPop, setShowPop] = useState(false);
  const [targetDate, setTargetDate] = useState<Date>();
  const [daysRemaining, setDaysRemaining] = useState<number>();

  const onDateSelected = (event: MouseEvent, date: Date) => {
    event.preventDefault();
    event.stopPropagation();
    setTargetDate(date);
    localStorage.setItem("date", date.toDateString());
    setShowPop(false);
  };

  useEffect(() => {
    const updateDaysRemaining = () => {
      if (!targetDate) {
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const target = new Date(targetDate);
      target.setHours(0, 0, 0, 0);

      const timeDiff = target.valueOf() - today.valueOf();
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      setDaysRemaining(daysDiff);
    };

    updateDaysRemaining();

    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const timeUntilMidnight = midnight.getTime() - now.getTime();

    const midnightTimeout = setTimeout(() => {
      updateDaysRemaining();
      const dailyInterval = setInterval(updateDaysRemaining, 86400000);
      return () => clearInterval(dailyInterval);
    }, timeUntilMidnight);

    return () => clearTimeout(midnightTimeout);
  }, [targetDate]);

  useEffect(() => {
    const savedDate = localStorage.getItem("date");
    if (savedDate) {
      const date = new Date(savedDate);
      if (!Number.isNaN(date.getTime())) {
        setTargetDate(date);
      }
    }
  }, []);

  const label = formatDaysRemainingLabel(daysRemaining);

  return (
    <CenteredPopover
      textContent={label}
      textFontScale={getDaysRemainingFontScale(label)}
      showPop={showPop}
      layout={layout}
      hasLicense={hasLicense}
      allowThemeEditor={allowThemeEditor}
      showBranding={showBranding}
      onPopTrigger={(event: React.MouseEvent) => {
        event.preventDefault();
        if (!showPop) {
          setShowPop(true);
        }
      }}
      onClickOutside={() => setShowPop(false)}
    >
      <Calendar
        layout="full"
        hasLicense={hasLicense}
        allowThemeEditor={false}
        showBranding={false}
        onDateSelected={onDateSelected}
      />
    </CenteredPopover>
  );
};
