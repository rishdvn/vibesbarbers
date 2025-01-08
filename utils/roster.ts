import { areIntervalsOverlapping, endOfDay, format, isSameDay, addMinutes, addHours, isBefore } from "date-fns";

/**
 * Checks if a given day is a working day for a barber based on their rosters
 * @param day The day to check
 * @param rosters Array of roster objects containing schedule information
 * @returns boolean indicating if the barber is working on that day
 */
export function isDayWorking(day: Date, rosters: any[]): boolean {
  for (let roster of rosters) {
    const rosterInfo = roster.selectedTimes;
    const rosterStartTime = rosterInfo.start;
    const rosterEndTime = rosterInfo.end;
    
    const isWithinRosterPeriod = !(rosterEndTime === "Never")
      ? areIntervalsOverlapping(
          {start: day, end: endOfDay(day)},
          {start: rosterStartTime.toDate(), end: rosterEndTime.toDate()}
        )
      : (day < rosterStartTime.toDate() || isSameDay(day, rosterStartTime.toDate())) && 
        endOfDay(day) > rosterStartTime.toDate() || 
        (day > rosterStartTime.toDate());

    if (isWithinRosterPeriod) {
      const dayWeekDay = format(day, 'iiii').toLowerCase();
      return rosterInfo[dayWeekDay].isWorking;
    }
  }
  return false;
}

interface TimeSlot {
  start: Date;
  end: Date;
}

interface DayRoster {
  start_time: {
    hour: number;
    min: number;
    period: "AM" | "PM";
  };
  end_time: {
    hour: number;
    min: number;
    period: "AM" | "PM";
  };
}

interface ExistingAppointment {
  appDetails: {
    isExtra: boolean;
    appStartTime: { toDate: () => Date };
    appEndTime: { toDate: () => Date };
  };
}

/**
 * Calculates available time slots for a given day based on roster and existing appointments
 * @param selectedDay The day to calculate slots for
 * @param dayRoster The roster for that day
 * @param existingApps Array of existing appointments
 * @param slotDuration Duration of each slot in minutes
 * @returns Array of available time slots
 */
export function calculateAvailableTimeSlots(
  selectedDay: Date,
  dayRoster: DayRoster,
  existingApps: ExistingAppointment[],
  slotDuration: number
): TimeSlot[] {
  const now = new Date();

  // Convert roster times to Date objects
  const rosterStartTime = dayRoster.start_time.period === "AM" 
    ? addMinutes(addHours(selectedDay, Number(dayRoster.start_time.hour)), dayRoster.start_time.min)
    : addMinutes(addHours(selectedDay, Number(dayRoster.start_time.hour) + 12), dayRoster.start_time.min);

  const rosterEndTime = dayRoster.end_time.period === "AM"
    ? addMinutes(addHours(selectedDay, Number(dayRoster.end_time.hour)), dayRoster.end_time.min)
    : addMinutes(addHours(selectedDay, Number(dayRoster.end_time.hour) + (Number(dayRoster.end_time.hour) === 12 ? 0 : 12)), dayRoster.end_time.min);

  // Generate potential time slots
  let potentialStartTimes = [];
  let time = rosterStartTime;
  while (time < rosterEndTime) {
    potentialStartTimes.push(time);
    time = addMinutes(time, 20);
  }

  // Filter available slots
  return potentialStartTimes
    .filter((time, index) => {
      if (slotDuration > 20 && index >= potentialStartTimes.length - 1) return false;
      
      const appStartTime = time;
      const appEndTime = addMinutes(time, slotDuration);
      
      // Check if time has passed
      if (isBefore(appStartTime, now)) return false;
      
      // Check for overlaps with existing appointments
      return !existingApps.some(app => {
        if (app.appDetails.isExtra) return false;
        return areIntervalsOverlapping(
          {start: appStartTime, end: appEndTime},
          {start: app.appDetails.appStartTime.toDate(), end: app.appDetails.appEndTime.toDate()}
        );
      });
    })
    .map(time => ({
      start: time,
      end: addMinutes(time, slotDuration)
    }));
}
