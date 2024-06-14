export const formatDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = `0${date.getMonth() + 1}`.slice(-2);
  const day = `0${date.getDate()}`.slice(-2);
  return `${year}-${month}-${day}`;
};

export const parseDate = (dateString: string): Date | null => {
  const [year, month, day] = dateString.split("-").map(Number);
  if (year && month && day) {
    return new Date(year, month - 1, day);
  }
  return null;
};

