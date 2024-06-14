import tw from "twin.macro";
import { AutosizeText } from "./AutosizeText";
import { css } from "@emotion/react";

export const Day = ({
  isToday = false,
  isOtherMonth = false,
  children,
}: {
  isToday?: boolean;
  isOtherMonth?: boolean;
  children: string;
}) => {
  return (
    <AutosizeText
      overrideTw={tw`rounded-[10px] aspect-square flex justify-center items-center`}
      overrideCss={css`
        color: ${isToday ? "#fff" : isOtherMonth ? "rgb(225, 225, 225)" : "#37352F"};
        background-color: ${isToday && "#37352F"};
      `}
      heightRatio={0.7}
    >
      {children}
    </AutosizeText>
  );
};
