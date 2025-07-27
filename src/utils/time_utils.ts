export const getCurrentLocalTime = (): Date => {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local;
};

export const getCurrentLocalTimeISO = (): string => {
  return getCurrentLocalTime().toISOString().slice(0, 16);
};

export const getCurrentUTCTime = (): Date => {
  return new Date();
};

// Convert local datetime-local input value to UTC Date for ArcGIS
export const convertLocalInputToUTC = (localDateTimeString: string): Date => {
  // datetime-local input gives us a string like "2024-01-15T14:30"
  // This represents local time, so we create a Date assuming local timezone
  const localDate = new Date(localDateTimeString);
  return localDate; // Date constructor interprets this as local time and stores as UTC internally
};

// Convert UTC Date to local datetime-local input format
export const convertUTCToLocalInput = (utcDate: Date): string => {
  const offset = utcDate.getTimezoneOffset();
  const localDate = new Date(utcDate.getTime() - offset * 60000);
  return localDate.toISOString().slice(0, 16);
};