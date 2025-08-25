import { useRef } from "react";
import tw from "twin.macro";
import { AutosizeButton } from "./AutosizeButton";
import { AutosizeText } from "./AutosizeText";
const CalendarHeader = ({
  currentMonth,
  currentYear,
  generateCalendar,
  changeMonth,
}: {
  currentMonth: number;
  currentYear: number;
  generateCalendar: (month: number, year: number) => void;
  changeMonth: (month: number) => void;
}) => {
  const monthDisplayRef = useRef<HTMLDivElement>(null);
  const monthYearDialogRef = useRef<HTMLDivElement>(null);
  const monthSelectRef = useRef<HTMLSelectElement>(null);
  const yearSelectRef = useRef<HTMLSelectElement>(null);
  const confirmDateRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

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

  function openMonthYearDialog() {
    // Populate year dropdown if it's not already populated
    const yearSelect = yearSelectRef.current;
    if (yearSelect?.length === 0) {
      for (let i = currentYear - 10; i <= currentYear + 10; i++) {
        const option = new Option(i.toString(), i.toString());
        yearSelect.appendChild(option);
      }
    }
    const monthSelect = monthSelectRef.current;
    if (monthSelect?.length === 0 && yearSelect) {
      for (let i = 0; i < months.length; i++) {
        const option = new Option(months[i], i.toString());
        monthSelect.appendChild(option);
      }
      // Set current month and year as selected
      monthSelect.value = currentMonth.toString();
      yearSelect.value = currentYear.toString();
    }

    // Show the dialog
    if (monthDisplayRef.current) {
      monthDisplayRef.current.style.display = "block";
    }
    if (overlayRef.current) {
      overlayRef.current.style.display = "block";
    }
  }
  function closeDialog() {
    // Hide the dialog
    monthDisplayRef.current!.style.display = "none";
    overlayRef.current!.style.display = "none";
  }
  console.log(
    "currentMonth",
    currentMonth,
    "months[currentMonth]",
    months[currentMonth]
  );
  return (
    <>
      <div
        css={tw`w-full flex justify-between items-center bg-notion-black text-white h-1/5 rounded mb-[2px]`}
      >
        <AutosizeButton
          overrideTw={tw`h-full aspect-1/2 inline-flex items-center`}
          onClick={() => changeMonth(-1)}
        >
          {"<"}
        </AutosizeButton>
        <AutosizeText
          overrideTw={tw`h-full inline-flex items-center`}
          onClick={openMonthYearDialog}
        >
          {`${months[currentMonth]} ${currentYear}`}
        </AutosizeText>
        <AutosizeButton
          overrideTw={tw`h-full aspect-1/2 inline-flex items-center`}
          onClick={() => changeMonth(1)}
        >
          {">"}
        </AutosizeButton>
      </div>
      <div
        ref={monthYearDialogRef}
        className="dialog"
        style={{ display: "none" }}
      >
        <div className="dialog-content">
          <div>
            <select ref={monthSelectRef}></select>
            <select ref={yearSelectRef}></select>
          </div>
          <button
            ref={confirmDateRef}
            onClick={() =>
              generateCalendar(
                parseInt(monthSelectRef.current!.value),
                parseInt(yearSelectRef.current!.value)
              )
            }
          >
            Valider
          </button>
        </div>
      </div>
      <div ref={overlayRef} className="overlay" onClick={closeDialog}></div>
    </>
  );
};
export default CalendarHeader;
