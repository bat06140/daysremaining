import { useEffect, useState } from "react";
import { AutosizeText } from "./AutosizeText";
import { SquareContainer } from "./SquareContainer";
import { cn } from "@/lib/utils";
import { WidgetLayout } from "@/lib/view-config";
import { WidgetFooter } from "./WidgetFooter";
import { getSharedFittingFontSize } from "@/lib/font-fit";

type BottomTileKey = "day" | "month" | "year";

const ClockTile = ({
  text,
  heightRatio,
  fontScale = 1,
  fontSize,
  onFontSizeChange,
  className,
}: {
  text: string;
  heightRatio: number;
  fontScale?: number;
  fontSize?: number;
  onFontSizeChange?: (fontSize: number) => void;
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
        overrideTw="px-2 font-bold tracking-normal text-white"
        heightRatio={heightRatio}
        fontScale={fontScale}
        fontSize={fontSize}
        onFontSizeChange={onFontSizeChange}
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
  const [bottomMeasuredSizes, setBottomMeasuredSizes] = useState<
    Record<BottomTileKey, number | undefined>
  >({
    day: undefined,
    month: undefined,
    year: undefined,
  });

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
  const sharedBottomFontSize = getSharedFittingFontSize([
    bottomMeasuredSizes.day,
    bottomMeasuredSizes.month,
    bottomMeasuredSizes.year,
  ]);

  const updateBottomMeasuredSize = (key: BottomTileKey, fontSize: number) => {
    setBottomMeasuredSizes((current) =>
      current[key] === fontSize ? current : { ...current, [key]: fontSize }
    );
  };

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
              fontScale={0.96}
            />
            <ClockTile
              text={String(minutes).padStart(2, "0")}
              heightRatio={0.8}
              fontScale={0.96}
            />
          </div>
          <div className="flex min-h-0 flex-[3] gap-[2px]">
            <ClockTile
              text={String(day)}
              heightRatio={0.62}
              fontScale={0.96}
              fontSize={sharedBottomFontSize}
              onFontSizeChange={(fontSize) =>
                updateBottomMeasuredSize("day", fontSize)
              }
            />
            <ClockTile
              text={month}
              heightRatio={0.62}
              fontScale={0.96}
              fontSize={sharedBottomFontSize}
              onFontSizeChange={(fontSize) =>
                updateBottomMeasuredSize("month", fontSize)
              }
            />
            <ClockTile
              text={String(year)}
              heightRatio={0.62}
              fontScale={0.96}
              fontSize={sharedBottomFontSize}
              onFontSizeChange={(fontSize) =>
                updateBottomMeasuredSize("year", fontSize)
              }
            />
          </div>
        </div>
        {showCopyright && <WidgetFooter />}
      </div>
    </SquareContainer>
  );
};

export default FlipClock;
