"use client";

import { Appointment } from "@/utils/schemas/Appointment";
import { fetchBarberDayAppointments, fetchBarberNextTwoWeeksRosters } from "../../booking/actions";
import AppointmentDate from "./appointmentDate";
import Barber from "./barber";
import Service from "./service";
import { useEffect, useState } from "react";
import AppointmentTime from "./appointmentTime";
import { auth, db } from '@/src/index.ts'
import { format } from "date-fns";
import { TZDate } from "@date-fns/tz";
import Name from "./name";
import { useUserAuth } from "@/src/context/AuthContext";
import PhoneNumber from "./phoneNumber";
import { Form, FormSchema } from "@/utils/schemas/Form";
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import BookButton from './bookButton';
import { addDoc, collection, Timestamp } from "firebase/firestore";
import { DEFAULT_BUSINESS_HOURS } from '@/utils/time';

const SLOT_TIME = 20;
const TIMEZONE = 'Australia/Sydney'; // AEST/AEDT timezone

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
        const selectedDay = new TZDate(appointment.selectedDay as Date, TIMEZONE);
        console.log(`Selected Day: ${selectedDay}`)
        const appointmentsAlreadyBooked: Appointment[] = appointment.appointmentsAlreadyBooked;
        if (appointmentsAlreadyBooked.length === 0) {
            console.log("No appointments already booked.");
        }
        const serviceDuration = services[appointment.service];
        const selectedRoster = appointment.roster[0]
        const dayName: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' = format(selectedDay, 'iiii').toLowerCase() as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
        console.log(dayName)

        const startOfDay = selectedRoster ? (() => {
            const startTime = selectedRoster.selectedTimes[dayName].start_time;
            console.log(selectedRoster.selectedTimes)
            console.log(`Selected roster start time: ${startTime.hour}:${startTime.min} ${startTime.period}`);
            // Create date in AEST/AEDT
            const hour = startTime.period === 'AM' ? parseInt(startTime.hour) : parseInt(startTime.hour) + 12;
            return TZDate.tz(TIMEZONE, selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate(), hour, parseInt(startTime.min), 0, 0);
        })() : (() => {
            console.log("Base case invoked: Using default business hours.");
            const [hours, minutes] = DEFAULT_BUSINESS_HOURS[dayName].openTime.split(':');
            return TZDate.tz(TIMEZONE, selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate(), parseInt(hours), parseInt(minutes), 0, 0);
        })();

        const endOfDay = selectedRoster ? (() => {
            const endTime = selectedRoster.selectedTimes[dayName].end_time;
            console.log(`Selected roster end time: ${endTime.hour}:${endTime.min} ${endTime.period}`);
            const hour = endTime.period === 'AM' ? parseInt(endTime.hour) : parseInt(endTime.hour) + 12;
            return TZDate.tz(TIMEZONE, selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate(), hour, parseInt(endTime.min), 0, 0);
        })() : (() => {
            console.log("Base case invoked: Using default business hours.");
            const [hours, minutes] = DEFAULT_BUSINESS_HOURS[dayName].closeTime.split(':');
            return TZDate.tz(TIMEZONE, selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate(), parseInt(hours), parseInt(minutes), 0, 0);
        })();

        const availableSlots = [];
        let currentTime = startOfDay;
        
        // Get current time in AEST
        const currentAESTTime = TZDate.tz(TIMEZONE, new Date());

        while (currentTime < endOfDay) {
            const slotEndTime = new TZDate(currentTime.getTime() + SLOT_TIME * 60000, TIMEZONE);

            // Check if the slot is after current AEST time
            if (currentTime > currentAESTTime) {
                const isSlotAvailable = !appointmentsAlreadyBooked.some(app => {
                    const appStartTime = new TZDate(app.appStartTime as Date, TIMEZONE);
                    const appEndTime = new TZDate(app.appEndTime as Date, TIMEZONE);
                    return (currentTime >= appStartTime && currentTime < appEndTime) || (slotEndTime > appStartTime && slotEndTime <= appEndTime);
                });

                if (isSlotAvailable) {
                    availableSlots.push({ 
                        start: currentTime, 
                        end: slotEndTime,
                        displayTime: format(currentTime, "h:mm 'a' '(AEST)'")
                    });
                }
            }

            currentTime = new TZDate(currentTime.getTime() + SLOT_TIME * 60000, TIMEZONE);
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

    async function handleTimeChange(time: {start: TZDate | null, end: TZDate | null}) {
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

    async function publishToAppointments(appDetails: Appointment) {
        try {
          const docRef = await addDoc(collection(db, "appointments"), {
            appDetails
          });
          console.log("Document written with ID: ", docRef.id);
        } catch (e) {
          console.error("Error adding document: ", e);
        }
      }
    
    const [submited, setSubmited] = useState(false);
    
    async function handleSubmit(e: { preventDefault: () => void; }) {
        e.preventDefault();
        const appointmentToSubmit: Appointment = {
            service: appointment.service,
            barberUID: appointment.barber,
            firstname: appointment.name,
            telNo: appointment.telNo,
            appDay: Timestamp.fromDate(appointment.selectedDay as TZDate),
            appStartTime: Timestamp.fromDate(appointment.selectedTime.start as TZDate),
            appEndTime: Timestamp.fromDate(appointment.selectedTime.end as TZDate),
            isExtra: false // Set this based on your logic
        };
        await publishToAppointments(appointmentToSubmit);
        setSubmited(true);
    }

    return (
        <div className="text-xs flex flex-col gap-y-10 px-4 py-5">
        
            <Service service={appointment.service} onChange={(service) => handleServiceChange(service)} services={services}/>
            
            <Barber users={users} barber={appointment.barber} handleBarberChange={handleBarberChange}/>
            
            {(appointment.roster && appointment.barber) && <AppointmentDate 
                roster={appointment.roster} 
                selectedDay={appointment.selectedDay as TZDate | null} 
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