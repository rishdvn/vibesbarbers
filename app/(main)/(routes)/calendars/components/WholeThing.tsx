import { User } from '@/utils/schemas/User';
import React from 'react';
import { BarberItem } from './BarberItem';
import { useCalendar } from '../context';
import { format, parse } from 'date-fns';
import { CalendarItem } from './CalendarItem';
import { ExtraItem } from './ExtraItem';
import { convertTo24Hour } from '@/utils/time';
import { AppointmentDoc } from '@/utils/schemas/Appointment';

export const WholeThing = () => {
    
    const { timeSlots, selectedDay, appointments, timeAppointmentBarberMap, workingBarbers } = useCalendar();
    const dayName = format(selectedDay, 'EEEE').toLowerCase();
    const dayTiming = timeSlots[dayName];

    // Convert AM/PM time to 24-hour format with minutes
    const getTimeKeys = (time: string): string[] => {
        const baseHour = convertTo24Hour(time);
        const hour = parseInt(baseHour.split(':')[0]);
        return [0, 20, 40].map(minutes => 
            `${hour.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
        );
    };

    // Get the extra appointments time slot key
    const lastTimeSlot = dayTiming[dayTiming.length - 1];
    const lastHour24 = convertTo24Hour(lastTimeSlot);
    const extraTimeKey = `${(parseInt(lastHour24.split(':')[0]) + 1).toString().padStart(2, '0')}:00`;

    // Get all extra appointments for each barber
    const getExtraAppointments = (barberId: string) => {
        return Array.from(timeAppointmentBarberMap.values())
            .map(barberMap => barberMap.get(barberId))
            .filter(app => app?.appDetails.isExtra) as AppointmentDoc[];
    };

    return (
        <div className="w-full">
            
            <div className="h-20 flex flex-row w-full">
                {/* Barber headers */}
                <div className="w-10 flex-shrink-0" /> {/* Spacer for time axis */}
                {workingBarbers.map((barber) => (
                    <div key={barber.uid} className="flex-1 text-center min-w-0">
                        <span className="text-sm font-medium">{barber.displayName}</span>
                    </div>
                ))}
            </div>

            {/* Regular time slots */}
            {dayTiming.map((displayTime: string) => {
                const timeKeys = getTimeKeys(displayTime);
                
                return (
                    <div key={displayTime} className="flex flex-row w-full items-start border-t border-gray-200">
                        {/* Time Axis */}
                        <div className="w-10 h-60 flex-shrink-0 flex flex-col justify-start border-r border-gray-200 items-center">
                            <span className="text-xs leading-5 text-gray-400 mt-1">
                                {displayTime}
                            </span>
                            <div className="flex flex-col h-full justify-between px-1">
                                {[':00', ':20', ':40'].map((minutes, i) => (
                                    <span key={minutes} className="text-[10px] text-gray-300">
                                        {minutes}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {/* Each barber is a column */}
                        {workingBarbers.map((barber) => (
                            <div key={barber.uid} className="flex-1 h-60 min-w-0 border-r border-gray-200">
                                <div className="flex flex-col h-full w-full">
                                    {timeKeys.map((timeKey) => {
                                        const appointment = timeAppointmentBarberMap.get(timeKey)?.get(barber.uid);
                                        return (
                                            <div key={timeKey} className="h-1/3 border-b border-gray-200">
                                                {appointment && (
                                                    <div className="p-2 bg-blue-100 h-full">
                                                        ID: {appointment.id}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                );
            })}

            {/* Extra Appointments Time Slot */}
            <div className="flex flex-row w-full items-start border-t-2 border-gray-300 bg-gray-50">
                {/* Time Axis */}
                <div className="w-10 h-60 flex-shrink-0 flex flex-col justify-start border-r border-gray-200 items-center">
                    <span className="text-xs leading-5 text-gray-400 mt-1">
                        Extra
                    </span>
                </div>

                {/* Each barber's extra appointments */}
                {workingBarbers.map((barber) => {
                    const extraAppointments = getExtraAppointments(barber.uid);
                    return (
                        <div key={barber.uid} className="flex-1 h-60 min-w-0 border-r border-gray-200">
                            <div className="flex flex-col h-full w-full">
                                <div className="p-2 border-b border-gray-200 bg-gray-100 sticky top-0">
                                    <span className="text-sm font-bold text-gray-600">Extra Appointments</span>
                                </div>
                                <div className="p-2 overflow-y-auto max-h-[calc(100%-2.5rem)] space-y-2">
                                    {extraAppointments.map(appointment => (
                                        <div key={appointment.id} className="p-2 bg-yellow-100 rounded">
                                            ID: {appointment.id}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};