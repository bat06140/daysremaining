import { forwardRef, useEffect, useRef, useState } from "react";
import tw, { TwStyle } from "twin.macro";
import { SerializedStyles, css } from "@emotion/react";

export interface AutosizeTextProps {
  overrideTw?: TwStyle;
  overrideCss?: SerializedStyles;
  heightRatio?: number;
  onClick?: React.MouseEventHandler<HTMLElement>;
  children?: string;
}
export const AutosizeText = forwardRef<HTMLParagraphElement, AutosizeTextProps>(
  (props, ref) => {
    const {
      overrideTw = {},
      overrideCss,
      heightRatio = 0.5,
      onClick,
      children,
    } = props;
    const [fontSize, setFontSize] = useState(0);
    const pRef = useRef<HTMLParagraphElement | null>(null);

    useEffect(() => {
      const component = pRef.current;
      if (!component) {
        return;
      }

      let isAdjusting = false;
      const adjustFontSize = () => {
        if (!component || isAdjusting) {
          return;
        }

        isAdjusting = true;
        const height =
          component.parentElement?.clientHeight || component.clientHeight;
        const width =
          component.parentElement?.clientWidth || component.clientWidth;
        if (height === 0 || width === 0) {
          isAdjusting = false;
          return;
        }

        // Start with a reasonable initial size
        const initialSize = height * heightRatio;
        if (initialSize > 0) {
          setFontSize(initialSize);
        }
        isAdjusting = false;
      };

      // Initial adjustment
      adjustFontSize();

      const observer = new ResizeObserver(() => {
        if (!isAdjusting) {
          adjustFontSize();
        }
      });

      observer.observe(component);

      // Cleanup observer on component unmount
      return () => {
        observer.unobserve(component);
      };
    }, [ref, heightRatio]);

    return (
      <p
        ref={(node) => {
          pRef.current = node;
          if (typeof ref === "function") {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
        }}
        css={[
          {
            ...tw`h-full flex justify-center items-center overflow-hidden whitespace-nowrap`,
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
  }
);
