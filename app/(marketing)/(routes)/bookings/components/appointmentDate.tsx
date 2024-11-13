import React from 'react';
import DayItem from './dayItem';
import { Roster } from '@/utils/schemas/Roster';
import { eachDayOfInterval, format, isSameDay } from 'date-fns';

interface AppointmentDateProps {
    roster: Roster[];
    selectedDay: Date;
    changeSelectedDay: (day: Date) => void;
}

const AppointmentDate: React.FC<AppointmentDateProps> = ({ roster, selectedDay, changeSelectedDay }) => {
    const start = new Date();
    const end = new Date();
    end.setDate(start.getDate() + 14);
    const interval = eachDayOfInterval({ start, end });
  
    const availableDays = roster.flatMap((rosterItem) => {
        const days: { day: Date; isWorking: boolean }[] = [];

        interval.forEach((date) => {
        const dayName = format(date, 'EEEE').toLowerCase();
        if (rosterItem.selectedTimes[dayName].isWorking) {
            days.push({ day: date, isWorking: true });
        }
        });

        return days;
    });

  return (
    <>
        <div className="flex flex-col gap-y-2">
          <label
            htmlFor="User-name"
            className="block text-xs font-semibold leading-6 text-gray-900 sm:mt-1.5"
          >
            <div className='flex flex-row gap-x-1'>
              <span className='text-red-600'>
                3.
              </span>
              AVALIABLE APPOINTMENT DATES
            </div>
          </label>

          <div className='flex flex-row w-full overflow-x-auto border-b border-gray-200 pb-2 gap-x-4'>
            {availableDays.length > 0 ? (
              availableDays.map((dayObject) => (
                <DayItem 
                  key={dayObject.day.toString()} 
                  day={dayObject.day} 
                  isWorking={dayObject.isWorking} 
                  isSelected={isSameDay(selectedDay, dayObject.day)} 
                  onSelectDay={changeSelectedDay} 
                />
              ))
            ) : (
              <div className="text-gray-500">No appointments available</div>
            )}
          </div>
        </div>
    </>
  );
};

export default AppointmentDate;
