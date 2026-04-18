import clsx from "clsx";
import { AutosizeText } from "./AutosizeText";

export const Day = ({
  isToday = false,
  isOtherMonth = false,
  onClick,
  children,
}: {
  isToday?: boolean;
  isOtherMonth?: boolean;
  hoverEnabled?: boolean;
  date?: Date;
  onClick?: React.MouseEventHandler<HTMLElement>;
  children: string;
}) => {
  return (
    <div className="w-full h-full flex items-center justify-center">
      <AutosizeText
        wrapperTw={clsx(
          "h-full w-full rounded-[8px]",
          "hover:border hover:bg-notion-black hover:text-white",
          {
            "bg-[#37352F] text-white": isToday,
            "text-[#E1E1E1]": isOtherMonth,
            "text-[#37352F]": !isToday && !isOtherMonth,
          }
        )}
        heightRatio={0.7}
        onClick={onClick}
      >
        {children}
      </AutosizeText>
    </div>
  );
};
