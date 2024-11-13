'use server'

import { db } from '@/src/index';
import { Appointment } from '@/utils/schemas/Appointment';
import { Roster, RosterCollection } from '@/utils/schemas/Roster';
import { User } from '@/utils/schemas/User';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { areIntervalsOverlapping, endOfDay, format, isSameDay, startOfDay, addDays, eachDayOfInterval } from 'date-fns';


export async function fetchUsers(): Promise<User[]> {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const users: User[] = [];
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data() as User;
      if (userData.approved === true && (userData.role === 'Barber' || userData.role === 'Admin')) {
        users.push(userData);
      }
    });
  
    return users;
  }


export async function fetchRosters(): Promise<RosterCollection> {
  const rostersSnapshot = await getDocs(collection(db, "roster"));
  const rosters: { [key: string]: Roster } = {};
  
  rostersSnapshot.forEach((doc) => {
    const data = doc.data() as Roster;
    rosters[doc.id] = data;
  });

  console.log("Rosters Data Type:", typeof rosters, rosters);
  return rosters;
}

export async function fetchBarberDayRosters(uid: string, day: string): Promise<Roster[]> {
  const rostersQuery = query(
    collection(db, "roster"),
    where("uid", "==", uid),
    where(`selectedTimes.${day}.isWorking`, "==", true)
  );

  const rostersSnapshot = await getDocs(rostersQuery);
  const workingRosters: Roster[] = [];
  
  rostersSnapshot.forEach((doc) => {
    workingRosters.push(doc.data() as Roster);
  });

  console.log("Working Rosters Data Type:", Array.isArray(workingRosters) ? "Array" : typeof workingRosters, workingRosters);
  return workingRosters;
}


export async function fetchBarberNextTwoWeeksRosters(uid: string): Promise<Roster[]> {
  const today = startOfDay(new Date());
  const twoWeeksFromNow = startOfDay(addDays(today, 14));

  // Query to filter by uid and start date
  const rostersQuery = query(
    collection(db, "roster"),
    where("uid", "==", uid),
    where("selectedTimes.start", ">=", today),
    where("selectedTimes.start", "<=", twoWeeksFromNow)
  );

  const rostersSnapshot = await getDocs(rostersQuery);
  let latestRoster: Roster | null = null;
  
  rostersSnapshot.forEach((doc) => {
    const data = doc.data() as Roster;
    const simpleData = {
      ...data,
      selectedTimes: {
        ...data.selectedTimes,
        start: data.selectedTimes.start.toDate(),
        end: data.selectedTimes.end.toDate() > twoWeeksFromNow ? twoWeeksFromNow : data.selectedTimes.end.toDate()
      }
    };
    if (!latestRoster || simpleData.selectedTimes.start > latestRoster.selectedTimes.start) {
      latestRoster = simpleData;
    }
  });

  console.log("Latest Roster Data Type:", typeof latestRoster, JSON.stringify(latestRoster, null, 2));
  return latestRoster ? [latestRoster] : [];
}


export async function fetchAllAppointments(): Promise<Appointment[]> {
  const appointmentsSnapshot = await getDocs(collection(db, "appointments"));
  const appointments: Appointment[] = [];
  
  appointmentsSnapshot.forEach((doc) => {
    appointments.push(doc.data() as Appointment);
  });

  console.log("Appointments Data Type:", Array.isArray(appointments) ? "Array" : typeof appointments, appointments);
  return appointments;
}

import { Timestamp } from 'firebase/firestore';

export async function fetchBarberDayAppointments(uid: string, day: Date): Promise<Appointment[]> {
  const startOfDayTimestamp = Timestamp.fromDate(startOfDay(day));
  const endOfDayTimestamp = Timestamp.fromDate(endOfDay(day));

  const appointmentsQuery = query(
    collection(db, "appointments"),
    where("barberUID", "==", uid),
    where("appDay", ">=", startOfDayTimestamp)
  );

  const appointmentsSnapshot = await getDocs(appointmentsQuery);
  const dayAppointments: Appointment[] = [];
  
  appointmentsSnapshot.forEach((doc) => {
    dayAppointments.push(doc.data() as Appointment);
  });

  console.log("Day Appointments Data Type:", Array.isArray(dayAppointments) ? "Array" : typeof dayAppointments, dayAppointments);
  return dayAppointments;
}
