import React, { useState, useEffect } from 'react';
import { format, isSameSecond } from 'date-fns';

const LoadingTimes = () => (
    <div className="space-y-2">
        {[1, 2, 3, 4].map((i) => (
            <div 
                key={i}
                className="h-10 bg-gray-800 animate-pulse rounded-lg"
            />
        ))}
    </div>
);

const AppointmentTime = ({ 
    availableTimes, 
    selectedTime, 
    handleTimeChange,
    isLoading = false 
}) => {
    return (
        <div>
            <div className="flex flex-col gap-y-2">
                <label htmlFor="User-name" className="block text-xs font-semibold leading-6 text-gray-100 sm:mt-1.5">
                    <div className='flex flex-row gap-x-1'>
                        <span className='text-red-500'>4.</span>
                        APPOINTMENT TIME
                    </div>
                </label>
                <div className="text-gray-400 text-sm">
                    Haircut: 20 minutes, Haircut & Beard: 40 minutes
                </div>
                {isLoading ? (
                    <LoadingTimes />
                ) : availableTimes.length === 0 ? (
                    <div className="text-gray-400">The barber is fully booked for the day. Please select another day.</div>
                ) : (
                    availableTimes.map(time => {
                        const appStartTime = format(time.start, "hh:mm a");
                        const appEndTime = format(time.end, "hh:mm a");

                        const isSelectedApp = isSameSecond(time.start, selectedTime.start) && isSameSecond(time.end, selectedTime.end);
                        return (
                            <div
                                key={time.start.toISOString() + Math.random()}
                                onClick={() => handleTimeChange({ start: time.start, end: time.end })}
                                className={
                                    `cursor-pointer select-none py-2 px-1 border rounded-lg transition-all
                                    ${isSelectedApp 
                                        ? 'text-gray-100 bg-green-700 border-green-600 font-medium' 
                                        : 'text-gray-100 bg-gray-800 border-gray-700 hover:border-gray-600'
                                    }`
                                }
                            >
                                {`${appStartTime}`}
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    );
};

export default AppointmentTime;
