'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/src';
import { startOfDay, isSameDay, format, endOfDay, areIntervalsOverlapping } from 'date-fns';
import { useUserAuth } from '@/src/context/AuthContext';
import { 
  Appointment, 
  Barber, 
  CalendarContextType, 
  Roster, 
  ViewType 
} from './types';

const defaultTimeSlots = {
  monday: ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM', '10PM', '11PM'],
  tuesday: ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM'],
  wednesday: ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM'],
  thursday: ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM'],
  friday: ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM', '9PM'],
  saturday: ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM'],
  sunday: ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM']
};

const CalendarContext = createContext<CalendarContextType | undefined>(undefined);

export function CalendarProvider({ children }: { children: React.ReactNode }) {
  const { user } = useUserAuth();
  const today = startOfDay(new Date());

  // State
  const [view, setView] = useState<ViewType>('Team');
  const [selectedDay, setSelectedDay] = useState<Date>(today);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [rosters, setRosters] = useState<Record<string, Roster>>({});

  // Fetch barbers
  useEffect(() => {
    return onSnapshot(collection(db, "users"), (snapshot) => {
      const barbersList = snapshot.docs
        .filter(doc => {
          const data = doc.data();
          return data.approved === true && (data.role === 'Barber' || data.role === 'Admin');
        })
        .map(doc => doc.data() as Barber);
      setBarbers(barbersList);
    });
  }, []);

  // Fetch appointments
  useEffect(() => {
    return onSnapshot(collection(db, "appointments"), (snapshot) => {
      const appointmentsList = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Appointment[];
      setAppointments(appointmentsList);
    });
  }, []);

  // Fetch rosters
  useEffect(() => {
    return onSnapshot(collection(db, "roster"), (snapshot) => {
      const rostersMap: Record<string, Roster> = {};
      snapshot.docs.forEach(doc => {
        rostersMap[doc.id] = doc.data() as Roster;
      });
      setRosters(rostersMap);
    });
  }, []);

  // Derived state: Selected day appointments
  const selectedDayAppointments = useMemo(() => {
    return appointments.filter(app => {
      if (app.appDetails.isExtra) {
        return isSameDay(app.appDetails.appDay.toDate(), selectedDay);
      }
      return isSameDay(app.appDetails.appStartTime.toDate(), selectedDay);
    });
  }, [appointments, selectedDay]);

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
          const isInPeriod = areIntervalsOverlapping(
            { start: selectedDay, end: endOfDay(selectedDay) },
            { start: rosterInfo.start.toDate(), end: rosterInfo.end.toDate() }
          );
          
          if (isInPeriod) {
            const dayName = format(selectedDay, 'EEEE').toLowerCase();
            isWorking = rosterInfo[dayName].isWorking;
          }
        } else {
          // Indefinite roster
          if (selectedDay >= rosterInfo.start.toDate()) {
            const dayName = format(selectedDay, 'EEEE').toLowerCase();
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
  const addAppointment = async (appointment: Omit<Appointment, 'id'>) => {
    await addDoc(collection(db, "appointments"), appointment);
  };

  const updateAppointment = async (id: string, updates: Partial<Appointment>) => {
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
    timeSlots: defaultTimeSlots,
    addAppointment,
    updateAppointment,
    deleteAppointment,
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
