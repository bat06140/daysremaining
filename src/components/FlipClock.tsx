import { useEffect, useState } from "react";
import { AutosizeText } from "./AutosizeText";
import { SquareContainer } from "./SquareContainer";
import { cn } from "@/lib/utils";
import { WidgetLayout } from "@/lib/view-config";
import { WidgetFooter } from "./WidgetFooter";

const ClockTile = ({
  text,
  heightRatio,
  className,
}: {
  text: string;
  heightRatio: number;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "flex min-h-0 min-w-0 flex-1 rounded-[8px] bg-notion-black shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
        className
      )}
    >
      <AutosizeText
        overrideTw="px-2 font-bold tracking-[-0.04em] text-white"
        heightRatio={heightRatio}
      >
        {text}
      </AutosizeText>
    </div>
  );
};

const FlipClock = ({
  layout = "square",
  showCopyright = true,
}: {
  layout?: WidgetLayout;
  showCopyright?: boolean;
}) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const hours = now.getHours();
  const minutes = now.getMinutes();
  const day = now.getDate();
  const month = now
    .toLocaleString("fr-FR", { month: "short" })
    .replace(".", "")
    .toUpperCase();
  const year = now.getFullYear();

  return (
    <SquareContainer
      layout={layout}
      className={cn(
        "overflow-hidden rounded-[8px]",
        layout === "full" && "rounded-[8px] p-1"
      )}
    >
      <div className="flex h-full w-full min-h-0 flex-col gap-[2px] rounded-[8px] text-white">
        <div className="flex min-h-0 flex-1 flex-col gap-[2px]">
          <div className="flex min-h-0 flex-[7] gap-[2px]">
            <ClockTile
              text={String(hours).padStart(2, "0")}
              heightRatio={0.8}
            />
            <ClockTile
              text={String(minutes).padStart(2, "0")}
              heightRatio={0.8}
            />
          </div>
          <div className="flex min-h-0 flex-[3] gap-[2px]">
            <ClockTile text={String(day)} heightRatio={0.62} />
            <ClockTile text={month} heightRatio={0.62} />
            <ClockTile text={String(year)} heightRatio={0.62} />
          </div>
        </div>
        {showCopyright && <WidgetFooter />}
      </div>
    </SquareContainer>
  );
};

export default FlipClock;
