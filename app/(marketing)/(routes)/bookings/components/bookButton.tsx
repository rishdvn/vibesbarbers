"use client";

import { useUserAuth } from '@/src/context/AuthContext';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/src/index.ts';
import { AppointmentSchema } from '@/utils/schemas/Appointment';

interface BookButtonProps {
    allowSubmit?: boolean;
    onSubmit?: (e: React.MouseEvent<HTMLButtonElement>) => void;
    appointment: any;
}

const BookButton = ({
    allowSubmit = true,
    onSubmit,
    appointment,
}: BookButtonProps) => {
    const handleBooking = async (e) => {
        e.preventDefault();
        if (allowSubmit) {
            try {
                // Create an instance of Appointment using form details
                const appointmentData = AppointmentSchema.parse({
                    service: appointment.service,
                    barberUID: appointment.barber,
                    firstname: appointment.name,
                    telNo: appointment.telNo,
                    appDay: appointment.selectedDay,
                    appStartTime: appointment.selectedTime.start,
                    appEndTime: appointment.selectedTime.end,
                    isExtra: false // Set this based on your logic
                });
                const docRef = await addDoc(collection(db, 'appointments'), appointmentData);
                console.log('Document written with ID: ', docRef.id);
                // Reset appointment state or show success message
            } catch (e) {
                console.error('Error adding document: ', e);
            }
        }
    };

    return (
        <div className="sticky bottom-0 border-t border-gray-200 bg-white w-full flex justify-end space-x-3 px-4 py-2 sm:px-4">
            <button
                onClick={handleBooking}
                disabled={!allowSubmit}
                className="disabled:bg-gray-300 disabled:cursor-not-allowed flex w-full justify-center rounded-md bg-black p-3 text-md font-medium text-white hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
            >
                BOOK
            </button>
        </div>
    );
};

export default BookButton;
