import React from 'react';
import DayItem from './dayItem';
import { Roster } from '@/utils/schemas/Roster';
import { eachDayOfInterval, format, isSameDay } from 'date-fns';
import { TZDate } from '@date-fns/tz';

interface AppointmentDateProps {
    roster: Roster[];
    selectedDay: TZDate | null;
    changeSelectedDay: (day: TZDate) => void;
}

const TIMEZONE = 'Australia/Sydney'; // AEST/AEDT timezone

const AppointmentDate: React.FC<AppointmentDateProps> = ({ roster, selectedDay, changeSelectedDay }) => {
    const start = TZDate.tz(TIMEZONE);
    const end = TZDate.tz(TIMEZONE);
    end.setDate(start.getDate() + 14);
    const interval = eachDayOfInterval({ start, end });
  
    const availableDays = roster.flatMap((rosterItem) => {
        const days: { day: TZDate; isWorking: boolean }[] = [];

        interval.forEach((date) => {
            const tzDate = new TZDate(date, TIMEZONE);
            const dayName = format(tzDate, "EEEE").toLowerCase();
            if (rosterItem.selectedTimes[dayName].isWorking) {
                days.push({ day: tzDate, isWorking: true });
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
                        AVAILABLE APPOINTMENT DATES {'(AEST)'}
                    </div>
                </label>

                <div className='flex flex-row w-full overflow-x-auto border-b border-gray-200 pb-2 gap-x-4'>
                    {availableDays.length > 0 ? (
                        availableDays.map((dayObject) => (
                            <DayItem 
                                key={dayObject.day.toString()} 
                                day={dayObject.day} 
                                isWorking={dayObject.isWorking} 
                                isSelected={selectedDay ? isSameDay(selectedDay, dayObject.day) : false} 
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
