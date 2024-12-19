import { AppointmentDoc } from "@/utils/schemas/Appointment";
import { User } from "@/utils/schemas/User";
import { TZDate } from "@date-fns/tz";
import { format } from "date-fns";

const TIMEZONE = 'Australia/Sydney'; // AEST/AEDT timezone

export default function AppointmentCard({ appointment, barbers }: { appointment: AppointmentDoc, barbers: { [key: string]: User } }) {
    const appDate = new TZDate(appointment.appDetails.appDay as Date, TIMEZONE);
    const startTime = new TZDate(appointment.appDetails.appStartTime as Date, TIMEZONE);
    const month = format(appDate, 'MMM').toUpperCase();
    const day = appDate.getDate();
    const year = appDate.getFullYear();
    const timeStr = format(startTime, 'h:mm a');
  
    return (
      <div className="flex mb-4 rounded-lg overflow-hidden border border-gray-700">
        <div className="bg-blue-600 text-white p-4 flex-grow">
          <div className="space-y-4">
            <div>
              <div className="text-sm opacity-80">TIME</div>
              <div className="font-medium">{timeStr}</div>
            </div>
            <div>
              <div className="text-sm opacity-80">SERVICE</div>
              <div className="font-medium">{appointment.appDetails.service}</div>
            </div>
            <div>
              <div className="text-sm opacity-80">BARBER</div>
              <div className="font-medium">{barbers[appointment.appDetails.barberUID]?.firstname}</div>
            </div>
          </div>
        </div>
        <div className="bg-gray-100 text-center p-2 w-32 flex flex-col justify-center items-center">
          <div className="text-red-500">
            <div className="text-lg font-medium">{month}</div>
            <div className="text-4xl font-bold">{day}</div>
            <div className="text-lg">{year}</div>
          </div>
        </div>
      </div>
    );
  }
  