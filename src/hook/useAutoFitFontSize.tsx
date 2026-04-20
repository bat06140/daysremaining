import { RefObject, useEffect, useState } from "react";
import {
  findLargestFittingFontSize,
  scaleFontSize,
  stabilizeFontSize,
} from "@/lib/font-fit";

interface UseAutoFitFontSizeOptions {
  maxHeightRatio?: number;
  maxFontSize?: number;
  minFontSize?: number;
  fontScale?: number;
  watch?: string | number | undefined;
  onFontSizeChange?: (fontSize: number) => void;
}

export const useAutoFitFontSize = (
  ref: RefObject<HTMLElement | null>,
  options: UseAutoFitFontSizeOptions = {}
) => {
  const {
    maxHeightRatio = 1,
    maxFontSize = Number.POSITIVE_INFINITY,
    minFontSize = 12,
    fontScale = 1,
    watch,
    onFontSizeChange,
  } = options;
  const [fontSize, setFontSize] = useState<number>();

  useEffect(() => {
    const element = ref.current;
    const parent = element?.parentElement;

    if (!element || !parent) {
      return;
    }

    let frameId = 0;
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    const parsePixels = (value: string) => {
      const parsed = Number.parseFloat(value);
      return Number.isFinite(parsed) ? parsed : 0;
    };

    const buildFontDeclaration = (
      fontSize: number,
      styles: CSSStyleDeclaration
    ) => {
      const fontStyle = styles.fontStyle || "normal";
      const fontVariant = styles.fontVariant || "normal";
      const fontWeight = styles.fontWeight || "400";
      const fontFamily = styles.fontFamily || "sans-serif";

      return `${fontStyle} ${fontVariant} ${fontWeight} ${fontSize}px ${fontFamily}`;
    };

    const fit = () => {
      if (!context) {
        return;
      }

      const availableWidth = parent.clientWidth;
      const availableHeight = parent.clientHeight;

      if (availableWidth <= 0 || availableHeight <= 0) {
        return;
      }

      const styles = window.getComputedStyle(element);
      const text = element.textContent?.trim() ?? "";
      const paddingX =
        parsePixels(styles.paddingLeft) + parsePixels(styles.paddingRight);
      const paddingY =
        parsePixels(styles.paddingTop) + parsePixels(styles.paddingBottom);
      const letterSpacing = parsePixels(styles.letterSpacing);
      const explicitLineHeight = parsePixels(styles.lineHeight);
      const maxSize = Math.floor(
        Math.min((availableHeight - paddingY) * maxHeightRatio, maxFontSize)
      );

      if (!text || maxSize <= 0) {
        return;
      }

      const nextSize = findLargestFittingFontSize({
        minSize: minFontSize,
        maxSize,
        fits: (candidate) => {
          context.font = buildFontDeclaration(candidate, styles);
          const metrics = context.measureText(text);
          const paintedWidth = Math.max(
            metrics.width,
            metrics.actualBoundingBoxLeft + metrics.actualBoundingBoxRight
          );
          const paintedHeight = Math.max(
            candidate,
            metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
          );
          const measuredWidth =
            paintedWidth + Math.max(0, text.length - 1) * letterSpacing;
          const measuredHeight = Math.max(paintedHeight, explicitLineHeight);

          return (
            measuredWidth <= Math.max(0, availableWidth - paddingX) &&
            measuredHeight <= Math.max(0, availableHeight - paddingY)
          );
        },
      });

      const scaledSize = scaleFontSize(nextSize, fontScale, minFontSize);
      setFontSize((current) => {
        const stabilizedSize = stabilizeFontSize(current, scaledSize);
        onFontSizeChange?.(stabilizedSize);
        return current === stabilizedSize ? current : stabilizedSize;
      });
    };

    const scheduleFit = () => {
      cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(fit);
    };

    scheduleFit();

    const resizeObserver = new ResizeObserver(scheduleFit);
    resizeObserver.observe(parent);

    window.addEventListener("resize", scheduleFit);
    void document.fonts?.ready.then(scheduleFit);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleFit);
    };
  }, [
    ref,
    maxHeightRatio,
    maxFontSize,
    minFontSize,
    fontScale,
    watch,
    onFontSizeChange,
  ]);

  return fontSize;
};
