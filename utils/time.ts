import { addHours, format, parse, setHours, setMinutes } from 'date-fns';

export interface DayHours {
  openTime: string;  // Format: "HH:mm" (24-hour)
  closeTime: string; // Format: "HH:mm" (24-hour)
}

export const DEFAULT_BUSINESS_HOURS: Record<string, DayHours> = {
  monday: { openTime: "09:00", closeTime: "23:00" },
  tuesday: { openTime: "09:00", closeTime: "18:00" },
  wednesday: { openTime: "09:00", closeTime: "18:00" },
  thursday: { openTime: "09:00", closeTime: "21:00" },
  friday: { openTime: "09:00", closeTime: "21:00" },
  saturday: { openTime: "09:00", closeTime: "17:00" },
  sunday: { openTime: "09:00", closeTime: "17:00" }
};

export function generateTimeSlots(hours: DayHours, interval: number = 60): string[] {
  const baseDate = new Date(); // Use any date, we only care about time
  const startTime = parse(hours.openTime, "HH:mm", baseDate);
  const endTime = parse(hours.closeTime, "HH:mm", baseDate);
  
  const slots: string[] = [];
  let currentTime = startTime;
  
  while (currentTime < endTime) {
    slots.push(format(currentTime, "ha").toUpperCase()); // Formats like "9AM"
    currentTime = addHours(currentTime, 1);
  }
  
  return slots;
}

export function generateAllTimeSlots(): Record<string, string[]> {
  const timeSlots: Record<string, string[]> = {};
  
  Object.entries(DEFAULT_BUSINESS_HOURS).forEach(([day, hours]) => {
    timeSlots[day] = generateTimeSlots(hours);
  });
  
  return timeSlots;
}

// Helper function to convert 12-hour format to 24-hour format
export function convertTo24Hour(time12h: string): string {
  const [time, modifier] = time12h.split(/(?=[AaPp][Mm])/);
  let [hours, minutes] = time.split(':');
  
  if (hours === '12') {
    hours = '00';
  }
  
  if (modifier.toLowerCase() === 'pm') {
    hours = String(parseInt(hours, 10) + 12);
  }
  
  return `${hours.padStart(2, '0')}:${minutes || '00'}`;
}

// Helper function to convert 24-hour format to 12-hour format
export function convertTo12Hour(time24h: string): string {
  const [hours, minutes] = time24h.split(':');
  const hour = parseInt(hours, 10);
  
  const period = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  
  return `${hour12}${minutes === '00' ? '' : ':' + minutes}${period}`;
}
