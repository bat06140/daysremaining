import tw from "twin.macro";
import { AutosizeText } from "./AutosizeText";
import { css } from "@emotion/react";

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
        overrideTw={tw`rounded-[4px] aspect-square flex justify-center items-center hover:bg-notion-black hover:text-white`}
        overrideCss={css`
          color: ${isToday
            ? "#fff"
            : isOtherMonth
            ? "rgb(225, 225, 225)"
            : "#37352F"};
          background-color: ${isToday && "#37352F"};
          :hover {
            border: "1px";
          }
        `}
        heightRatio={0.7}
        onClick={onClick}
      >
        {children}
      </AutosizeText>
    </div>
  );
};
