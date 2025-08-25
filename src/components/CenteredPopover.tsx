import { useState, useRef, useEffect } from "react";
import { AutosizeText } from "./AutosizeText";
import tw from "twin.macro";
import ClickIcon from "../click.svg";
import { SquareContainer } from "./SquareContainer";

type Props = {
  textContent: string;
  showPop: boolean;
  showCopyright?: boolean;
  onPopTrigger: (event: React.MouseEvent) => void;
  onClickOutside: () => void;
  children: string | JSX.Element | JSX.Element[];
};
export const CenteredPopover = ({
  textContent,
  showPop,
  showCopyright = true,
  onPopTrigger,
  onClickOutside,
  children,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const refAutoSizeText = useRef<HTMLParagraphElement>(null);
  const refPopover = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef?.current) {
      return;
    }
    const component = containerRef.current;

    const adjustPosition = () => {
      if (!component) {
        return;
      }
      const rect = component.getBoundingClientRect();
      setPosition({
        top: rect.top + rect.height / 2,
        left: rect.left + rect.width / 2,
      });
    };

    // Initial position
    adjustPosition();

    const observer = new ResizeObserver(adjustPosition);
    observer.observe(component);

    // Also listen for scroll events since getBoundingClientRect is relative to viewport
    window.addEventListener("scroll", adjustPosition, true);

    // Cleanup observer on component unmount
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", adjustPosition, true);
    };
  }, [containerRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!event) {
        return;
      }
      if (
        containerRef?.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClickOutside();
        console.log("handleclickoutside");
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
      className="w-full h-full rounded bg-notion-black relative"
      onClick={onPopTrigger}
    >
      <AutosizeText
        overrideTw={tw`text-white`}
        ref={refAutoSizeText}
        heightRatio={0.7}
      >
        {textContent}
      </AutosizeText>

      <div className="absolute bottom-0 right-0 mr-4 mb-4">
        <ClickIcon fill="white" width="30" height="30" />
      </div>

      {showPop && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4/5 h-4/5 bg-white border border-gray-300 rounded shadow-lg flex items-center justify-center z-10"
          ref={refPopover}
        >
          {children}
        </div>
      )}
      {showCopyright && (
        <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center mb-4">
          <a
            href="https://atomicskills.academy"
            className="text-center text-white text-xl"
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            © atomicskills.academy
          </a>
        </div>
      )}
    </SquareContainer>
  );
};
