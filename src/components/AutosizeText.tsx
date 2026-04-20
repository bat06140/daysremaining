import { CSSProperties, forwardRef, useRef } from "react";
import { css, SerializedStyles } from "@emotion/react";
import { cn } from "@/lib/utils";
import { ClassValue } from "clsx";
import { useAutoFitFontSize } from "@/hook/useAutoFitFontSize";

export interface AutosizeTextProps {
  wrapperTw?: ClassValue;
  wrapperStyle?: CSSProperties;
  overrideTw?: ClassValue;
  overrideCss?: SerializedStyles;
  heightRatio?: number;
  fontScale?: number;
  fontSize?: number;
  onFontSizeChange?: (fontSize: number) => void;
  onClick?: React.MouseEventHandler<HTMLElement>;
  onMouseEnter?: React.MouseEventHandler<HTMLElement>;
  onMouseLeave?: React.MouseEventHandler<HTMLElement>;
  children?: string;
}
export const AutosizeText = forwardRef<HTMLParagraphElement, AutosizeTextProps>(
  (props, ref) => {
    const {
      wrapperTw,
      wrapperStyle,
      overrideTw,
      overrideCss,
      heightRatio = 0.5,
      fontScale = 1,
      fontSize,
      onFontSizeChange,
      onClick,
      onMouseEnter,
      onMouseLeave,
      children,
    } = props;
    const spanRef = useRef<HTMLSpanElement | null>(null);

    const measuredFontSize = useAutoFitFontSize(spanRef, {
      maxHeightRatio: heightRatio,
      fontScale,
      watch: children,
      onFontSizeChange,
    });

    return (
      <p
        ref={(node) => {
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        className={cn(
          "grid h-full w-full place-items-center overflow-hidden",
          wrapperTw
        )}
        style={wrapperStyle}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <span
          ref={spanRef}
          className={cn(
            "block whitespace-nowrap text-center leading-none",
            overrideTw
          )}
          css={css`
            font-size: ${fontSize ?? measuredFontSize ?? 0}px;
            ${overrideCss}
          `}
        >
          {children}
        </span>
      </p>
    );
  }
);
