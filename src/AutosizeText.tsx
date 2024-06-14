import { MouseEventHandler, useEffect, useRef, useState } from "react";
import tw, { TwStyle } from "twin.macro";
import { SerializedStyles, css } from "@emotion/react";

export const AutosizeText = ({
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
  const ref = useRef<HTMLParagraphElement>(null);
  const [fontSize, setFontSize] = useState(0);

  // useResizeObserver(
  //   ref,
  //   () => {
  //     if (ref.current) {
  //       setFontSize(ref.current.clientHeight * heightRatio);
  //     }
  //   },
  //   [heightRatio]
  // );

  useEffect(() => {
    const component = ref.current;
    const adjustFontSize = () => {
      if (!component) {
        return;
      }
      if (component) {
        const height = component.clientHeight;
        setFontSize(height * heightRatio);
      }
    };

    const observer = new ResizeObserver(() => {
      adjustFontSize();
    });

    if (component) {
      observer.observe(component);
    }

    // Cleanup observer on component unmount
    return () => {
      if (component) {
        observer.unobserve(component);
      }
    };
  }, [ref, heightRatio]);

  return (
    <p
      ref={ref}
      css={[
        {
          ...tw`h-full flex justify-center items-center`,
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
    </p>
  );
};
