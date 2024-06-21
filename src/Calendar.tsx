import { useEffect, useRef, useState } from "react";
import CalendarHeader from "./CalendarHeader";
import { Day } from "./Day";
import { useWindowSize } from "./hook/useWindowSizeHook";
import { css } from "@emotion/react";
import tw from "twin.macro";

const Calendar = () => {
  const gridRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  // useWindowSize(() => {
  //   adjustAspectRatio();
  // });
  // useEffect(() => {
  //   adjustAspectRatio();
  // });
  function adjustAspectRatio() {
    console.log("Adjust ratio");
    if (calendarRef.current) {
      const aspectRatio = 0.9; // Example aspect ratio, change as needed
      const windowWidth = calendarRef.current.parentElement!.offsetWidth;
      const windowHeight = calendarRef.current.parentElement!.offsetHeight;
      const windowRatio = windowWidth / windowHeight;

      console.log("win width", windowWidth);
      console.log("win height", windowHeight);

      if (windowRatio > aspectRatio) {
        // Window is wider than the desired aspect ratio
        calendarRef.current.style.width = `${windowHeight * aspectRatio}px`;
        calendarRef.current.style.height = `${windowHeight}px`;
      } else {
        // Window is taller than the desired aspect ratio
        calendarRef.current.style.width = `${windowWidth}px`;
        calendarRef.current.style.height = `${windowWidth / aspectRatio}px`;
      }
    }
  }
  adjustAspectRatio();
  useEffect(() => {
    const component = calendarRef.current;

    const observer = new ResizeObserver(() => {
      adjustAspectRatio();
    });

    if (component) {
      observer.observe(component);
    }

    // Cleanup observer on component unmount
    return () => {
      if (component) {
        observer.unobserve(component);
      }
    };
  }, [calendarRef]);

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
  function getDaysFromNextMonth(daysFromPreviousMonth: number, daysFromCurrentMonth: number) {
    const daysInNextMonthCount = 42 - daysFromPreviousMonth - daysFromCurrentMonth;
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

  const daysFromPreviousMonth = getDaysFromPreviousMonth(currentMonth, currentYear);
  const daysFromCurrentMonth = getDaysFromCurrentMonth(currentMonth, currentYear);
  const daysFromNextMonth = getDaysFromNextMonth(daysFromPreviousMonth.length, daysFromCurrentMonth.length);

  return (
    <div css={tw`w-full h-full flex flex-col`} ref={calendarRef}>
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
        className="border border-notion-light-gray-border  flex-grow-7 grid w-full h-4/5 grid-cols-7 p-1 rounded-b box-border"
      >
        {daysOfWeek.map((day, index) => (
          <Day key={index}>{day}</Day>
        ))}
        {daysFromPreviousMonth.map((day, index) => (
          <Day key={index} isOtherMonth={true}>
            {day.toString()}
          </Day>
        ))}
        {daysFromCurrentMonth.map((day, index) => {
          const isToday =
            day === new Date().getDate() &&
            currentMonth === new Date().getMonth() &&
            currentYear === new Date().getFullYear();
          return (
            <Day key={index} isToday={isToday}>
              {day.toString()}
            </Day>
          );
        })}
        {daysFromNextMonth.map((day, index) => (
          <Day key={index} isOtherMonth={true}>
            {day.toString()}
          </Day>
        ))}
      </div>
    </div>
  );
};
export default Calendar;
