import React, { useEffect, useRef, useState } from "react";
import { SquareContainer } from "./SquareContainer";
const FlipNumber = ({ number }: { number: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  useEffect(() => {
    if (ref?.current) {
      setContainerWidth(ref.current.offsetWidth);
      setContainerHeight(ref.current.offsetHeight);
    }
  }, [ref?.current]);
  return (
    <div
      ref={ref}
      className="bg-[#2a2a2a] flex flex-1 items-center justify-center font-bold relative w-auto  rounded-[4px] leading-none"
      style={{ fontSize: containerWidth > containerHeight ? `35vh` : `35vw` }}
    >
      {String(number).padStart(2, "0")}
    </div>
  );
};

const FlipDate = ({ text }: { text: string | number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  useEffect(() => {
    if (ref?.current) {
      setContainerWidth(ref.current.offsetWidth);
      setContainerHeight(ref.current.offsetHeight);
    }
  }, [ref?.current]);
  return (
    <div
      ref={ref}
      className="bg-[#2a2a2a] flex flex-1 items-center justify-center font-bold relative w-auto  rounded-[4px] leading-none"
      style={{ fontSize: containerWidth > containerHeight ? `15vh` : `15vw` }}
    >
      {text}
    </div>
  );
};

const FlipClock = () => {
  const clockRef = useRef<HTMLDivElement>(null);
  const [timeFontSize, setTimeFontSize] = React.useState(0);
  const [dateFontSize, setDateFontSize] = React.useState(0);

  useEffect(() => {
    const updateFontSize = () => {
      if (clockRef.current) {
        const containerHeight = clockRef.current.offsetHeight;
        const containerWidth = clockRef.current.offsetWidth;

        // Calculate font sizes based on container dimensions
        // Using the smaller of height-based or width-based calculation
        const timeHeight = containerHeight * 0.7; // 70% of container height for time section
        const dateHeight = containerHeight * 0.3; // 30% of container height for date section

        const timeSizeFromHeight = timeHeight * 0.6;
        const timeSizeFromWidth = containerWidth * 0.6;
        const newTimeSize = Math.min(timeSizeFromHeight, timeSizeFromWidth);

        const dateSizeFromHeight = dateHeight * 0.6;
        const dateSizeFromWidth = containerWidth * 0.6;
        const newDateSize = Math.min(dateSizeFromHeight, dateSizeFromWidth);

        setTimeFontSize(Math.floor(newTimeSize));
        setDateFontSize(Math.floor(newDateSize));
      }
    };

    // Initial size calculation
    updateFontSize();

    // Add resize listener
    window.addEventListener("resize", updateFontSize);

    // Cleanup
    return () => window.removeEventListener("resize", updateFontSize);
  }, []);

  const date = new Date();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const day = date.getDate();
  const month = date
    .toLocaleString("fr-FR", { month: "short" })
    .replace(".", "")
    .toUpperCase();
  const year = date.getUTCFullYear();

  return (
    <SquareContainer>
      <div
        className="flex flex-col w-full h-full gap-[2px] text-white rounded-sm"
        ref={clockRef}
      >
        <div className="h-[70%] gap-[2px] flex justify-center rounded-sm">
          <FlipNumber number={hours} />
          <FlipNumber number={minutes} />
        </div>
        <div className="h-[30%] flex justify-center gap-[2px] rounded-[4px]">
          <FlipDate text={day} />
          <FlipDate text={month} />
          <FlipDate text={year} />
        </div>
      </div>
    </SquareContainer>
  );
};

export default FlipClock;
