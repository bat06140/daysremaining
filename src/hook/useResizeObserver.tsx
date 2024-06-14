import { useEffect, useState, RefObject, DependencyList } from "react";

interface Dimensions {
  width: number;
  height: number;
}

const useResizeObserver = (ref: RefObject<HTMLElement>, callback?: () => void, deps?: DependencyList): Dimensions => {
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 });

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    // Hook function to be executed when dimensions change
    const onResize = (entries: ResizeObserverEntry[]) => {
      entries.forEach(entry => {
        const { width, height } = entry.contentRect;
        setDimensions(prevDimensions => {
          if (prevDimensions.width !== width || prevDimensions.height !== height) {
            callback?.();
            return { width, height };
          }
          return prevDimensions;
        });
      });
    };

    // Create a ResizeObserver instance with the callback
    const resizeObserver = new ResizeObserver(onResize);

    // Start observing the element
    resizeObserver.observe(element);

    // Cleanup function to stop observing when component unmounts
    return () => {
      resizeObserver.unobserve(element);
    };
  }, [ref, callback, { ...deps }]);

  return dimensions;
};

export default useResizeObserver;
