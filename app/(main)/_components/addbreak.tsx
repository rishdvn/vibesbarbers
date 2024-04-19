import { Fragment, forwardRef, useEffect, useState } from 'react'
import { Listbox, Dialog, Transition, Menu } from '@headlessui/react'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore'
import { db } from '@/src/index.ts'
import { add, addDays, addHours, addMinutes, areIntervalsOverlapping, differenceInMinutes, eachDayOfInterval, endOfDay, endOfMonth, endOfWeek, format, formatDistance, getDay, isBefore, isEqual, isSameDay, isSameMonth, isSameSecond, parse, parseISO, set, startOfDay, startOfWeek, toDate } from 'date-fns';


  function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
  }

  const serviceOptions = [
    { title: '20 Minute Break'},
    { title: '40 Minute Break'},
    { title: '60 Minute Break'}
  ]

export default function AddBreak({flyOverOpen, setFlyOverOpen, user}:{flyOverOpen: boolean, setFlyOverOpen: Function, user: {}}) {
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
  },[user,flyOverOpen])

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

  async function handleSubmit() {
    await publishToAppointments(appDetails); 
    setFlyOverOpen(false);
  }


  // initialize appDetials object
  const [appDetails, setAppDetails] = useState({
    service: "",
    barberUID: "",
    appDay: "",
    appStartTime: "",
    appEndTime: ""
  });

  const [allowSubmit, setAllowSubmit] = useState(false);

  useEffect(() => {
    // if any field not filled, disable submit button
    if (appDetails.appDay === "" || appDetails.appStartTime === "" || appDetails.appEndTime === "") {
      setAllowSubmit(false)
    } else {
      setAllowSubmit(true)
    }
  },[appDetails])

    {/* 2. CALENDARS */}

    const today = startOfDay(new Date());
    const [selectedDay, setSelectedDay] = useState(today);
    const [currentMonth, setCurrentMonth] = useState(format(today,'MMM-yyyy'));
    
    let firstDayCurrentMonth = parse(currentMonth, 'MMM-yyyy', new Date())

    function changeSelectedDay(day: string) {
      if (format(selectedDay, 'MM') === format(day, 'MM')) {
        setAppDetails(prev => ({...prev, "appDay": day}))
        setSelectedDay(day)
      } else {
        setAppDetails(prev => ({...prev, "appDay": day}))
        setSelectedDay(day)
        setCurrentMonth(format(day, 'MMM-yyyy'))      
      }
    }

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
        let dayRoster;
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
            if (appDetails.service === "20 Minute Break") {
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
            } else if (appDetails.service === "40 Minute Break") {
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
                  // const existingStartTime = app.appDetails.appStartTime.toDate();
                  // const existingEndTime = app.appDetails.appEndTime.toDate();
                  // if (areIntervalsOverlapping({start: appStartTime, end: appEndTime},{start: existingStartTime, end: existingEndTime})) {
                  //   overlapExists = true;
                  // }
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
            } else if (appDetails.service === "60 Minute Break") {
                if (index < potentialStartTimes.length - 1) {
                  const appStartTime = time;
                  const appEndTime = addMinutes(time, 60);
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
    },[appDetails, rosters, relevantRosters, selectedDay, barberExistingApps])

    // calendar days
    const [appDays, setAppDays] = useState(eachDayOfInterval({
      start: startOfWeek(firstDayCurrentMonth),
      end: endOfWeek(endOfMonth(firstDayCurrentMonth))
    }))

    useEffect(() => {
      setAppDays(eachDayOfInterval({
        start: startOfWeek(firstDayCurrentMonth),
        end: endOfWeek(endOfMonth(firstDayCurrentMonth))
      }))
    },[currentMonth])
    
  const Calendar = forwardRef((props, ref) => (
    <div ref={ref}>
      <div className="p-2">
        <div className="flex items-center text-center text-gray-900">
          <button
            onClick={() => setCurrentMonth(format(add(firstDayCurrentMonth, {months: -1}), 'MMM-yyyy'))}
            type="button"
            className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Previous month</span>
            <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="flex-auto text-xs font-semibold">{currentMonth}</div>
          <button
            onClick={() => setCurrentMonth(format(add(firstDayCurrentMonth, {months: 1}), 'MMM-yyyy'))}
            type="button"
            className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Next month</span>
            <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-6 grid grid-cols-7 text-center text-xs leading-6 text-gray-500">
          <div>S</div>
          <div>M</div>
          <div>T</div>
          <div>W</div>
          <div>T</div>
          <div>F</div>
          <div>S</div>
        </div>
        <div className="isolate mt-2 grid grid-cols-7 gap-px rounded-lg bg-gray-200 text-xs ring-1 ring-gray-200">
          {appDays.map((day, dayIdx) => {
            let dayIsWorking;
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
              <button
                onClick={() => changeSelectedDay(day)}
                disabled={isBefore(day,today) || !dayIsWorking}
                key={day.toDateString()}
                type="button"
                className={classNames(
                  'py-1.5 focus:z-10',
                  // same month, is after and is working ==> allow selective 
                  isSameMonth(day, firstDayCurrentMonth) && !isBefore(day,today) && dayIsWorking ? 'bg-white cursor-pointer hover:bg-gray-100' : 'bg-gray-50',
                  (isSameMonth(day, firstDayCurrentMonth) && isBefore(day,today) || !dayIsWorking) && 'bg-gray-50 cursor-not-allowed',
                  (isEqual(day, selectedDay) || isEqual(day, today)) && 'font-semibold',
                  isEqual(day, selectedDay) && 'text-white',
                  !isEqual(day, selectedDay) && isSameMonth(day, firstDayCurrentMonth) && !isEqual(day, today) && 'text-gray-900',
                  !isEqual(day, selectedDay) && !isSameMonth(day, firstDayCurrentMonth) && !isEqual(day, today) && 'text-gray-400',
                  isEqual(day, today) && !isEqual(day, selectedDay) && 'text-red-500',
                  dayIdx === 0 && 'rounded-tl-lg',
                  dayIdx === 6 && 'rounded-tr-lg',
                  dayIdx === appDays.length - 7 && 'rounded-bl-lg',
                  dayIdx === appDays.length - 1 && 'rounded-br-lg'
                )}
              >
                <time
                  dateTime={day.date}
                  className={classNames(
                    'mx-auto flex h-7 w-7 items-center justify-center rounded-full',
                    isEqual(day, selectedDay) && isEqual(day, today) && 'bg-red-500',
                    isEqual(day, selectedDay) && !isEqual(day, today) && 'bg-gray-900'
                  )}
                >
                  {format(day,'d')}
                </time>
              </button>
            )
          }
          )}
        </div>
      </div>
    </div>
  ))

  Calendar.displayName = 'Calendar';

  // Create a app details object that dynamically stores
  const handleServiceChange = (service) => {
    setAppDetails(prev => ({...prev, service: service.title}));
  }

  const handleBarberChange = (barber) => {
    setAppDetails(prev => ({...prev, barberUID: barber.uid, appDay: "", appStartTime: "", appEndTime: "", service: ""}));
  }

  // reset all states on flyover close
  useEffect(() => {
    setAppDetails({
      service: "",
      barberUID: "",
      firstname: "",
      telNo: "",
      appDay: "",
      appStartTime: "",
      appEndTime: ""
    })
    setSelectedDay(startOfDay(new Date()));
    setCurrentMonth(format(startOfDay(new Date()),'MMM-yyyy'));
    setAppointmentTimes(null);
  },[flyOverOpen])

  {/* MAIN RETURN */}
  return (
    <Transition.Root show={flyOverOpen} as={Fragment}>
      <Dialog as="div" className="z-50" onClose={setFlyOverOpen}>
        <div
          className='fixed inset-0 overflow-hidden bg-black bg-opacity-75 z-50'
        >
              <div className="pointer-events-none fixed inset-y-0.5 right-0 flex pl-16">
                <Transition.Child
                  as={Fragment}
                  enter="transform transition ease-in-out duration-500 sm:duration-700"
                  enterFrom="translate-x-full"
                  enterTo="translate-x-0"
                  leave="transform transition ease-in-out duration-500 sm:duration-700"
                  leaveFrom="translate-x-0"
                  leaveTo="translate-x-full"
                >
                  <Dialog.Panel className="pointer-events-auto w-screen rounded-l-md border-l border-y border-gray-200 max-w-md bg-gray-100">
                    <form className="flex h-full rounded-l-md flex-col overflow-y-scroll bg-white">
                      {/* START DAY AND END DAY */}
                      <div className="flex-1">
                        {/* Header */}
                        <div className="bg-black px-4 py-9 sm:px-4">
                          <div className="flex items-center justify-between space-x-3">
                              <Dialog.Title className="text-base font-medium leading-6 text-white">
                                Add break
                              </Dialog.Title>
                            <div className="flex h-7 items-center">
                              <button
                                type="button"
                                className="relative text-gray-400 hover:text-gray-500"
                                onClick={() => setFlyOverOpen(false)}
                              >
                                <span className="absolute -inset-2.5" />
                                <span className="sr-only">Close panel</span>
                                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Divider container */}
                        <div className="text-xs flex flex-col gap-y-10 px-4 py-5">

                            {/* BARBER */}
                          <div className="grid grid-cols-1 gap-2 space-y-0">
                            <label
                              htmlFor="User-name"
                              className="block  font-semibold leading-6 text-gray-900 sm:mt-1.5"
                            >
                              BARBER
                            </label>
                              <Listbox value={appDetails.barberUID} onChange={handleBarberChange}>
                                {({ open }) => (
                                  <>
                                  <Listbox.Label className="sr-only">Change published status</Listbox.Label>
                                  <div className="relative">
                                      <div className="inline-flex divide-x rounded-md divide-gray-800"
                                      >
                                          {/* List status */}
                                          <div className="select-none  font-medium inline-flex items-center gap-x-1.5 rounded-l-md px-3 py-2 bg-gray-50 text-gray-800">
                                            {(users.filter(user => user.uid === appDetails.barberUID).length > 0) ? users.filter(user => user.uid === appDetails.barberUID)[0].firstname : "Select barber"}
                                          </div>
                                          
                                          {/* List button */}
                                          <Listbox.Button className="inline-flex items-center rounded-l-none rounded-r-md p-2  focus:outline-none bg-gray-50 hover:bg-gray-200 ">
                                              <ChevronDownIcon className="h-5 w-5 text-gray-800" aria-hidden="true" />
                                          </Listbox.Button>
                                      </div>

                                      <Transition
                                        show={open}
                                        as={Fragment}
                                        leave="transition ease-in duration-100"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                      >
                                        <Listbox.Options className="absolute left-0 z-10 mt-2 w-72 origin-top-right divide-y divide-gray-200 overflow-hidden rounded-md bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                                            {users.map((option) => (
                                                <Listbox.Option
                                                    key={option.firstname}
                                                    className={({ active }) =>
                                                    classNames(
                                                        active ? 'bg-gray-50' : '',
                                                        'text-gray-800 text-medium cursor-default select-none p-2'
                                                    )
                                                    }
                                                    value={option}
                                                >
                                                    {({ service, active }) => (
                                                        <div className="flex flex-col">
                                                            <div className="flex justify-between">
                                                            <p className={service ? 'font-medium': 'font-normal'}>{option.firstname}</p>
                                                            {service ? (
                                                                <span className={active ? 'text-black' : 'text-gray-600'}>
                                                                </span>
                                                            ) : null}
                                                            </div>
                                                        </div>
                                                    )}
                                                </Listbox.Option>
                                            ))}
                                        </Listbox.Options>
                                      </Transition>
                                  </div>
                                  </>
                                )}
                              </Listbox>
                          </div>

                          {/* BREAK DATE */}
                          {
                            appDetails.barberUID === "" ? "" : (
                            <div
                                className="flex flex-col gap-y-2"
                              >
                              <label
                                htmlFor="User-name"
                                className="block text-xs font-semibold leading-6 text-gray-900 sm:mt-1.5"
                              >
                              DATE
                              </label>

                              <div
                                className="grid grid-cols-1 gap-y-1 space-y-0"
                              >   
                                  <Menu as="div" className="flex flex-col relative text-left">
                                    <div>
                                      <Menu.Button className="w-full">
                                        <div
                                          className={
                                            classNames(
                                              "rounded-lg border border-gray-300 flex items-start py-2 px-1 text-xs text-gray-600 font-medium cursor-pointer",
                                              !(appDetails.appDay === "") && "text-gray-800"
                                            )
                                          }
                                        >
                                          {appDetails.appDay === "" ? "dd-MMM-YYYY" : format(appDetails.appDay, 'dd-MMM-yyyy')}
                                        </div>
                                      </Menu.Button>
                                    </div>

                                    <Transition
                                      as={Fragment}
                                      enter="transition ease-out duration-100"
                                      enterFrom="transform opacity-0 scale-95"
                                      enterTo="transform opacity-100 scale-100"
                                      leave="transition ease-in duration-75"
                                      leaveFrom="transform opacity-100 scale-100"
                                      leaveTo="transform opacity-0 scale-95"
                                    >
                                      <Menu.Items className="bg-white w-3/4 top-full mt-2 text-medium absolute left-0 z-50 origin-top-right divide-y divide-gray-200 border-gray-200 rounded-md border focus:outline-none">
                                        <div className="">
                                            <Menu.Item>
                                              <Calendar />
                                            </Menu.Item>
                                        </div>
                                      </Menu.Items>
                                    </Transition>
                                  </Menu>
                              </div>
                            </div>
                            )
                          }

                          {/* Break Duration */}
                          {appDetails.appDay === "" ? "" : (
                            <div className="grid grid-cols-1 gap-2 space-y-0">
                                <label
                                htmlFor="User-name"
                                className="block  font-semibold leading-6 text-gray-900 sm:mt-1.5"
                                >
                                BREAK DURATION
                                </label>
                                <Listbox value={appDetails.service} onChange={handleServiceChange}>
                                    {({ open }) => (
                                    <>
                                    <Listbox.Label className="sr-only">Change published status</Listbox.Label>
                                    <div className="relative">
                                        <div className="inline-flex divide-x rounded-md divide-gray-800"
                                        >
                                            {/* List status */}
                                            <div className="select-none  font-medium inline-flex items-center gap-x-1.5 rounded-l-md px-3 py-2 bg-gray-50 text-gray-800">
                                                {appDetails.service ? appDetails.service : "Select break duration"}
                                            </div>
                                            
                                            {/* List button */}
                                            <Listbox.Button className="inline-flex items-center rounded-l-none rounded-r-md p-2  focus:outline-none bg-gray-50 hover:bg-gray-200 ">
                                                <ChevronDownIcon className="h-5 w-5 text-gray-800" aria-hidden="true" />
                                            </Listbox.Button>
                                        </div>

                                        <Transition
                                            show={open}
                                            as={Fragment}
                                            leave="transition ease-in duration-100"
                                            leaveFrom="opacity-100"
                                            leaveTo="opacity-0"
                                        >
                                            <Listbox.Options className="absolute left-0 z-10 mt-2 w-72 origin-top-right divide-y divide-gray-200 overflow-hidden rounded-md bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                                                {serviceOptions.map((option) => (
                                                    <Listbox.Option
                                                        key={option.title}
                                                        className={({ active }) =>
                                                        classNames(
                                                            active ? 'bg-gray-50' : '',
                                                            'text-gray-800 text-medium cursor-default select-none p-2 '
                                                        )
                                                        }
                                                        value={option}
                                                    >
                                                        {({ service, active }) => (
                                                            <div className="flex flex-col">
                                                                <div className="flex justify-between">
                                                                <p className={service ? 'font-medium': 'font-normal'}>{option.title}</p>
                                                                {service ? (
                                                                    <span className={active ? 'text-black' : 'text-gray-600'}>
                                                                    </span>
                                                                ) : null}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Listbox.Option>
                                                ))}
                                            </Listbox.Options>
                                        </Transition>
                                    </div>
                                    </>
                                    )}
                                </Listbox>
                            </div>
                          )}

                          {(appDetails.service === "") ? "" : (
                            <div
                              className="flex flex-col gap-y-2"
                            >
                              <label
                                htmlFor="User-name"
                                className="block text-xs font-semibold leading-6 text-gray-900 sm:mt-1.5"
                              >
                                BREAK TIME
                              </label>
                              {appointmentTimes ? appointmentTimes.map(time => {
                                const appStartTime = format(time.start,"hh:mm a")
                                const appEndTime = format(time.end,"hh:mm a")

                                const isSelectedApp = isSameSecond(time.start, appDetails.appStartTime) && isSameSecond(time.end, appDetails.appEndTime);
                                return (
                                  <div
                                    key={time.start.toISOString() + Math.random()}
                                    onClick={() => setAppDetails(prev => ({...prev, "appStartTime": time.start, "appEndTime": time.end}))}
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
                              }) : ""}
                          </div>
                          )}
                          
                        </div>

                      </div>

                      {/* Action buttons */}
                      <div className="flex-shrink-0 px-4 py-5 sm:px-4">
                        <div className="flex justify-end space-x-3">
                          <button
                            type="button"
                            className="rounded-md bg-white px-3 py-2 text-xs font-medium text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                            onClick={() => setFlyOverOpen(false)}
                          >
                            Cancel
                          </button>
                          <button
                          type="button"
                              onClick={handleSubmit}
                              disabled={!allowSubmit}
                            className="disabled:bg-gray-300 disabled:cursor-not-allowed inline-flex justify-center rounded-md bg-black px-3 py-2 text-xs font-medium text-white hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    </form>
                  </Dialog.Panel>
                </Transition.Child>
              </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}