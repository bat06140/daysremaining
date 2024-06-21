import React, { useState, useEffect, useRef } from "react";
import { formatDate, parseDate } from "./utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import Calendar from "./Calendar";
import tw from "twin.macro";

export const DaysRemaining = () => {
  const [showDateInput, setShowDateInput] = useState(false);
  const [targetDate, setTargetDate] = useState<Date>();
  const [daysRemaining, setDaysRemaining] = useState<number>();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = parseDate(e.target.value);
    if (date) {
      setTargetDate(date);
    }
  };
  const updateDaysRemaining = () => {
    if (targetDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // start of today
      const target = new Date(targetDate);
      target.setHours(0, 0, 0, 0); // start of target day
      const timeDiff = target.valueOf() - today.valueOf();
      const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
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

  const onClick = () => {
    console.log("Test");
    setShowDateInput(true);
  };
  useEffect(() => {
    if (showDateInput) {
      inputRef.current?.showPicker();
    }
  }, [showDateInput]);
  return (
    <div className="flex flex-col items-center p-6 rounded-lg shadow-lg bg-gray-100">
      <Popover>
        <PopoverTrigger asChild>
          <div className="cursor-pointer p-2 text-lg border rounded bg-white" onClick={onClick}>
            {targetDate ? `J-${daysRemaining}` : "Choisir une date"}
          </div>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar />
        </PopoverContent>
      </Popover>
    </div>
  );
};
