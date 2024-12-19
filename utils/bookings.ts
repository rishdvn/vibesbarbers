
import { db } from '@/src/index';
import { AppointmentDoc } from '@/utils/schemas/Appointment';
import { collection, getDocs, query, where } from 'firebase/firestore';

export async function fetchAppointmentsByPhoneNumber(phoneNumber: string): Promise<AppointmentDoc[]> {
  const appointmentsQuery = query(
    collection(db, "appointments"),
    where("appDetails.telNo", "==", phoneNumber)
  );
  const appointmentsSnapshot = await getDocs(appointmentsQuery);
  return appointmentsSnapshot.docs.map(doc => {
    const data = doc.data();
    console.log(data);
    return {
      ...data,
      appDetails: {
        ...data.appDetails,
        appDay: data.appDetails.appDay.toDate().toISOString(),
        appStartTime: data.appDetails.appStartTime.toDate().toISOString(),
        appEndTime: data.appDetails.appEndTime.toDate().toISOString(),
        telNo: data.appDetails.telNo
      }
    } as AppointmentDoc;
  });
}
