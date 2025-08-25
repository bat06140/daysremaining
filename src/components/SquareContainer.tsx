import React, { useEffect, useRef } from "react";

interface SquareContainerProps {
  className?: string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  children: React.ReactNode;
}

export const SquareContainer = React.forwardRef<
  HTMLDivElement,
  SquareContainerProps
>(({ className = "", onClick, children }, forwardedRef) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync the forwarded ref with our local ref
  React.useImperativeHandle(forwardedRef, () => containerRef.current!);

  useEffect(() => {
    if (!containerRef.current) return;

    const adjustSize = () => {
      const container = containerRef.current;
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
  }, []);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col items-center justify-center aspect-square ${className}`}
      style={{
        minWidth: 0,
        minHeight: 0,
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
});
