import { useEffect, useState, MouseEvent } from "react";
import "../index.css";
import { CenteredPopover } from "./CenteredPopover";
import Calendar from "./Calendar";
import { WidgetLayout } from "@/lib/view-config";

export const DaysRemaining = ({
  layout = "square",
  showCopyright = true,
}: {
  layout?: WidgetLayout;
  showCopyright?: boolean;
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

  return (
    <CenteredPopover
      textContent={
        daysRemaining != undefined && daysRemaining >= 0
          ? `J-${daysRemaining}`
          : "J-?"
      }
      showPop={showPop}
      layout={layout}
      showCopyright={showCopyright}
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
        showCopyright={false}
        onDateSelected={onDateSelected}
      />
    </CenteredPopover>
  );
};
