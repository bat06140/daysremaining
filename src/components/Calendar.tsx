import { useRef, useState } from "react";
import CalendarHeader from "./CalendarHeader";
import { Day } from "./Day";
import { css } from "@emotion/react";
import { SquareContainer } from "./SquareContainer";

const Calendar = ({
  showCopyright = true,
  onDateSelected,
}: {
  showCopyright?: boolean;
  onDateSelected?: (event: React.MouseEvent, date: Date) => void;
}) => {
  const gridRef = useRef<HTMLDivElement>(null);

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  const daysOfWeek = ["LUN", "MAR", "MER", "JEU", "VEN", "SAM", "DIM"];

  function generateCalendar(month: number, year: number) {
    console.log("generateCalendar", month, year);
    setCurrentMonth(month);
    setCurrentYear(year);
  }

  function getDaysFromPreviousMonth(month: number, year: number) {
    let firstDay = new Date(year, month, 1).getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1; // Ajuster si la semaine commence le lundi
    // Calculer le nombre de jours à afficher pour le mois précédent
    const daysFromPrevMonth = firstDay;
    const prevMonthDays = new Date(year, month, 0).getDate();
    const prevMonthDaysInCalendar = [];
    for (let i = daysFromPrevMonth; i > 0; i--) {
      prevMonthDaysInCalendar.push(prevMonthDays - i + 1);
    }
    return prevMonthDaysInCalendar;
  }

  function getDaysFromCurrentMonth(month: number, year: number) {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInMonthInCalendar = [];
    for (let i = 1; i <= daysInMonth; i++) {
      daysInMonthInCalendar[i - 1] = i;
    }
    return daysInMonthInCalendar;
  }
  function getDaysFromNextMonth(
    daysFromPreviousMonth: number,
    daysFromCurrentMonth: number
  ) {
    const daysInNextMonthCount =
      42 - daysFromPreviousMonth - daysFromCurrentMonth;
    const daysInNextMonth = [];
    for (let i = 1; i <= daysInNextMonthCount; i++) {
      daysInNextMonth[i - 1] = i;
    }
    return daysInNextMonth;
  }

  function changeMonth(month: number) {
    let newMonth = currentMonth + month;
    let newYear = currentYear;
    if (newMonth < 0) {
      newMonth = 11;
      setCurrentMonth(newMonth);
      newYear = currentYear - 1;
      setCurrentYear(newYear);
    } else if (newMonth > 11) {
      newMonth = 0;
      setCurrentMonth(newMonth);
      newYear = currentYear + 1;
      setCurrentYear(newYear);
    } else {
      setCurrentMonth(newMonth);
    }
  }

  const daysFromPreviousMonth = getDaysFromPreviousMonth(
    currentMonth,
    currentYear
  );
  const daysFromCurrentMonth = getDaysFromCurrentMonth(
    currentMonth,
    currentYear
  );
  const daysFromNextMonth = getDaysFromNextMonth(
    daysFromPreviousMonth.length,
    daysFromCurrentMonth.length
  );

  return (
    <SquareContainer>
      <CalendarHeader
        currentMonth={currentMonth}
        currentYear={currentYear}
        generateCalendar={generateCalendar}
        changeMonth={changeMonth}
      />
      <div
        ref={gridRef}
        css={css`
          grid-template-rows: repeat(7, minmax(0, 1fr));
        `}
        className="border border-notion-light-gray-border flex-grow-7 grid w-full h-4/5 grid-cols-7 p-1 rounded-sm box-border"
      >
        {daysOfWeek.map((day, index) => (
          <Day key={index}>{day}</Day>
        ))}
        {daysFromPreviousMonth.map((day, index) => (
          <Day
            key={index}
            isOtherMonth={true}
            onClick={(e: React.MouseEvent) => {
              onDateSelected?.(e, new Date(currentYear, currentMonth - 1, day));
            }}
          >
            {day.toString()}
          </Day>
        ))}
        {daysFromCurrentMonth.map((day, index) => {
          const isToday =
            day === new Date().getDate() &&
            currentMonth === new Date().getMonth() &&
            currentYear === new Date().getFullYear();
          return (
            <Day
              key={index}
              isToday={isToday}
              onClick={(e: React.MouseEvent) => {
                onDateSelected?.(e, new Date(currentYear, currentMonth, day));
              }}
            >
              {day.toString()}
            </Day>
          );
        })}
        {daysFromNextMonth.map((day, index) => (
          <Day
            key={index}
            isOtherMonth={true}
            onClick={(e: React.MouseEvent) => {
              onDateSelected?.(e, new Date(currentYear, currentMonth + 1, day));
            }}
          >
            {day.toString()}
          </Day>
        ))}
      </div>
      {showCopyright && (
        <div className="flex w-full h-12 mt-[2px] flex-col bg-black text-white rounded-[4px] justify-center items-center font-mono text-xl">
          <a href="https://atomicskills.academy">© Atomic Skills Academy</a>
        </div>
      )}
    </SquareContainer>
  );
};
export default Calendar;
