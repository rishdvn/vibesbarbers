import { User } from '@/utils/schemas/User';
import React from 'react';
import { BarberItem } from './BarberItem';
import { useCalendar } from '../context';
import { format } from 'date-fns';
import { CalendarItem } from './CalendarItem';
import { ExtraItem } from './ExtraItem';

export const BarbersCol: React.FC<{
  barber: User;
  view: string;
}> = ({ barber, view }) => {
  const { timeSlots, selectedDay, appointments } = useCalendar();
  const dayName = format(selectedDay, 'EEEE').toLowerCase();
  const dayTiming = timeSlots[dayName];
  const daySlots = dayTiming.length;

  const barberAppsNoExtras = appointments.filter((app) => !app.appDetails.isExtra && app.appDetails.barberUID === barber.uid);
  const barberExtras = appointments.filter((app) => app.appDetails.isExtra && app.appDetails.barberUID === barber.uid);
  const hasExtraAppointments = barberExtras.length === 0;
  const barberColor = barber.color;
  
  return (
    <div key={barber.firstname + Math.random()} className="flex w-full flex-col divide-x divide-gray-100">
      <div
        className='sticky top-0 z-10'
      >
        <BarberItem keyValue={barber.firstname} barber={barber} />
      </div>
      <div className="h-5 border-b-2 border-gray-100 text-white select-none">hi</div>
      <div
        className="grid flex-auto grid-cols-1 grid-rows-1"
        style={{
          minWidth: '200px',
          height: `${daySlots * 6}rem`
        }}
      >
        {/* Horizontal lines */}
        <div
          className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
          style={{
            gridTemplateRows: `repeat(${daySlots}, 6rem)`,
            minWidth: '200px'
          }}
        >
          {dayTiming.map((time, index) => (
            <React.Fragment key={`${barber.uid}-${time}-${index}`}>
              <div className='' />
              <div />
              <div />
            </React.Fragment>
          ))}
        </div>

        {/* Events */}
        <ol
          className="col-start-1 col-end-2 row-start-1 grid grid-cols-1"
          style={{
            gridTemplateRows: `repeat(${daySlots}, 6rem)`,
            minWidth: '200px'
          }}
        >
          {barberAppsNoExtras.map((appointment, index) => {
            return (<CalendarItem key={appointment.id} appointment={appointment} color={barberColor} />)
          }
          )}
        </ol>
        </div>
      {/* Extra appointments */}
      <div className="mt-2 px-4">
        <h1 className="font-semibold text-gray-900">
          Extra Appointments
        </h1>
        {hasExtraAppointments ? (
          <p className='text-xs text-gray-700'>No extra appointments</p>
        ) : (
          <div className='flex flex-col gap-y-2 text-xs py-2 max-h-[200px] overflow-y-auto'>
            {barberExtras.map((app, index) => (
              <ExtraItem key={app.id} appointment={app} color={barberColor} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
};
