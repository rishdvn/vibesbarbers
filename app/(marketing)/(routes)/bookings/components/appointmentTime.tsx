import React, { useState, useEffect } from 'react';
import { format, isSameSecond } from 'date-fns';

const AppointmentTime = ({ availableTimes, selectedTime, handleTimeChange }) => {
    return (
        <div>
            {availableTimes.length === 0 ? "The barber is fully booked for the day. Please select another day." : (
                <div className="flex flex-col gap-y-2">
                    <label htmlFor="User-name" className="block text-xs font-semibold leading-6 text-gray-900 sm:mt-1.5">
                        <div className='flex flex-row gap-x-1'>
                            <span className='text-red-600'>4.</span>
                            APPOINTMENT TIME
                        </div>
                    </label>
                    Haircut: 20 minutes, Haircut & Beard: 40 minutes
                    {availableTimes.map(time => {
                        const appStartTime = format(time.start, "hh:mm a");
                        const appEndTime = format(time.end, "hh:mm a");

                        const isSelectedApp = isSameSecond(time.start, selectedTime.start) && isSameSecond(time.end, selectedTime.end);
                        return (
                            <div
                                key={time.start.toISOString() + Math.random()}
                                onClick={() => handleTimeChange({ start: time.start, end: time.end })}
                                className={
                                    `text-gray-600 cursor-pointer select-none py-2 px-1 border border-gray-300 rounded-lg ${isSelectedApp ? 'text-gray-800 font-medium ring-2 ring-offset-1 ring-blue-500' : ''}`
                                }
                            >
                                {`${appStartTime}`}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default AppointmentTime;
