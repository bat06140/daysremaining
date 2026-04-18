import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { WidgetLayout } from "@/lib/view-config";

interface SquareContainerProps {
  className?: string;
  style?: React.CSSProperties;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  children: React.ReactNode;
  layout?: WidgetLayout;
}

export const SquareContainer = React.forwardRef<
  HTMLDivElement,
  SquareContainerProps
>(({ className = "", style, onClick, children, layout = "square" }, forwardedRef) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync the forwarded ref with our local ref
  React.useImperativeHandle(forwardedRef, () => containerRef.current!);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;

    if (layout === "full") {
      container.style.width = "100%";
      container.style.height = "100%";
      return;
    }

    const adjustSize = () => {
      if (!container) return;

      // First, ensure the container takes up available space but maintains aspect ratio
      const parent = container.parentElement;
      if (!parent) return;

      const vw = parent.clientWidth;
      const vh = parent.clientHeight;

      // Calculate the maximum size that maintains the square aspect ratio
      const size = Math.min(vw, vh);

      // Set both width and padding-bottom to maintain aspect ratio
      container.style.width = `${size}px`;
      container.style.height = `${size}px`;
    };

    // Initial adjustment
    adjustSize();

    const resizeObserver = new ResizeObserver(adjustSize);

    // Observe both the container and its parent for size changes
    if (containerRef.current.parentElement) {
      resizeObserver.observe(containerRef.current.parentElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [layout]);

  return (
    <div
      ref={containerRef}
      className={cn(
        "flex min-h-0 min-w-0 flex-col items-center justify-center",
        layout === "square" ? "aspect-square" : "h-full w-full",
        className
      )}
      style={{
        ...style,
        minWidth: 0,
        minHeight: 0,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
});
