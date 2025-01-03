"use client";

import { Appointment } from "@/utils/schemas/Appointment";
import { fetchBarberDayAppointments, fetchBarberNextTwoWeeksRosters } from "@/utils/actions";
import AppointmentDate from "./appointmentDate";
import Barber from "./barber";
import Service from "./service";
import { useState, useEffect, useRef } from "react";
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
import { useRouter } from "next/navigation";

const SLOT_TIME = 20;
const TIMEZONE = 'Australia/Sydney'; // AEST/AEDT timezone

const FormComponent = ({ 
        services, 
        users,
        initialService
    }:{
        services: {[key: string]: number}; 
        users: any;
        initialService?: string;
    }
) => {
    const { user, signUserOut } = useUserAuth();
    const router = useRouter();

    const getInitialState = () => ({
        service: initialService || "",
        firstname: "",
        lastname: "",
        barber: null,
        dates: [],
        telNo: user?.phoneNumber ? user.phoneNumber.replace(/^(\+61|0)/, '') : "",
        selectedDay: null,
        availableTimes: [],
        selectedTime: { start: null, end: null },
        appointmentsAlreadyBooked: [],
        roster: [],
        availableDaysWithSlots: []
    });
    
    const [appointment, setAppointment] = useState<Form>(getInitialState);
    const [allowSubmit, setAllowSubmit] = useState(false);
    const [isLoadingSlots, setIsLoadingSlots] = useState(false);
    const appointmentsCache = useRef<{ [key: string]: any }>({});

    const getCachedAppointments = async (barberId: string, day: TZDate) => {
        const dateKey = format(day, 'yyyy-MM-dd');
        const cacheKey = `${barberId}_${dateKey}`;
        
        if (appointmentsCache.current[cacheKey]) {
            return appointmentsCache.current[cacheKey];
        }

        const appointments = await fetchBarberDayAppointments(barberId, day);
        console.log(`Fetched appointments for ${barberId} on ${dateKey}:`, appointments);
        appointmentsCache.current[cacheKey] = appointments;
        return appointments;
    };

    const findAvailableSlots = (day: TZDate, appointment: Form) => {
        console.log(`Finding available slots for: ${day}`);
        const selectedDay = new TZDate(day, TIMEZONE);
        const appointmentsAlreadyBooked: Appointment[] = appointment.appointmentsAlreadyBooked;
        const serviceDuration = services[appointment.service];
        const dayName = format(selectedDay, 'iiii').toLowerCase() as 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
        
        const selectedRoster = appointment.roster.find(roster => {
            const rosterStart = new TZDate(roster.selectedTimes.start, TIMEZONE);
            const rosterEnd = roster.selectedTimes.end !== "Never" ? new TZDate(roster.selectedTimes.end, TIMEZONE) : null;
            return (selectedDay >= rosterStart && (!rosterEnd || selectedDay <= rosterEnd));
        });

        const getDayBoundary = (boundaryType: 'start' | 'end') => {
            if (selectedRoster) {
                const time = selectedRoster.selectedTimes[dayName][`${boundaryType}_time`];
                const hour = time.period === 'AM' ? parseInt(time.hour) : parseInt(time.hour) + 12;
                return TZDate.tz(TIMEZONE, selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate(), hour, parseInt(time.min), 0, 0);
            } else {
                const [hours, minutes] = DEFAULT_BUSINESS_HOURS[dayName][`${boundaryType}Time`].split(':');
                return TZDate.tz(TIMEZONE, selectedDay.getFullYear(), selectedDay.getMonth(), selectedDay.getDate(), parseInt(hours), parseInt(minutes), 0, 0);
            }
        };

        const startOfDay = getDayBoundary('start');
        const endOfDay = getDayBoundary('end');

        const availableSlots = [];
        let currentTime = startOfDay;
        
        const currentAESTTime = TZDate.tz(TIMEZONE, new Date());

        while (currentTime < endOfDay) {
            const serviceEndTime = new TZDate(currentTime.getTime() + serviceDuration * 60000, TIMEZONE);
            
            if (serviceEndTime <= endOfDay && currentTime > currentAESTTime) {
                const isSlotAvailable = !appointmentsAlreadyBooked.some(app => {
                    const appStartTime = new TZDate(app.appStartTime as Date, TIMEZONE);
                    const appEndTime = new TZDate(app.appEndTime as Date, TIMEZONE);
                    return (currentTime >= appStartTime && currentTime < appEndTime) || 
                           (serviceEndTime > appStartTime && serviceEndTime <= appEndTime) ||
                           (currentTime <= appStartTime && serviceEndTime >= appEndTime);
                });

                if (isSlotAvailable) {
                    availableSlots.push({
                        start: currentTime,
                        end: serviceEndTime
                    });
                }
            }
            currentTime = new TZDate(currentTime.getTime() + SLOT_TIME * 60000, TIMEZONE);
        }

        return availableSlots;
    }

    const updateAvailableDaysWithSlots = async () => {
        if (!appointment.service || !appointment.barber) return;

        setIsLoadingSlots(true);
        const startRoster = new TZDate(new Date(), TIMEZONE);
        const endRoster = new TZDate(new Date(), TIMEZONE);
        endRoster.setDate(startRoster.getDate() + 14);

        try {
            // Get the roster first
            const roster = await fetchBarberNextTwoWeeksRosters(appointment.barber);
            const availableDaysWithSlots = [];

            // Check each day in the roster for available slots
            for (const rosterItem of roster) {
                const rosterStart = new TZDate(rosterItem.selectedTimes.start, TIMEZONE);
                const rosterEnd = rosterItem.selectedTimes.end !== "Never" 
                    ? new TZDate(rosterItem.selectedTimes.end, TIMEZONE) 
                    : endRoster;

                let currentDay = new TZDate(Math.max(startRoster.getTime(), rosterStart.getTime()), TIMEZONE);
                const lastDay = new TZDate(Math.min(endRoster.getTime(), rosterEnd.getTime()), TIMEZONE);

                while (currentDay <= lastDay) {
                    const dayName = format(currentDay, 'iiii').toLowerCase();
                    if (rosterItem.selectedTimes[dayName].isWorking) {
                        // Fetch appointments for this specific day using cache
                        const appointments = await getCachedAppointments(appointment.barber, currentDay);
                        
                        const updatedAppointment = {
                            ...appointment,
                            appointmentsAlreadyBooked: appointments,
                            roster: roster
                        };

                        const slots = findAvailableSlots(currentDay, updatedAppointment);
                        if (slots.length > 0) {
                            availableDaysWithSlots.push({
                                day: new TZDate(currentDay, TIMEZONE),
                                slots: slots
                            });
                        }
                    }
                    currentDay = new TZDate(currentDay.getTime() + 24 * 60 * 60 * 1000, TIMEZONE);
                }
            }

            setAppointment(prev => ({
                ...prev,
                roster: roster,
                availableDaysWithSlots
            }));
        } catch (error) {
            console.error('Error updating available days:', error);
        } finally {
            setIsLoadingSlots(false);
        }
    };

    useEffect(() => {
        if (appointment.service && appointment.barber) {
            updateAvailableDaysWithSlots();
        }
    }, [appointment.service, appointment.barber]);

    const handleBarberChange = async (value: any) => {
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

    const handleDayChange = (day: TZDate) => {
        const dayData = appointment.availableDaysWithSlots.find(d => 
            format(d.day, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd')
        );
        
        setAppointment({
            ...appointment,
            selectedDay: day,
            availableTimes: dayData?.slots || [],
            selectedTime: { start: null, end: null }
        });
    }

    async function handleDateChange(value: TZDate) {
        const appointments = await getCachedAppointments(appointment.barber, value);
        
        setAppointment(prevState => {
            const updatedAppointment = {
                ...prevState,
                selectedDay: value,
                selectedTime: {start: null, end: null},
                appointmentsAlreadyBooked: appointments
            };

            const availableTimes = findAvailableSlots(value, updatedAppointment);

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
                const availableTimes = findAvailableSlots(appointment.selectedDay, updatedAppointment);
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
    
    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const appointmentToSubmit: Appointment = {
            service: appointment.service,
            barberUID: appointment.barber,
            firstname: appointment.firstname,
            lastname: appointment.lastname,
            telNo: appointment.telNo,
            appDay: Timestamp.fromDate(appointment.selectedDay as TZDate),
            appStartTime: Timestamp.fromDate(appointment.selectedTime.start as TZDate),
            appEndTime: Timestamp.fromDate(appointment.selectedTime.end as TZDate),
            isExtra: false // Set this based on your logic
        };
        await publishToAppointments(appointmentToSubmit);
        router.push('/bookings');
    }

    return (
        <div className="text-xs flex flex-col gap-y-10 px-4 py-5">
        
            <Service service={appointment.service} onChange={(service) => handleServiceChange(service)} services={services}/>
            
            <Barber users={users} barber={appointment.barber} handleBarberChange={handleBarberChange}/>
            
            {appointment.barber && !appointment.service && (
                <p className="text-red-500 mt-2 text-xl">Please select a service</p>
            )}
            
            {(appointment.service && appointment.roster && appointment.barber) && <AppointmentDate 
                roster={appointment.roster} 
                selectedDay={appointment.selectedDay as TZDate | null} 
                changeSelectedDay={handleDayChange}
                availableDaysWithSlots={appointment.availableDaysWithSlots}
                isLoading={isLoadingSlots}
            />}

            {(appointment.roster && appointment.selectedDay) && <AppointmentTime 
                availableTimes={appointment.availableTimes} 
                selectedTime={appointment.selectedTime} 
                handleTimeChange={handleTimeChange}
                isLoading={isLoadingSlots}
            />} 

            {(appointment.selectedTime.start && appointment.selectedTime.end) && 
            <>
            <Name
                value={{ firstname: appointment.firstname || '', lastname: appointment.lastname || '' }}
                onChange={(newValue) => setAppointment(prev => ({
                    ...prev,
                    firstname: newValue.firstname,
                    lastname: newValue.lastname
                }))}
            />
            {/* <PhoneNumber 
                user={user} 
                appDetails={appointment} 
                handleAppDetails={e => {setAppointment(prev => ({...prev, telNo: e.target.value}))}} 
                signUserOut={signUserOut} 
            /> */}
            <BookButton 
                allowSubmit={Boolean(appointment.selectedTime.start && appointment.selectedTime.end && appointment.firstname && appointment.lastname && appointment.telNo)}
                onSubmit={handleSubmit}
            />
            </>}
            
        </div>
    )


}

export default FormComponent;