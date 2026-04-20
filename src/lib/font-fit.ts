interface FindLargestFittingFontSizeOptions {
  minSize: number;
  maxSize: number;
  fits: (candidate: number) => boolean;
}

export const findLargestFittingFontSize = ({
  minSize,
  maxSize,
  fits,
}: FindLargestFittingFontSizeOptions): number => {
  const lowerBound = Math.max(1, Math.floor(minSize));
  let low = lowerBound;
  let high = Math.max(lowerBound, Math.floor(maxSize));
  let best = lowerBound;

  while (low <= high) {
    const candidate = Math.floor((low + high) / 2);

    if (fits(candidate)) {
      best = candidate;
      low = candidate + 1;
      continue;
    }

    high = candidate - 1;
  }

  return best;
};

export const getSharedFittingFontSize = (
  sizes: Array<number | undefined>
): number | undefined => {
  if (sizes.some((size) => size == null)) {
    return undefined;
  }

  return Math.min(...(sizes as number[]));
};

export const scaleFontSize = (
  size: number,
  scale: number,
  minSize: number
): number => {
  return Math.max(minSize, Math.floor(size * scale));
};

export const stabilizeFontSize = (
  currentSize: number | undefined,
  nextSize: number,
  tolerance = 1
): number => {
  if (
    currentSize != null &&
    Math.abs(currentSize - nextSize) <= Math.max(0, tolerance)
  ) {
    return currentSize;
  }

  return nextSize;
};
