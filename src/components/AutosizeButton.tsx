import { MouseEventHandler, useRef, useState } from "react";
import tw, { TwStyle } from "twin.macro";
import { SerializedStyles, css } from "@emotion/react";
import useResizeObserver from "../hook/useResizeObserver";

export const AutosizeButton = ({
  overrideTw = {},
  overrideCss,
  heightRatio = 0.5,
  onClick,
  children,
}: {
  overrideTw?: TwStyle;
  overrideCss?: SerializedStyles;
  heightRatio?: number;
  onClick?: MouseEventHandler;
  children?: string;
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [fontSize, setFontSize] = useState(0);

  useResizeObserver(ref, () => {
    if (ref.current) {
      console.log(
        "Autosize text useResizeObserver",
        ref.current.clientHeight * heightRatio
      );
      setFontSize(ref.current.clientHeight * heightRatio);
    }
  });

  return (
    <button
      ref={ref}
      css={[
        {
          ...tw`p-0 flex justify-center items-center text-white bg-transparent`,
          ...overrideTw,
        },
        css`
          font-size: ${fontSize}px;
          ${overrideCss}
        `,
      ]}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
