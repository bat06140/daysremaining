import { CSSProperties, MouseEventHandler, useRef } from "react";
import { cn } from "../lib/utils.js";
import { ClassValue } from "clsx";
import { useAutoFitFontSize } from "../hook/useAutoFitFontSize.js";

export const AutosizeButton = ({
  overrideTw,
  overrideCss,
  heightRatio = 0.5,
  onClick,
  children,
}: {
  overrideTw?: ClassValue;
  overrideCss?: CSSProperties;
  heightRatio?: number;
  onClick?: MouseEventHandler;
  children?: string;
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const fontSize = useAutoFitFontSize(ref, {
    maxHeightRatio: heightRatio,
    watch: children,
  });

  return (
    <button
      ref={ref}
      className={cn(
        "flex items-center justify-center bg-transparent p-0 text-current leading-none",
        overrideTw
      )}
      style={{
        fontSize: fontSize ? `${fontSize}px` : undefined,
        ...overrideCss,
      }}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
