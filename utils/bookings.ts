
import { db } from '@/src/index';
import { AppointmentDoc } from '@/utils/schemas/Appointment';
import { collection, getDocs, query, Timestamp, where } from 'firebase/firestore';

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
        appDay: data.appDetails.appDay instanceof Timestamp ? data.appDetails.appDay.toDate().toISOString() : data.appDetails.appDay,
        appStartTime: data.appDetails.appStartTime instanceof Timestamp ? data.appDetails.appStartTime.toDate().toISOString() : data.appDetails.appStartTime,
        appEndTime: data.appDetails.appEndTime instanceof Timestamp ? data.appDetails.appEndTime.toDate().toISOString() : data.appDetails.appEndTime,
        telNo: data.appDetails.telNo
      }
    } as AppointmentDoc;
  });
}
