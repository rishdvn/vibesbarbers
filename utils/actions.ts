'use server'

import { db } from '@/src/index';
import { Appointment, AppointmentDoc } from '@/utils/schemas/Appointment';
import { Roster, RosterCollection } from '@/utils/schemas/Roster';
import { User } from '@/utils/schemas/User';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { areIntervalsOverlapping, endOfDay, format, isSameDay, startOfDay, addDays, eachDayOfInterval, addHours } from 'date-fns';

export async function fetchBarbers(): Promise<User[]> {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const users: User[] = [];
    
    usersSnapshot.forEach((doc) => {
      const userData = doc.data() as User;
      if (userData.approved === true && (userData.role === 'Barber' || userData.role === 'Admin')) {
        users.push(userData);
      }
    });
    console.log("Users Data Type:", Array.isArray(users) ? "Array" : typeof users, users);
  
    return users;
  }

export async function getBarberById(barberId: string): Promise<User | null> {
  const usersSnapshot = await getDocs(query(collection(db, "users"), where("uid", "==", barberId)));
  
  if (usersSnapshot.empty) {
    return null;
  }

  const userData = usersSnapshot.docs[0].data() as User;
  
  if (userData.approved === true && (userData.role === 'Barber' || userData.role === 'Admin')) {
    return userData;
  }

  return null;
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
    const data = doc.data() as Roster;
    const simpleData = {
      ...data,
      selectedTimes: {
        ...data.selectedTimes,
        start: data.selectedTimes.start.toDate(),
        end: data.selectedTimes.end.toDate()
      }
    };
    workingRosters.push(simpleData);
  });

  console.log("Working Rosters Data Type:", Array.isArray(workingRosters) ? "Array" : typeof workingRosters, workingRosters);
  return workingRosters;
}


export async function fetchBarberNextTwoWeeksRosters(uid: string): Promise<Roster[]> {
  const today = startOfDay(addDays(new Date(), -1));
  const twoWeeksFromNow = startOfDay(addDays(today, 16));

  // Query to filter by uid and start date
  const rostersQuery = query(
    collection(db, "roster"),
    where("uid", "==", uid),
    where("selectedTimes.end", ">=", today),  // Rosters may have started before today that still need to be considered
    where("selectedTimes.start", "<=", twoWeeksFromNow)
  );

  const rostersSnapshot = await getDocs(rostersQuery);
  const relevantRosters: Roster[] = [];

  rostersSnapshot.forEach((doc) => {
    const data = doc.data() as Roster;
    const simpleData = {
      ...data,
      selectedTimes: {
        ...data.selectedTimes,
        start: data.selectedTimes.start.toDate() < today ? today : data.selectedTimes.start.toDate(),
        end: data.selectedTimes.end.toDate() > twoWeeksFromNow ? twoWeeksFromNow : data.selectedTimes.end.toDate()
      }
    };
    relevantRosters.push(simpleData);
  });

  console.log("Relevant Rosters:", JSON.stringify(relevantRosters, null, 2));
  return relevantRosters;
}


export async function fetchAllAppointments(): Promise<AppointmentDoc[]> {
  const appointmentsSnapshot = await getDocs(collection(db, "appointments"));
  return appointmentsSnapshot.docs.map(doc => {
    const data = doc.data();
    console.log(data)
    return {
      ...data,
      appDetails: {
        appDay: data.appDay.toDate().toISOString(),
        appStartTime: data.appStartTime.toDate().toISOString(),
        appEndTime: data.appEndTime.toDate().toISOString(),
      }
    } as AppointmentDoc;
  });
}

import { Timestamp } from 'firebase/firestore';
import { TZDate } from "@date-fns/tz";
import App from 'next/app';


export async function fetchBarberDayAppointments(uid: string, day: TZDate): Promise<Appointment[]> {
  const startOfDayTimestamp = Timestamp.fromDate(startOfDay(day));
  const endOfDayTimestamp = Timestamp.fromDate(endOfDay(day));
  console.log(`Barber UID: ${uid}, day: ${format(day, "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")}`);
  console.log(`Start of Day: ${format(startOfDayTimestamp.toDate(), "yyyy-MM-dd'T'HH:mm:ss.SSSxxx")}`);

  const appointmentsQuery = query(
    collection(db, "appointments"),
    where("appDetails.barberUID", "==", uid),
    where("appDetails.appDay", "==", startOfDayTimestamp),
  );

  const appointmentsSnapshot = await getDocs(appointmentsQuery);
  const dayAppointments: Appointment[] = [];
  
  appointmentsSnapshot.forEach((doc) => {
    const data = doc.data();
    // Convert Timestamp objects to ISO strings
    if (data) {
      const appointment = {
        ...data,
        appDay: data.appDetails.appDay.toDate().toISOString(),
      } as Appointment;
      if (data.appDetails.appStartTime) {
        appointment.appStartTime = data.appDetails.appStartTime.toDate().toISOString();
      }
      if (data.appDetails.appEndTime) {
        appointment.appEndTime = data.appDetails.appEndTime.toDate().toISOString();
      }
      dayAppointments.push(appointment);
    }
  });

  // console.log("Day Appointments:", dayAppointments);
  return dayAppointments;
}
