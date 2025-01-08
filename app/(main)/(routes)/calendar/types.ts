import { Timestamp } from 'firebase/firestore';

export interface Appointment {
  id: string;
  appDetails: {
    isExtra: boolean;
    appStartTime: Timestamp;
    appEndTime: Timestamp;
    appDay?: Timestamp;
    service: string;
    firstname: string;
    telNo: string;
    barberUID: string;
  };
}

export interface Barber {
  uid: string;
  approved: boolean;
  role: 'Barber' | 'Admin';
  name: string;
  email: string;
}

export interface TimeSlot {
  hour: string;
  min: string;
  period: 'AM' | 'PM';
}

export interface DaySchedule {
  isWorking: boolean;
  start_time: TimeSlot;
  end_time: TimeSlot;
}

export interface Roster {
  uid: string;
  selectedTimes: {
    start: Timestamp;
    end: Timestamp | "Never";
    monday: DaySchedule;
    tuesday: DaySchedule;
    wednesday: DaySchedule;
    thursday: DaySchedule;
    friday: DaySchedule;
    saturday: DaySchedule;
    sunday: DaySchedule;
  };
}

export type ViewType = 'Team' | 'Individual';

export interface CalendarContextType {
  // View State
  view: ViewType;
  setView: (view: ViewType) => void;

  // Date State
  selectedDay: Date;
  setSelectedDay: (date: Date) => void;

  // Data States
  barbers: Barber[];
  appointments: Appointment[];
  rosters: Record<string, Roster>;
  
  // Derived States
  selectedDayAppointments: Appointment[];
  workingBarbers: Barber[];

  // Constants
  timeSlots: Record<string, string[]>;
  
  // Actions
  addAppointment: (appointment: Omit<Appointment, 'id'>) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<Appointment>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
}
