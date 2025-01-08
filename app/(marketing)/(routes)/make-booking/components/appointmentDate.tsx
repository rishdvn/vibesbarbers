import React from 'react';
import DayItem from './dayItem';
import { Roster } from '@/utils/schemas/Roster';
import { format, isSameDay } from 'date-fns';
import { TZDate } from '@date-fns/tz';

interface AppointmentDateProps {
    roster: Roster[];
    selectedDay: TZDate | null;
    changeSelectedDay: (day: TZDate) => void;
    availableDaysWithSlots?: Array<{ day: TZDate; slots: any[] }>;
    isLoading?: boolean;
}

const TIMEZONE = 'Australia/Sydney'; // AEST/AEDT timezone

const LoadingDays = () => (
    <div className="flex flex-row gap-x-4">
        {[1, 2, 3, 4, 5].map((i) => (
            <div 
                key={i} 
                className="w-20 h-24 bg-gray-800 animate-pulse rounded-lg"
            />
        ))}
    </div>
);

const AppointmentDate: React.FC<AppointmentDateProps> = ({ 
    roster, 
    selectedDay, 
    changeSelectedDay,
    availableDaysWithSlots = [],
    isLoading = false
}) => {
    return (
        <>
            <div className="flex flex-col gap-y-2">
                <label
                    htmlFor="User-name"
                    className="block text-xs font-semibold leading-6 text-gray-100 sm:mt-1.5"
                >
                    <div className='flex flex-row gap-x-1 text-white'>
                        <span className='text-red-600'>
                            3.
                        </span>
                        AVAILABLE APPOINTMENT DATES {'(AEST)'}
                    </div>
                </label>

                <div className='flex flex-row w-full overflow-x-auto pb-2 gap-x-4' id="scrollbar-style1">
                    {isLoading ? (
                        <LoadingDays />
                    ) : availableDaysWithSlots.length > 0 ? (
                        availableDaysWithSlots.map(({ day }) => (
                            <DayItem 
                                key={day.toString()} 
                                day={day} 
                                isWorking={true}
                                isSelected={selectedDay ? isSameDay(selectedDay, day) : false} 
                                onSelectDay={changeSelectedDay} 
                                className="bg-white text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700"
                            />
                        ))
                    ) : (
                        <div className="text-gray-500 dark:text-gray-400">No appointments available</div>
                    )}
                </div>
            </div>
        </>
    );
};

export default AppointmentDate;
