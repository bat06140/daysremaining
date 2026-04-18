import { forwardRef, useRef } from "react";
import { css, SerializedStyles } from "@emotion/react";
import { cn } from "@/lib/utils";
import { ClassValue } from "clsx";
import { useAutoFitFontSize } from "@/hook/useAutoFitFontSize";

export interface AutosizeTextProps {
  overrideTw?: ClassValue;
  overrideCss?: SerializedStyles;
  heightRatio?: number;
  onClick?: React.MouseEventHandler<HTMLElement>;
  children?: string;
}
export const AutosizeText = forwardRef<HTMLParagraphElement, AutosizeTextProps>(
  (props, ref) => {
    const {
      overrideTw,
      overrideCss,
      heightRatio = 0.5,
      onClick,
      children,
    } = props;
    const pRef = useRef<HTMLParagraphElement | null>(null);

    useAutoFitFontSize(pRef, {
      maxHeightRatio: heightRatio,
      watch: children,
    });

    return (
      <p
        ref={(node) => {
          pRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={cn(
          "flex h-full w-full items-center justify-center overflow-hidden whitespace-nowrap leading-none",
          overrideTw
        )}
        css={css`
          ${overrideCss}
        `}
        onClick={onClick}
      >
        {children}
      </p>
    );
  }
);
