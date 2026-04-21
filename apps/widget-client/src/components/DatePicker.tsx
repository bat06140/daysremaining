import React, { useState, useRef } from "react";

const DatePicker: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <input
      type="date"
      value={selectedDate || ""}
      onChange={e => setSelectedDate(e.target.value)}
      placeholder="Select a date"
      ref={inputRef}
      className="text-3xl font-bold mb-4 text-gray-700"
    />
  );
};

export default DatePicker;
