import { useState, useEffect, MouseEvent } from "react";
import "../index.css";
import { CenteredPopover } from "./CenteredPopover";
import { SquareContainer } from "./SquareContainer";
import Calendar from "./Calendar";
export const DaysRemaining = () => {
  const [showPop, setShowPop] = useState(false);

  const [targetDate, setTargetDate] = useState<Date>();
  const [daysRemaining, setDaysRemaining] = useState<number>();

  const onDateSelected = (event: MouseEvent, date: Date) => {
    console.log("daysremaining on date selected", date);
    event.preventDefault();
    event.stopPropagation();
    setTargetDate(date);
    localStorage.setItem("date", date.toDateString());
    setShowPop(false);
  };
  const updateDaysRemaining = () => {
    if (targetDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // start of today
      const target = new Date(targetDate);
      target.setHours(0, 0, 0, 0); // start of target day
      const timeDiff = target.valueOf() - today.valueOf();
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      console.log(
        "updateDaysRemaining today",
        today,
        "target",
        target,
        "daysDiff",
        daysDiff
      );
      setDaysRemaining(daysDiff);
    }
  };

  useEffect(() => {
    updateDaysRemaining();

    const now = new Date();
    const nextMidnight = new Date(now);
    nextMidnight.setDate(now.getDate() + 1);
    nextMidnight.setHours(0, 0, 0, 0);
    const timeUntilMidnight = nextMidnight.valueOf() - now.valueOf();

    const midnightTimeout = setTimeout(() => {
      updateDaysRemaining();
      const dailyInterval = setInterval(updateDaysRemaining, 86400000); // Update every day
      return () => clearInterval(dailyInterval);
    }, timeUntilMidnight);

    return () => clearTimeout(midnightTimeout);
  }, [targetDate]);

  useEffect(() => {
    const savedDate = localStorage.getItem("date");
    if (savedDate) {
      const date = new Date(savedDate);
      if (date) {
        setTargetDate(date);
      }
    }
  }, []);
  return (
    <SquareContainer>
      <div className="flex flex-col w-full h-full gap-4">
        <CenteredPopover
          textContent={
            daysRemaining != undefined && daysRemaining >= 0
              ? `J-${daysRemaining}`
              : "J-?"
          }
          showPop={showPop}
          onPopTrigger={(event: React.MouseEvent) => {
            event.preventDefault();
            if (!showPop) {
              setShowPop(true);
            }
          }}
          onClickOutside={() => setShowPop(false)}
        >
          <Calendar showCopyright={false} onDateSelected={onDateSelected} />
        </CenteredPopover>
      </div>
    </SquareContainer>
  );
};
