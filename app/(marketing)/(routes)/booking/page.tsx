"use client";

import { Fragment, forwardRef, useEffect, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore'
import { auth, db } from '@/src/index.ts'
import { add, addDays, addHours, addMinutes, areIntervalsOverlapping, differenceInMinutes, eachDayOfInterval, endOfDay, endOfMonth, endOfWeek, format, formatDistance, getDay, isBefore, isEqual, isSameDay, isSameMonth, isSameSecond, parse, parseISO, set, startOfDay, startOfWeek, toDate } from 'date-fns';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { useUserAuth } from '@/src/context/AuthContext';


function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
  }

  const serviceOptions = [
    { title: 'Haircut'},
    { title: 'Haircut & Beard'}    
  ]

const BookingPage = () => {
  const { user, signUserOut } = useUserAuth();

  const handleNumberChange = () => {
    setOtpSent(false);
    setVerified(false);
    setAppDetails(prev => ({...prev, "telNo": ""}))
    signUserOut();
  }

  auth.languageCode = 'en';

  const [otp, setOtp] = useState('');
  const [confirmationResult,setConfirmationResult] = useState(null);
  const [otpSent, setOtpSent] = useState(false);

  interface Window {
    recaptchaVerifier?: any;
}

  useEffect(() => {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'normal',
      'callback': (response) => {
        console.log(response)
      },
      'expired-callback': () => {
        console.log('expired')
      }
    });
  }, [auth])

    const handleOTPChange = (e) => {
      setOtp(e.target.value);
    }

    const handleSendOtp = async (e) => {
      const formattedPhoneNumber = `+61${appDetails.telNo.replace(/\D/g, '')}`;
      signInWithPhoneNumber(auth, formattedPhoneNumber, window.recaptchaVerifier).then(
        (confirmationResult) => {
          setConfirmationResult(confirmationResult);
          setOtpSent(true);
          alert('OTP has been sent');
        }
      ).catch((error) => {
        console.error(error)
      })
    };

    const [verified, setVerified] = useState(false)

    const handleOTPSubmit = async (e) => {
      confirmationResult.confirm(otp).then((result) => {
        const user = result.user;
        setVerified(true);
      }).catch((error) => {
        console.error(error)
      })
    }

    {/* 0. FETCH RELEVANT DATA */}
    // fetch users, filter for barbers
    const [users, setUsers] = useState([]);

    useEffect(() => {
    onSnapshot(collection(db, "users"), (querySnapshot) => {
        const usersFetched = [];
        querySnapshot.forEach((doc) => {
        if (doc.data().approved === true && (doc.data().role === 'Barber' || doc.data().role === 'Admin')){
            usersFetched.push(doc.data());
        }      
        });
        setUsers(usersFetched);
    })
    },[])

  // fetch all rosters
  const [rosters, setRosters] = useState(null);

  useEffect(() => {
    onSnapshot(collection(db, "roster"), (querySnapshot) => {
      const rostersFetched = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        rostersFetched[doc.id] = data;
      });
      setRosters(rostersFetched);
    });
  },[])

  // fetch existing appointments
  const [appointments, setAppointments] = useState([]);
  
  useEffect(() => {
    onSnapshot(collection(db, "appointments"), (querySnapshot) => {
      const tempApps = []
      querySnapshot.forEach((doc) => {
        tempApps.push(doc.data());    
      });
      setAppointments(tempApps);
    })
  },[])

  {/* 1. PUBLISH DATA TO DATABASE */}
  async function publishToAppointments(appDetails) {
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

  async function handleSubmit(e) {
    e.preventDefault();
    await publishToAppointments(appDetails);
    setSubmited(true);
  }


  // initialize appDetials object
  const [appDetails, setAppDetails] = useState({
    service: "",
    barberUID: "",
    firstname: "",
    telNo: "",
    appDay: "",
    appStartTime: "",
    appEndTime: "",
    isExtra: false
  });

  const [allowSubmit, setAllowSubmit] = useState(false);

  useEffect(() => {
    // if any field not filled, disable submit button
    if (
      appDetails.firstname === "" || 
      !(appDetails.telNo.length === 9) ||
      (/^\d+$/.test(appDetails.telNo) === false) ||
      appDetails.appDay === "" || 
      (appDetails.isExtra === false && (appDetails.appStartTime === "" || appDetails.appEndTime === "") ||
      (user === null))
    ) {
      setAllowSubmit(false)
    } else {
      setAllowSubmit(true)
    }
  },[appDetails, verified, user])

  useEffect(() => {
    if (user && user.phoneNumber) {
      const phoneNo = user.phoneNumber.slice(3)
      setAppDetails(prev => ({...prev, "telNo": phoneNo}))
    } else if (user && user.email) {
      signUserOut();
    }
  },[user])

    {/* 2. CALENDARS + APPOINTMENTS */}

    const today = startOfDay(new Date());
    const [selectedDay, setSelectedDay] = useState(today);
    const [currentMonth, setCurrentMonth] = useState(format(today,'MMM-yyyy'));
    let firstDayCurrentMonth = parse(currentMonth, 'MMM-yyyy', new Date())

    function changeSelectedDay(day: string) {
        setAppDetails(prev => ({...prev, "appDay": day}))
        setSelectedDay(day)
    }

    // handle isExtra deleting selectedDay to avoid errors
    useEffect(() => {
      setAppDetails(prev => ({...prev, "appDay": "", "appStartTime": "", "appEndTime": ""}))
    },[appDetails.isExtra])

    // find all barber rosters
    const [relevantRosters, setRelevantRosters] = useState(null);

    useEffect(() => {
      const tempRelevantRosters = [];
      if (rosters) {
        for (let key in rosters) {
          const roster = rosters[key];
          if (roster.uid === appDetails.barberUID) {
            tempRelevantRosters.push(roster)
          }
        }
      }
      setRelevantRosters(tempRelevantRosters);
    }, [appDetails, rosters])

    // determine appointment times
    const [appointmentTimes, setAppointmentTimes] = useState(null);

    // determine existing appointments
    const [barberExistingApps, setBarberExistingApps] = useState(null);

    useEffect(() => {
      if (appDetails.barberUID) {
        const tempBarberExistingApps = [];
        for (let app of appointments) {
          if (app.appDetails.barberUID === appDetails.barberUID) {
            tempBarberExistingApps.push(app)
          }
        }
        setBarberExistingApps(tempBarberExistingApps);          
      }
    }, [appDetails, appointments])

    // find possible appointment times for the day
    useEffect(() => {
      if (!(appDetails.barberUID === "")) {
        //1. have relevant rosters preped
        //2. find day's roster
        let dayRoster = null;
        const appointmentDay = appDetails.appDay;
        for (let roster of relevantRosters) {
          const rosterInfo = roster.selectedTimes
          const rosterStartTime = rosterInfo.start;
          const rosterEndTime = rosterInfo.end;
          if (!(rosterEndTime === "Never")) {
            if (areIntervalsOverlapping({start: appointmentDay, end: endOfDay(appointmentDay)},{start: rosterStartTime.toDate(), end: rosterEndTime.toDate()})) {
              dayRoster = rosterInfo;
            }
          } else {
            if ((appointmentDay < rosterStartTime.toDate() || isSameDay(appointmentDay, rosterStartTime.toDate())) && endOfDay(appointmentDay) > rosterStartTime.toDate() || 
            (appointmentDay > rosterStartTime.toDate()) ) {
              dayRoster = rosterInfo;
            }
          }
        }

        //3. find appointment times
        setAppointmentTimes(null);
        
        if (dayRoster) {
          if (!(appDetails.appDay === "")) {
            const dayWeekDay = format(appDetails.appDay, 'iiii').toLowerCase()
            const rosterStartTimeObject = dayRoster[dayWeekDay].start_time;
            const rosterEndTimeObject = dayRoster[dayWeekDay].end_time;
            let rosterStartTime; 
            let rosterEndTime;

            const now = new Date();
    
            if (rosterStartTimeObject.period === "AM") {
              rosterStartTime = addMinutes(addHours(selectedDay, Number(rosterStartTimeObject.hour)),rosterStartTimeObject.min)
            } else {
              rosterStartTime = addMinutes(addHours(selectedDay, Number(rosterStartTimeObject.hour) + 12),rosterStartTimeObject.min)
            }
    
            if (rosterEndTimeObject.period === "AM") {
              rosterEndTime = addMinutes(addHours(selectedDay, Number(rosterEndTimeObject.hour)),rosterEndTimeObject.min)
            } else {
              rosterEndTime = addMinutes(addHours(selectedDay, Number(rosterEndTimeObject.hour) + 12),rosterEndTimeObject.min)
            }
    
            let potentialStartTimes = [];
            let time = rosterStartTime;
    
            while (time < rosterEndTime) {
              potentialStartTimes.push(time)
              time = addMinutes(time, 20)
            }
    
            const appointmentTimes = [];  
            for (let [index, time] of potentialStartTimes.entries()) {
              if (appDetails.service === "Haircut") {
                const appStartTime = time;
                const appEndTime = addMinutes(time, 20);
                // check for overlap between any existing appointments/lunch breaks
                let overlapExists = false;
                for (let app of barberExistingApps) {
                  if (!app.appDetails.isExtra) {
                    const existingStartTime = app.appDetails.appStartTime.toDate();
                    const existingEndTime = app.appDetails.appEndTime.toDate();
                    if (areIntervalsOverlapping({start: appStartTime, end: appEndTime},{start: existingStartTime, end: existingEndTime})) {
                      overlapExists = true;
                    }
                  }
                }
                // check if time has not passed
                let isPassed = false;
                if (isBefore(appStartTime, now)) {
                  isPassed = true;
                }
                // if no overlap and not passed, add to appointment times
                if (!overlapExists && !isPassed) {
                  appointmentTimes.push({start: appStartTime, end: appEndTime})
                }
              } else if (appDetails.service === "Haircut & Beard") {
                if (index < potentialStartTimes.length - 1) {
                  const appStartTime = time;
                  const appEndTime = addMinutes(time, 40);
                  // check for overlap between any existing appointments/lunch breaks
                  let overlapExists = false;
                  for (let app of barberExistingApps) {
                    if (!app.appDetails.isExtra) {
                      const existingStartTime = app.appDetails.appStartTime.toDate();
                      const existingEndTime = app.appDetails.appEndTime.toDate();
                      if (areIntervalsOverlapping({start: appStartTime, end: appEndTime},{start: existingStartTime, end: existingEndTime})) {
                        overlapExists = true;
                      }
                    }
                  }
                  // check if time has not passed
                  let isPassed = false;
                  if (isBefore(appStartTime, now)) {
                    isPassed = true;
                  }
                  // if no overlap and not passed, add to appointment times
                  if (!overlapExists && !isPassed) {
                    appointmentTimes.push({start: appStartTime, end: appEndTime})
                  }
                }
              }
            }
            setAppointmentTimes(appointmentTimes);
          }
        }

      }
    },[appDetails, rosters, relevantRosters, selectedDay, barberExistingApps])

    // mobible 2 week interval!
    const [twoWeekInterval, setTwoWeekInterval] = useState(eachDayOfInterval({
        start: today,
        end: addDays(today, 14)
      }))

    const [barbersWorking, setBarbersWorking] = useState([]);

    useEffect(() => {
        const tempBarbersWorking = []
        for (let user of users) {
            let isWorking = false;
            for (let day of twoWeekInterval) {
                let dayIsWorking;
                if (rosters) {
                    for (let key in rosters) {
                        const roster = rosters[key];
                        const rosterUID = roster.uid;
                        if (rosterUID === user.uid) {
                            const rosterInfo = roster.selectedTimes
                            const rosterStartTime = rosterInfo.start;
                            const rosterEndTime = rosterInfo.end;
                            // determine if overlaps exists, and if so, check if working that day
                            // if rostered end time is a date
                            if (!(rosterEndTime === "Never")) {
                                // if selected time overlaps with rostered time
                                if (areIntervalsOverlapping({start: day, end: endOfDay(day)},{start: rosterStartTime.toDate(), end: rosterEndTime.toDate()})) {
                                    // check if working
                                    const dayWeekDay = format(day, 'iiii').toLowerCase()
                                    if (rosterInfo[dayWeekDay].isWorking) {
                                        dayIsWorking = true;
                                    } else {
                                        dayIsWorking = false;
                                    }
                                }
                                // if rostered end time is indefinite
                            } else {
                                // check for overlap with rostered schedule
                                if ((day < rosterStartTime.toDate() || isSameDay(day, rosterStartTime.toDate())) && endOfDay(day) > rosterStartTime.toDate() || 
                                (day > rosterStartTime.toDate()) ) {
                                // check if working
                                const dayWeekDay = format(day, 'iiii').toLowerCase()
                                if (rosterInfo[dayWeekDay].isWorking) {
                                    dayIsWorking = true;                    
                                } else {
                                    dayIsWorking = false;
                                }}
                            }
                        }
                    }
                    if (dayIsWorking) {
                        isWorking = true;
                        break;
                    }
                }
            }
            if (isWorking) {
            tempBarbersWorking.push(user)
            }
        }
        setBarbersWorking(tempBarbersWorking)
    },[twoWeekInterval, users, rosters, relevantRosters])

    const DayItem = (dayObj) => {
      const day = dayObj.day;
      let dayIsWorking = true;
      for (let roster of relevantRosters) {
        const rosterInfo = roster.selectedTimes
        const rosterStartTime = rosterInfo.start;
        const rosterEndTime = rosterInfo.end;
        // determine if overlaps exists, and if so, check if working that day
        // if rostered end time is a date
        if (!(rosterEndTime === "Never")) {
          // if selected time overlaps with rostered time
          if (areIntervalsOverlapping({start: day, end: endOfDay(day)},{start: rosterStartTime.toDate(), end: rosterEndTime.toDate()})) {
            // check if working
            const dayWeekDay = format(day, 'iiii').toLowerCase()
            if (rosterInfo[dayWeekDay].isWorking) {
              dayIsWorking = true;
            } else {
              dayIsWorking = false;
            }
          }
          // if rostered end time is indefinite
        } else {
          // check for overlap with rostered schedule
          if ((day < rosterStartTime.toDate() || isSameDay(day, rosterStartTime.toDate())) && endOfDay(day) > rosterStartTime.toDate() || 
          (day > rosterStartTime.toDate()) ) {
            // check if working
            const dayWeekDay = format(day, 'iiii').toLowerCase()
            if (rosterInfo[dayWeekDay].isWorking) {
              dayIsWorking = true;                    
            } else {
              dayIsWorking = false;
            }
          }
        }
      }

      return (
          <div key={format(day,'iiiii')} className='flex flex-col items-center justify-center gap-y-1'>
              <div>{format(day,'iiiii')}</div>
              <button
                  className={classNames(
                      'flex items-center justify-center h-14 w-14 rounded-3xl flex-shrink-0 text-md font-semibold',
                      (dayIsWorking) ? 'bg-gray-200 cursor-pointer hover:bg-gray-100' : 'bg-gray-50 cursor-not-allowed',
                      isSameDay(appDetails.appDay,day) ? 'ring-2 ring-offset-1 ring-blue-500' : ''
                  )}
                  onClick={(event) => {
                    event.preventDefault();
                    changeSelectedDay(day);
                  }}
                  disabled={!dayIsWorking}
              >{format(day,'d')}</button>
          </div>
      )
    }
    
  // Create a app details object that dynamically stores
  function handleAppDetails(e) {
    setAppDetails(prev => ({...prev, [e.target.name]: e.target.value}))
  }

  const handleServiceChange = (serviceObject) => {
    setAppDetails(prev => ({...prev, service: serviceObject.title, appDay: "", appStartTime: "", appEndTime: ""}));
  }

  const handleBarberChange = (barberObject) => {
    setAppDetails(prev => ({...prev, barberUID: barberObject.uid, appDay: "", appStartTime: "", appEndTime: ""}));
  }

    return (
    <div className='h-full flex flex-col items-center'>
      {submited ? (
        <div  className='w-full max-w-screen-md flex h-full flex-col'>
            {/* HEADER */}
            <div className="text-xl font-medium bg-black px-4 py-9 sm:px-4 text-white">
                {submited ? "Appointment booked" : "Book an appointment"}
            </div>
            {/* Divider container */}
          <div className="text-xs flex flex-col gap-y-6 px-3 py-5">
                <div
                  className='flex flex-col gap-y-2 items-center text-base'
                >
                    <label
                        className="text-lg block font-semibold text-gray-900"
                    >
                        BOOKING CONFIRMATION
                    </label>
                  <div className='flex flex-col gap-y-2 items-center rounded-md border border-gray-200 p-2'>
                  <div className='flex text-lg font-medium text-red-700'>
                      Please screenshot for your reference.
                  </div>

                  <div className='flex flex-col gap-y-1 items-center'>
                    {/* SERVICE */}
                    <div className="grid grid-cols-1 space-y-0">
                        <label
                            className="block font-semibold leading-6 text-gray-900 sm:mt-1.5"
                        >
                            {/* SERVICE */}
                        </label>
                        <div className='flex py-1 font-semibold text-lg'>
                            {appDetails.service}
                        </div>
                    </div>

                    {/* APP DATE */}
                    <div className="grid grid-cols-1 gap-1 space-y-0">
                        <label
                            className="block font-semibold leading-6 text-gray-900 sm:mt-1.5"
                        >
                            {/* APPOINTMENT DATE */}
                        </label>
                        <div className='flex py-1 flex-row gap-x-1'>
                            on
                            <span className='font-semibold'>
                              {format(appDetails.appDay,'dd/MM/yyyy')}
                            </span>
                        </div>
                    </div>

                    {/* APP TIME */}
                    <div className="grid grid-cols-1 gap-1 space-y-0">
                        <label
                            className="block font-semibold leading-6 text-gray-900 sm:mt-1.5"
                        >
                            {/* APPOINTMENT TIME */}
                        </label>
                        <div className='flex py-1 flex-row gap-x-1'>
                            at
                            <span className='font-semibold'>
                              {`${format(appDetails.appStartTime,'hh:mm a')}`}
                            </span>
                        </div>
                    </div>

                    {/* BARBER */}
                    <div className="grid grid-cols-1 space-y-0">
                        <label
                            className="block font-semibold leading-6 text-gray-900 sm:mt-1.5"
                        >
                            {/* BARBER */}
                        </label>
                        <div className='flex py-1'>
                            with {users.find(user => user.uid === appDetails.barberUID).firstname}
                        </div>
                    </div>
                  </div>
                    <div className='flex text-sm text-center font-medium text-gray-700'>
                        Call us on
                          +(03) 9363 1126
                        for cancellations or multiple bookings.
                    </div>
                    <div className='flex text-sm text-center font-medium text-gray-700'>
                        Please arrive 5 minutes or you will be penalised.
                    </div>
                  </div>
                </div>
          </div>

        </div>
      ) : (
        <form className="w-full max-w-screen-md flex h-full flex-col">
            {/* HEADER */}
            <div className="text-xl font-medium bg-black px-4 py-9 sm:px-4 text-white">
                Book an appointment
            </div>

            {/* Divider container */}
            <div className="text-xs flex flex-col gap-y-10 px-4 py-5">
                {/* SERVICE */}
                <div className="grid grid-cols-1 gap-1 space-y-0">
                    <label
                        className="block font-semibold leading-6 text-gray-900 sm:mt-1.5"
                    >
                        <div className='flex flex-row gap-x-1'>
                          <span className='text-red-600'>
                            1.
                          </span>
                          SERVICE
                        </div>
                    </label>
                    {serviceOptions.map((service) => (
                        <div 
                            key={service.title} 
                            className={classNames(
                                'flex rounded-lg cursor-pointer hover:bg-gray-50 border border-gray-200 p-3',
                                appDetails.service === service.title ? 'ring-2 ring-offset-1 ring-blue-500' : ''
                            )}
                            onClick={() => handleServiceChange(service)}
                        >
                            {service.title}
                        </div>
                    ))}
                </div>

                {/* BARBER */}
                <div className="grid grid-cols-1 gap-1 space-y-0">
                    <label
                        className="block font-semibold leading-6 text-gray-900 sm:mt-1.5"
                    >
                        <div className='flex flex-row gap-x-1'>
                          <span className='text-red-600'>
                            2.
                          </span>
                          BARBER
                        </div>
                    </label>
                    <div
                        className='grid grid-cols-3 gap-1 space-y-0'
                    >
                        {barbersWorking.map((barber) => (
                            <div 
                                key={barber.uid} 
                                className={classNames(
                                    'flex flex-col items-center rounded-lg cursor-pointer hover:bg-gray-50 border border-gray-200 p-3 gap-y-2',
                                    appDetails.barberUID === barber.uid ? 'ring-2 ring-offset-1 ring-blue-500' : ''
                                )}
                                onClick={() => handleBarberChange(barber)}
                            >
                                <div className='flex items-center justify-center w-12 h-12 rounded-3xl bg-green-200 text-xl font-medium'>
                                    <p>
                                        {barber.firstname[0].toUpperCase()}
                                    </p>
                                </div>
                                {barber.firstname}
                            </div>
                        ))}
                    </div>
                </div>

                {/* APP DATE */}
                {appDetails.barberUID === "" ? "" : (
                <div
                    className="flex flex-col gap-y-2"
                    >
                    <label
                        htmlFor="User-name"
                        className="block text-xs font-semibold leading-6 text-gray-900 sm:mt-1.5"
                    >
                        <div className='flex flex-row gap-x-1'>
                          <span className='text-red-600'>
                            3.
                          </span>
                          APPOINTMENT DATE
                        </div>
                    </label>

                    <div className='flex flex-row w-full overflow-x-auto border-b border-gray-200 pb-2 gap-x-4'>
                        {twoWeekInterval.map((dayObject) => (
                            <DayItem key={dayObject.day} day={dayObject} />
                        ))}
                    </div>
                </div>
                )}

                {/* APP TIME */}
                {(appDetails.appDay === "" || appDetails.service === "" || appDetails.isExtra) ? "" : (
                <div
                    className="flex flex-col gap-y-2"
                >
                    <label
                    htmlFor="User-name"
                    className="block text-xs font-semibold leading-6 text-gray-900 sm:mt-1.5"
                    >
                      <div className='flex flex-row gap-x-1'>
                        <span className='text-red-600'>
                          4.
                        </span>
                        APPOINTMENT TIME
                      </div>
                    </label>
                    {appointmentTimes && appointmentTimes.length > 0 ? appointmentTimes.map(time => {
                    const appStartTime = format(time.start,"hh:mm a")
                    const appEndTime = format(time.end,"hh:mm a")

                    const isSelectedApp = isSameSecond(time.start, appDetails.appStartTime) && isSameSecond(time.end, appDetails.appEndTime);
                    return (
                        <div
                            key={time.start.toISOString() + Math.random()}
                            onClick={() => setAppDetails({...appDetails, "appStartTime": time.start, "appEndTime": time.end})}
                            className={
                                classNames(
                                isSelectedApp && 'text-gray-800 font-medium ring-2 ring-offset-1 ring-blue-500',
                                'text-gray-600 cursor-pointer select-none py-2 px-1 border border-gray-300 rounded-lg'
                                )
                            }
                        >
                        {`${appStartTime} - ${appEndTime}`}
                        </div>
                    )
                    }) : "The barber is fully booked for the day. Please select another day."}
                </div>
                )}

                {/* User first name */}
                <div className="grid grid-cols-1 gap-1 space-y-0">
                <label
                    className="block font-semibold leading-6 text-gray-900 sm:mt-1.5"
                >
                    <div className='flex flex-row gap-x-1'>
                        <span className='text-red-600'>
                          5.
                        </span>
                        NAME
                      </div>
                </label>
                <div className="col-span-1">
                    <input
                    type="text"
                    value={appDetails.firstname}
                    onChange={handleAppDetails}
                    name="firstname"
                    id="User-name"
                    className=" block w-full rounded-md border-0 p-1 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-sky-600 sm: sm:leading-6"
                    />
                </div>
                </div>

                {/* phone number */}
                <div className="grid grid-cols-1 gap-1 space-y-0">
                  <label
                      className="block font-semibold leading-6 text-gray-900 sm:mt-1.5"
                  >
                      <div className='flex flex-row gap-x-1'>
                        <span className='text-red-600'>
                          6.
                        </span>
                        PHONE NUMBER
                        <span className='font-medium'>
                          (Do not include 0 or +61. E.g., 4xx xxx xxx)
                        </span>
                      </div>
                  </label>
                  { user ? (
                    <div className='flex flex-row justify-between py-2'>
                      <div>
                        {user.phoneNumber}
                      </div>
                      <div
                        className='text-blue-800 hover:text-blue-700 font-medium cursor-pointer'
                        onClick={() => {handleNumberChange()}}
                      >
                        Change number
                      </div>
                    </div>
                  ) : (
                    null
                  )}
                  { user ? null : (
                    <div className='flex flex-col gap-y-2'>
                      <div className="col-span-1 flex items-center gap-x-1">
                          +61
                          <input
                            type="tel"
                            value={appDetails.telNo}
                            onChange={handleAppDetails}
                            name="telNo"
                            id="telNo"
                            className="block w-full rounded-md border-0 p-1 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-sky-600 sm: sm:leading-6"
                          />
                          {otpSent ? null : (
                            <div
                              onClick={handleSendOtp}
                              className="flex w-1/4 justify-center rounded-md bg-black p-2 text-md font-medium text-white hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 cursor-pointer"
                            >
                              Send OTP
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                  {!verified && !otpSent ? (
                    <div id="recaptcha-container" />
                  ) : null}
                  {otpSent && !verified ? (
                    <div
                      className='flex flex-row gap-x-1'
                    >
                      <input
                        type='text'
                        value={otp}
                        onChange={handleOTPChange}
                        placeholder="Enter OTP"
                        className='block w-full rounded-lg border border-gray-200 px-1 py-2'
                      />
                      <div
                        onClick={handleOTPSubmit}
                        className="flex w-1/4 justify-center rounded-md bg-black p-2 text-md font-medium text-white hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 cursor-pointer"
                      >
                        Submit OTP
                      </div>
                    </div>
                  ) : null}
                  {verified && (
                    <div
                      className='text-green-600 font-semibold'
                    >
                      Phone number verified
                    </div>
                  )}
                  <div
                      className='text-gray-600 font-medium'
                  >
                      This is only for verification purposes. The barber will contact you on this number if they are sick. You will not be sent any marketing SMS, and this number will not be shared.
                  </div>
                  {
                      appDetails.telNo.length === 9 || appDetails.telNo.length === 0 ? "" : (
                      <div
                          className='text-red-600 font-medium'
                      >
                          Number must be 9 digits
                      </div>
                      )
                  }
                  {
                      (/^\d+$/.test(appDetails.telNo) || appDetails.telNo.length === 0) ? "" : (
                      <div
                          className='text-red-600 font-medium'
                      >
                          Number must contian only numbers
                      </div>
                      )
                  }
                </div>
            </div>

            {/* Action buttons */}
            <div className="sticky bottom-0 border-t border-gray-200 bg-white w-full flex justify-end space-x-3 px-4 py-2 sm:px-4">
                <button
                    onClick={(e) => handleSubmit(e)}
                    disabled={!allowSubmit}
                    className="disabled:bg-gray-300 disabled:cursor-not-allowed flex w-full justify-center rounded-md bg-black p-3 text-md font-medium text-white hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                >
                    BOOK
                </button>
            </div>
        </form>

      )}
    </div>
    )
};

export default BookingPage;