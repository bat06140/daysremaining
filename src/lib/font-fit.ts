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
