"use client";

import { Appointment } from "@/utils/schemas/Appointment";
import { fetchBarberDayAppointments, fetchBarberNextTwoWeeksRosters } from "../../booking/actions";
import AppointmentDate from "./appointmentDate";
import Barber from "./barber";
import Service from "./service";
import { useEffect, useState } from "react";
import AppointmentTime from "./appointmentTime";
import { auth } from '@/src/index.ts'
import { format } from "date-fns";
import Name from "./name";
import { useUserAuth } from "@/src/context/AuthContext";
import PhoneNumber from "./phoneNumber";
import { Form, FormSchema } from "@/utils/schemas/Form";
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import BookButton from './bookButton';

const SLOT_TIME = 20;

const FormComponent = ({ 
        services, 
        users 
    }:{
        services: {[key: string]: number}; 
        users: any;
    }
) => {
    const { user, signUserOut } = useUserAuth();
    
    const emptyAppointmentState: Form = {
        service: "",
        name: "",
        barber: null,
        dates: [],
        telNo: "",
        selectedDay: null,
        avaliableTimes: [],
        selectedTime: { start: null, end: null },
        appointmentsAlreadyBooked: [],
        roster: []
    };
    
    const [appointment, setAppointment] = useState<Form>(emptyAppointmentState);
    const [allowSubmit, setAllowSubmit] = useState(false);


    function findAvailableSlots(appointment: Form) {
        const selectedDay: Date = appointment.selectedDay as Date;
        console.log(`Selected Day: ${selectedDay}`)
        const appointmentsAlreadyBooked: Appointment[] = appointment.appointmentsAlreadyBooked;
        if (appointmentsAlreadyBooked.length === 0) {
            console.log("No appointments already booked.");
        }
        const serviceDuration = services[appointment.service];
        const selectedRoster = appointment.roster[0]
        const dayName = format(selectedDay, 'iiii').toLowerCase();
        console.log(dayName)

        const startOfDay = selectedRoster ? (() => {
            const startTime = selectedRoster.selectedTimes[dayName].start_time;
            console.log(selectedRoster.selectedTimes)
            console.log(`Selected roster start time: ${startTime.hour}:${startTime.min} ${startTime.period}`);
            return new Date(selectedDay).setHours(
                startTime.period === 'AM' ? parseInt(startTime.hour) : parseInt(startTime.hour) + 12,
                parseInt(startTime.min),
                0,
                0
            );
        })() : (() => {
            console.log("Base case invoked: No selected roster, using default start time.");
            return new Date(selectedDay).setHours(9, 0, 0, 0);
        })();

        const endOfDay = selectedRoster ? (() => {
            const endTime = selectedRoster.selectedTimes[dayName].end_time;
            console.log(`Selected roster end time: ${endTime.hour}:${endTime.min} ${endTime.period}`);
            return new Date(selectedDay).setHours(
                endTime.period === 'AM' ? parseInt(endTime.hour) : parseInt(endTime.hour) + 12,
                parseInt(endTime.min),
                0,
                0
            );
        })() : (() => {
            console.log("Base case invoked: No selected roster, using default end time.");
            return new Date(selectedDay).setHours(17, 0, 0, 0);
        })();

        const availableSlots = [];
        let currentTime = new Date(startOfDay);

        while (currentTime < endOfDay) {
            const slotEndTime = new Date(currentTime.getTime() + SLOT_TIME * 60000);

            const isSlotAvailable = !appointmentsAlreadyBooked.some(app => {
                const appStartTime = new Date(app.appStartTime);
                const appEndTime = new Date(app.appEndTime);
                return (currentTime >= appStartTime && currentTime < appEndTime) || (slotEndTime > appStartTime && slotEndTime <= appEndTime);
            });

            if (isSlotAvailable) {
                availableSlots.push({ start: new Date(currentTime), end: new Date(slotEndTime) });
            }

            currentTime = new Date(currentTime.getTime() + SLOT_TIME * 60000);
        }

        return availableSlots;
    }

    async function handleBarberChange(value: any) {
        const roster = await fetchBarberNextTwoWeeksRosters(value.uid);
        setAppointment(prevState => ({
            ...prevState,
            barber: value.uid,
            roster: roster,
            dates: [],
            appointmentsAlreadyBooked: [],
            selectedDay: null,
            selectedTime: {start: null, end: null},
        }));
    }


    async function handleDateChange(value: Date) {
        const appointments = await fetchBarberDayAppointments(appointment.barber, value);
        
        setAppointment(prevState => {
            const updatedAppointment = {
                ...prevState,
                selectedDay: value,
                selectedTime: {start: null, end: null},
                appointmentsAlreadyBooked: appointments
            };

            const availableTimes = findAvailableSlots(updatedAppointment);

            return {
                ...updatedAppointment,
                avaliableTimes: availableTimes
            };
        });
    }

    async function handleTimeChange(time: {start: Date | null, end: Date | null}) {
        setAppointment(prevState => ({
            ...prevState,
            selectedTime: time
        }))
    }

    async function handleServiceChange(service: string) {
        setAppointment(prevState => {
            const updatedAppointment : Form = { ...prevState, service};
            if (appointment.roster && appointment.selectedDay) {
                const availableTimes = findAvailableSlots(updatedAppointment);
                return { ...updatedAppointment, avaliableTimes: availableTimes };
            }
            return updatedAppointment
        });
    }

    const handleSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
        e.preventDefault();
        // Add your submission logic here
        console.log('Submitting appointment:', appointment);
    };

    return (
        <div className="text-xs flex flex-col gap-y-10 px-4 py-5">
        
            <Service service={appointment.service} onChange={(service) => handleServiceChange(service)} services={services}/>
            
            <Barber users={users} barber={appointment.barber} handleBarberChange={handleBarberChange}/>
            
            {(appointment.roster && appointment.barber) && <AppointmentDate 
                roster={appointment.roster} 
                selectedDay={appointment.selectedDay} 
                changeSelectedDay={handleDateChange}
            />}

            {(appointment.roster && appointment.selectedDay) && <AppointmentTime availableTimes={appointment.avaliableTimes} selectedTime={appointment.selectedTime} handleTimeChange={handleTimeChange}/>}

            {(appointment.selectedTime.start && appointment.selectedTime.end) && 
            <>
            <Name value={appointment.name || ''} onChange={e => setAppointment(prev => ({...prev, name: e.target.value}))}/>
            <PhoneNumber 
                user={user} 
                appDetails={appointment} 
                handleAppDetails={e => setAppointment(prev => ({...prev, telNo: e.target.value}))} 
                signUserOut={signUserOut} 
            />
            <BookButton 
                allowSubmit={allowSubmit}
                appointment={appointment}
                onSubmit={handleSubmit}
            />
            </>}
            
        </div>
    )


}

export default FormComponent;