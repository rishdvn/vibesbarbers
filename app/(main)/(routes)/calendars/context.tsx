'use client';

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { addDoc, collection, deleteDoc, doc, onSnapshot, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { db } from '@/src/index';
import { format } from 'date-fns';
import { convertTo24Hour } from '@/utils/time';
import { useUserAuth } from '@/src/context/AuthContext';
import { Appointment, AppointmentDoc, AppointmentDocSchema } from '@/utils/schemas/Appointment';
import { Roster } from '@/utils/schemas/Roster';
import { User } from '@/utils/schemas/User';
import { generateAllTimeSlots, DEFAULT_BUSINESS_HOURS } from '@/utils/time';

type ViewType = 'Team' | 'Individual';

const timeSlots = generateAllTimeSlots();

interface CalendarContextType {
  view: ViewType;
  setView: (view: ViewType) => void;
  selectedDay: Date;
  setSelectedDay: (day: Date) => void;
  barbers: User[];
  appointments: AppointmentDoc[];
  rosters: Record<string, Roster>;
  selectedDayAppointments: AppointmentDoc[];
  workingBarbers: User[];
  timeSlots: Record<string, string[]>;
  businessHours: Record<string, { openTime: string; closeTime: string }>;
  openTime: string;
  closeTime: string;
  addAppointment: (appointment: Omit<AppointmentDoc, 'id'>) => Promise<void>;
  updateAppointment: (id: string, updates: Partial<AppointmentDoc>) => Promise<void>;
  deleteAppointment: (id: string) => Promise<void>;
  timeAppointmentBarberMap: Map<string, Map<string, AppointmentDoc | null>>;
}

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const { user } = useUserAuth();
  const today = new Date();

  // State
  const [view, setView] = useState<ViewType>('Team');
  const [selectedDay, setSelectedDay] = useState<Date>(today);
  const [barbers, setBarbers] = useState<User[]>([]);
  const [appointments, setAppointments] = useState<AppointmentDoc[]>([]);
  const [rosters, setRosters] = useState<Record<string, Roster>>({});

  // Utility function to ensure we always have a Date object
  const ensureDate = (value: Date | Timestamp | null | undefined): Date | null => {
    if (!value) return null;
    try {
      return value instanceof Timestamp ? value.toDate() : value;
    } catch (error) {
      console.error('Error converting to date:', value);
      return null;
    }
  };

  // Utility function to safely format a date
  const safeFormat = (date: Date | Timestamp | null | undefined, formatStr: string): string => {
    const validDate = ensureDate(date);
    if (!validDate) {
      // console.warn('Invalid date value:', date);
      return '';
    }
    try {
      return format(validDate, formatStr);
    } catch (error) {
      console.error('Error formatting date:', validDate, error);
      return '';
    }
  };

  // Fetch barbers
  useEffect(() => {
    try {
      const q = query(
        collection(db, "users"),
        where("approved", "==", true),
        where("role", "in", ["Barber", "Admin"])
      );

      const unsubscribe = onSnapshot(q, {
        next: (snapshot) => {
          const barbersList = snapshot.docs.map(doc => doc.data() as User);
          setBarbers(barbersList);
        },
        error: (error) => {
          console.error("Error fetching barbers:", error);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up barbers listener:", error);
    }
  }, []);

  // Fetch appointments for selected day
  useEffect(() => {
    try {
      // Create start and end of selected day
      const dayStart = new Date(selectedDay);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(selectedDay);
      dayEnd.setHours(23, 59, 59, 999);

      const q = query(
        collection(db, "appointments"),
        where("appDetails.appDay", ">=", dayStart),
        where("appDetails.appDay", "<=", dayEnd)
      );

      const unsubscribe = onSnapshot(q, {
        next: (snapshot) => {
          const appointmentsList = snapshot.docs.map(doc => {
            const data = doc.data();
            const appDetails = data.appDetails || {};
            
            return {
              id: doc.id,
              ...data,
              appDetails: {
                ...appDetails,
                appStartTime: ensureDate(appDetails.appStartTime),
                appEndTime: ensureDate(appDetails.appEndTime),
                appDay: ensureDate(appDetails.appDay)
              }
            } as AppointmentDoc;
          });
          setAppointments(appointmentsList);
        },
        error: (error) => {
          console.error("Error fetching appointments:", error);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up appointments listener:", error);
    }
  }, [selectedDay]);

  // Fetch rosters
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(collection(db, "roster"), {
        next: (snapshot) => {
          const rostersMap: Record<string, Roster> = {};
          snapshot.docs.forEach(doc => {
            rostersMap[doc.id] = doc.data() as Roster;
          });
          setRosters(rostersMap);
        },
        error: (error) => {
          console.error("Error fetching rosters:", error);
        }
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up rosters listener:", error);
    }
  }, []);

  // Derived state: Selected day appointments
  const selectedDayAppointments = useMemo(() => {
    return appointments.filter(app => {
      const appStartTime = ensureDate(app.appDetails.appStartTime);
      const appDay = ensureDate(app.appDetails.appDay);
      
      if (app.appDetails.isExtra) {
        return new Date(appDay).getDate() === new Date(selectedDay).getDate();
      }
      return new Date(appStartTime).getDate() === new Date(selectedDay).getDate();
    });
  }, [appointments, selectedDay]);

  // Create a map of appointments organized by time and barber
  const timeAppointmentBarberMap = useMemo(() => {
    const map = new Map<string, Map<string, AppointmentDoc | null>>();
    
    // Get the time slots for the selected day
    const dayName = format(selectedDay, 'EEEE').toLowerCase();
    const dayTiming = timeSlots[dayName];

    // Initialize the map with all time slots and barbers
    dayTiming.forEach(time => {
      const hour24 = convertTo24Hour(time);
      const hour = parseInt(hour24.split(':')[0]);
      
      // Create slots for every 20 minutes
      for (let minutes = 0; minutes < 60; minutes += 20) {
        const timeKey = `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
        const barberMap = new Map<string, AppointmentDoc | null>();
        barbers.forEach(barber => {
          barberMap.set(barber.uid, null);
        });
        map.set(timeKey, barberMap);
      }
    });

    // Add extra appointments time slot (using the next hour after the last regular slot)
    const lastTimeSlot = dayTiming[dayTiming.length - 1];
    const lastHour24 = convertTo24Hour(lastTimeSlot);
    const extraHour = parseInt(lastHour24.split(':')[0]) + 1;
    const extraTimeKey = `${extraHour.toString().padStart(2, '0')}:00`;
    
    // Initialize the extra appointments slot
    const extraBarberMap = new Map<string, AppointmentDoc | null>();
    barbers.forEach(barber => {
      extraBarberMap.set(barber.uid, null);
    });
    map.set(extraTimeKey, extraBarberMap);

    // Populate the map with regular appointments
    selectedDayAppointments
      .filter(app => !app.appDetails.isExtra)
      .forEach(app => {
        const startTime = safeFormat(app.appDetails.appStartTime, 'HH:mm');
        if (!startTime) return;
        
        const barberId = app.appDetails.barberUID;
        // Round to nearest 20-minute slot
        const [hours, minutes] = startTime.split(':').map(Number);
        const roundedMinutes = Math.floor(minutes / 20) * 20;
        const timeKey = `${hours.toString().padStart(2, '0')}:${roundedMinutes.toString().padStart(2, '0')}`;
        
        if (map.has(timeKey)) {
          map.get(timeKey)?.set(barberId, app);
        }
      });

    // Add extra appointments to the extra time slot
    selectedDayAppointments
      .filter(app => app.appDetails.isExtra)
      .forEach(app => {
        const barberId = app.appDetails.barberUID;
        map.get(extraTimeKey)?.set(barberId, app);
      });

    return map;
  }, [selectedDayAppointments, barbers, timeSlots, selectedDay]);

  // Derived state: Working barbers
  const workingBarbers = useMemo(() => {
    return barbers.filter(barber => {
      // Check roster
      const barberRosters = Object.values(rosters).filter(roster => roster.uid === barber.uid);
      
      let isWorking = false;

      // Check each roster
      for (const roster of barberRosters) {
        const rosterInfo = roster.selectedTimes;
        
        // Check if the selected day falls within the roster period
        if (rosterInfo.end !== "Never") {
          const isInPeriod = new Date(rosterInfo.start.toDate()) <= new Date(selectedDay) && new Date(rosterInfo.end.toDate()) >= new Date(selectedDay);
          
          if (isInPeriod) {
            const dayName = format(selectedDay, 'EEEE').toLowerCase() as keyof typeof rosterInfo;
            isWorking = rosterInfo[dayName].isWorking;
          }
        } else {
          // Indefinite roster
          if (new Date(selectedDay) >= new Date(rosterInfo.start.toDate())) {
            const dayName = format(selectedDay, 'EEEE').toLowerCase() as keyof typeof rosterInfo;
            isWorking = rosterInfo[dayName].isWorking;
          }
        }
      }

      // Check for extra appointments
      const hasExtraAppointment = selectedDayAppointments.some(
        app => app.appDetails.barberUID === barber.uid && app.appDetails.isExtra
      );

      return isWorking || hasExtraAppointment;
    }).filter(barber => {
      // Filter for individual view
      if (view === 'Individual' && user) {
        return barber.uid === user.uid;
      }
      return true;
    });
  }, [barbers, rosters, selectedDay, selectedDayAppointments, view, user]);

  // Actions
  const addAppointment = async (appointment: Omit<AppointmentDoc, 'id'>) => {
    await addDoc(collection(db, "appointments"), appointment);
  };

  const updateAppointment = async (id: string, updates: Partial<AppointmentDoc>) => {
    await updateDoc(doc(db, "appointments", id), updates);
  };

  const deleteAppointment = async (id: string) => {
    await deleteDoc(doc(db, "appointments", id));
  };

  const value = {
    view,
    setView,
    selectedDay,
    setSelectedDay,
    barbers,
    appointments,
    rosters,
    selectedDayAppointments,
    workingBarbers,
    timeSlots,
    businessHours: DEFAULT_BUSINESS_HOURS,
    openTime: '',
    closeTime: '',
    addAppointment,
    updateAppointment,
    deleteAppointment,
    timeAppointmentBarberMap
  };

  return (
    <CalendarContext.Provider value={value}>
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error('useCalendar must be used within a CalendarProvider');
  }
  return context;
}
