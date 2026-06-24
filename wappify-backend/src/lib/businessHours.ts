export interface DaySchedule {
  start: string; // HH:mm format
  end: string;   // HH:mm format
  closed?: boolean;
}

export interface BusinessHoursSchedule {
  enabled: boolean;
  schedule: {
    mon?: DaySchedule;
    tue?: DaySchedule;
    wed?: DaySchedule;
    thu?: DaySchedule;
    fri?: DaySchedule;
    sat?: DaySchedule;
    sun?: DaySchedule;
  };
  outOfOfficeMessage?: string;
}

/**
 * Evaluates whether the current time is within the provided business hours schedule.
 * If the schedule is malformed or disabled, it defaults to true (open).
 */
export const isWithinBusinessHours = (
  scheduleJson: any,
  timezone: string = "Asia/Kolkata"
): boolean => {
  if (!scheduleJson) return true;

  const scheduleConfig = scheduleJson as BusinessHoursSchedule;
  if (scheduleConfig.enabled === false) return true;

  const schedule = scheduleConfig.schedule;
  if (!schedule) return true;

  const now = new Date();

  // Format the time parts in the specified timezone
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(now);
  
  let weekday = "";
  let hour = "";
  let minute = "";

  for (const part of parts) {
    if (part.type === "weekday") weekday = part.value.toLowerCase(); // "mon", "tue", etc.
    if (part.type === "hour") hour = part.value;
    if (part.type === "minute") minute = part.value;
  }
  
  if (hour === "24") hour = "00";

  // Match en-US short weekdays to our schema keys
  const dayMap: Record<string, keyof typeof schedule> = {
    sun: "sun",
    mon: "mon",
    tue: "tue",
    wed: "wed",
    thu: "thu",
    fri: "fri",
    sat: "sat",
  };

  const todayKey = dayMap[weekday];
  const todaySchedule = schedule[todayKey];

  if (!todaySchedule || todaySchedule.closed) {
    return false;
  }

  if (!todaySchedule.start || !todaySchedule.end) {
    return true; // Default open if times missing
  }

  const currentTimeStr = `${hour}:${minute}`;
  return currentTimeStr >= todaySchedule.start && currentTimeStr <= todaySchedule.end;
};
