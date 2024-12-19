'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/src/index';
import { fetchAppointmentsByPhoneNumber } from '@/utils/bookings';
import Link from 'next/link';
import { LogOut } from 'lucide-react';
import { AppointmentDoc } from '@/utils/schemas/Appointment';
import AppointmentCard from './components/AppointmentCard';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { fetchBarbers } from '@/utils/actions';

export default function BookingsPage() {
  const [user, authLoading] = useAuthState(auth);
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentDoc[]>([]);
  const [barbers, setBarbers] = useState<{}>({});
  const [dataLoading, setDataLoading] = useState(false);
  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    const loadAppointments = async () => {
      if (user?.phoneNumber) {
        setDataLoading(true);
        try {
          let userAppointments = await fetchAppointmentsByPhoneNumber(user.phoneNumber.replace(/^(\+61|0)/, ''));
          if (userAppointments.length === 0) {
            userAppointments = await fetchAppointmentsByPhoneNumber(user.phoneNumber);
          }
          const barbersArray = await fetchBarbers();
          const barbersMap = barbersArray.reduce((acc, barber) => {
            const { uid, ...rest } = barber;
            acc[uid] = rest;
            return acc;
          }, {});
          setBarbers(barbersMap);
          setAppointments(userAppointments);
        } catch (error) {
          console.error('Error loading appointments:', error);
        } finally {
          setDataLoading(false);
        }
      }
    };

    if (user) {
      loadAppointments();
    }
  }, [user, authLoading, router]);

  const LoadingState = () => (
    <div className="min-h-screen max-w-screen-md mx-auto bg-black p-4">
      <nav className="p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <div className="h-8 w-24 bg-gray-800 animate-pulse rounded" />
          <div className="h-6 w-32 bg-gray-800 animate-pulse rounded" />
        </div>
        <div className="h-6 w-24 bg-gray-800 animate-pulse rounded" />
      </nav>
      <div className="h-8 w-40 bg-gray-800 animate-pulse rounded mt-4 mb-4" />
      <div className="w-full h-12 bg-gray-800 animate-pulse rounded mb-6" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="w-full h-32 bg-gray-800 animate-pulse rounded" />
        ))}
      </div>
      <div className="h-12 w-full bg-gray-800 animate-pulse rounded mt-6" />
    </div>
  );

  if (authLoading || !user) return <LoadingState />;

  const now = new Date();
  const upcomingAppointments = appointments.filter(
    app => new Date(app.appDetails.appStartTime as Date) >= now
  );
  const previousAppointments = appointments.filter(
    app => new Date(app.appDetails.appStartTime as Date) < now
  );

  return (
    <div className="min-h-screen max-w-screen-md mx-auto bg-black p-4">
      {/* Header */}
      <nav className="p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <img 
              src="/black_logo_vibes.png" 
              alt="Vibes Barbers Logo" 
              className="h-8 w-auto invert filter contrast-125 brightness-90"
            />
          </Link>
          <span className="text-xl font-bold text-white">VIBES BARBERS</span>
        </div>
        <button 
          onClick={() => auth.signOut()}
          className="flex items-center gap-2 text-white"
        >
          <LogOut className="w-6 h-6" />
          <span className="text-sm font-medium">LOGOUT</span>
        </button>
      </nav>

      {/* Title */}
      <h1 className="text-4xl mt-4 font-serif mb-4 text-white">BOOKINGS</h1>

      {/* Tabs */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6 bg-gray-800">
          <TabsTrigger value="upcoming" className=" text-white">
            Upcoming bookings
          </TabsTrigger>
          <TabsTrigger value="previous" className="text-white">
            Previous bookings
          </TabsTrigger>
        </TabsList>
        
        {dataLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-full h-32 bg-gray-800 animate-pulse rounded" />
            ))}
          </div>
        ) : (
          <>
            <TabsContent value="upcoming">
              {upcomingAppointments.length === 0 ? (
                <p className="text-center py-4 text-white">No upcoming appointments</p>
              ) : (
                upcomingAppointments.map((appointment, index) => (
                  <AppointmentCard key={index} barbers={barbers} appointment={appointment} />
                ))
              )}
            </TabsContent>
            
            <TabsContent value="previous">
              {previousAppointments.length === 0 ? (
                <p className="text-center py-4 text-white">No previous appointments</p>
              ) : (
                previousAppointments.map((appointment, index) => (
                  <AppointmentCard key={index} barbers={barbers} appointment={appointment} />
                ))
              )}
            </TabsContent>
          </>
        )}
      </Tabs>

      {/* Make a Booking Button */}
      <Link 
        href="/make-booking" 
        className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium text-center mt-6"
      >
        MAKE A BOOKING
      </Link>
    </div>
  );
}