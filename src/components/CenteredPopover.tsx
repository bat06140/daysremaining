import { useEffect, useRef } from "react";
import { AutosizeText } from "./AutosizeText";
import ClickIcon from "../click.svg";
import { SquareContainer } from "./SquareContainer";
import { cn } from "@/lib/utils";
import { WidgetLayout } from "@/lib/view-config";
import { WidgetFooter } from "./WidgetFooter";

type Props = {
  textContent: string;
  showPop: boolean;
  showCopyright?: boolean;
  onPopTrigger: (event: React.MouseEvent) => void;
  onClickOutside: () => void;
  children: string | JSX.Element | JSX.Element[];
  layout?: WidgetLayout;
};

export const CenteredPopover = ({
  textContent,
  showPop,
  showCopyright = true,
  onPopTrigger,
  onClickOutside,
  children,
  layout = "square",
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClickOutside();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClickOutside]);

  return (
    <SquareContainer
      ref={containerRef}
      layout={layout}
      className="w-full"
    >
      <div className="flex h-full w-full flex-col gap-[2px]">
        <div
          className={cn(
            "relative min-h-0 flex-1 overflow-visible rounded-[8px] bg-notion-black",
            layout === "full" && "rounded-[8px]"
          )}
          onClick={onPopTrigger}
        >
          <AutosizeText
            overrideTw="px-6 font-bold tracking-[-0.04em] text-white"
            heightRatio={layout === "full" ? 0.58 : 0.64}
          >
            {textContent}
          </AutosizeText>

          <div className="pointer-events-none absolute bottom-4 right-4 z-10 opacity-90">
            <ClickIcon
              fill="white"
              width={layout === "full" ? "40" : "30"}
              height={layout === "full" ? "40" : "30"}
            />
          </div>

          {showPop && (
            <div
              className={cn(
                "absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2",
                layout === "full"
                  ? "h-[82%] w-[88%]"
                  : "h-4/5 w-4/5"
              )}
            >
              <button
                type="button"
                className="absolute right-0 top-0 z-20 flex h-10 w-10 translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-notion-black text-2xl leading-none text-white shadow-[0_8px_20px_rgba(0,0,0,0.22)]"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  onClickOutside();
                }}
                aria-label="Close popover"
              >
                ×
              </button>
              <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[8px] border border-gray-300 bg-white shadow-lg">
                {children}
              </div>
            </div>
          )}
        </div>

        {showCopyright && (
          <WidgetFooter
            onClick={(event) => {
              event.stopPropagation();
            }}
          />
        )}
      </div>
    </SquareContainer>
  );
};
