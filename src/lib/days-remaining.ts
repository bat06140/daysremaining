export const formatDaysRemainingLabel = (daysRemaining: number | undefined) => {
  if (daysRemaining == null || daysRemaining < 0) {
    return "J-?";
  }

  return `J-${daysRemaining}`;
};

export const getDaysRemainingFontScale = (label: string) => {
  if (label.length >= 6) {
    return 0.8;
  }

  if (label.length >= 5) {
    return 0.86;
  }

  return 0.94;
};
