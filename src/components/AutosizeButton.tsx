import { MouseEventHandler, useRef, useState } from "react";
import { SerializedStyles } from "@emotion/react";
import useResizeObserver from "../hook/useResizeObserver";
import { ClassNameValue } from "tailwind-merge";
import { cn } from "@/lib/utils";

export const AutosizeButton = ({
  overrideTw,
  overrideCss,
  heightRatio = 0.5,
  onClick,
  children,
}: {
  overrideTw?: ClassNameValue;
  overrideCss?: SerializedStyles;
  heightRatio?: number;
  onClick?: MouseEventHandler;
  children?: string;
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [fontSize, setFontSize] = useState(0);

  useResizeObserver(ref, () => {
    if (ref.current) {
      console.log(
        "Autosize text useResizeObserver",
        ref.current.clientHeight * heightRatio
      );
      setFontSize(ref.current.clientHeight * heightRatio);
    }
  });

  return (
    <button
      ref={ref}
      className={cn(
        "p-0 flex justify-center items-center text-white bg-transparent",
        overrideTw
      )}
      style={{
        fontSize: `${fontSize}px`,
        ...overrideCss,
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
