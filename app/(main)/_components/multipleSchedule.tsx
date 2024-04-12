"use client";

import { Fragment, useEffect, useRef, useState } from 'react'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, EllipsisHorizontalIcon } from '@heroicons/react/20/solid'
import { Menu } from '@headlessui/react'
import { add, addDays, addHours, addMinutes, areIntervalsOverlapping, differenceInMinutes, eachDayOfInterval, endOfDay, endOfMonth, endOfWeek, format, formatDistance, getDay, isEqual, isSameDay, isSameMonth, parse, parseISO, set, startOfDay, startOfWeek } from 'date-fns';
import { collection, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/src';
import { useUserAuth } from '@/src/context/AuthContext';
import AddAppointment from './addappointment';
import AddBreak from './addbreak';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function MultipleSchedule() {
  const { user } = useUserAuth();

  // set view
  const [view, setView] = useState('Team');

  // fetch all approved Barbers
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

  // fetch all appointments
  const [appointments, setAppointments] = useState([]);
  
  useEffect(() => {
    onSnapshot(collection(db, "appointments"), (querySnapshot) => {
      const tempApps = []
      querySnapshot.forEach((doc) => {
        const objWithId = {...doc.data(), id: doc.id}
        tempApps.push(objWithId);
      });
      setAppointments(tempApps);
    })
  },[])

  const today = startOfDay(new Date())
  const [selectedDay, setSelectedDay] = useState(today);

  // find relevant (occur on selected day) appointments based on the start-time OR appDay (based on isExtra!)
  const [selectedDayApps, setSelectedDayApps] = useState(null);

  useEffect(() => {
    const tempApps = []
    for (let app of appointments) {
      // if isExtra is set to true, filter based on appDay
      if (app.appDetails.isExtra) {
        if (isSameDay(app.appDetails.appDay.toDate(),selectedDay)) {
          tempApps.push(app)
        }
      } else {
        // else filter based on appStartTime
        if (isSameDay(app.appDetails.appStartTime.toDate(), selectedDay)) {
          tempApps.push(app)
        }
      }
    }
    setSelectedDayApps(tempApps)
  },[selectedDay, appointments])

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

  // find barbers working on selected day
  const [workingBarbers, setWorkingBarbers] = useState([]);

  useEffect(() => {
    const tempWorkingBarbers = []

    for (let barber of users) {
      // find barber rosters
      const barberRosters = []
      if (rosters) { 
        for (let key in rosters) {
          const roster = rosters[key];
          if (roster.uid === barber.uid) {
            barberRosters.push(roster)
          }
        }
      }

      // determine if working on selected day
      let dayIsWorking;
      for (let roster of barberRosters) {
        const rosterInfo = roster.selectedTimes
        const rosterStartTime = rosterInfo.start;
        const rosterEndTime = rosterInfo.end;
        // determine if overlaps exists, and if so, check if working that day
        // if rostered end time is a date
        if (!(rosterEndTime === "Never")) {
          // if selected time overlaps with rostered time
          if (areIntervalsOverlapping({start: selectedDay, end: endOfDay(selectedDay)},{start: rosterStartTime.toDate(), end: rosterEndTime.toDate()})) {
            // check if working
            const dayWeekDay = format(selectedDay, 'iiii').toLowerCase()
            if (rosterInfo[dayWeekDay].isWorking) {
              dayIsWorking = true;
            } else {
              dayIsWorking = false;
            }
          }
          // if rostered end time is indefinite
        } else {
          // check for overlap with rostered schedule
          if ((selectedDay < rosterStartTime.toDate() || isSameDay(selectedDay, rosterStartTime.toDate())) && endOfDay(selectedDay) > rosterStartTime.toDate() || 
          (selectedDay > rosterStartTime.toDate()) ) {
            // check if working
            const dayWeekDay = format(selectedDay, 'iiii').toLowerCase()
            if (rosterInfo[dayWeekDay].isWorking) {
              dayIsWorking = true;                    
            } else {
              dayIsWorking = false;
            }
          }
        }
      }

      // even if not rosterd to work, add if they have an extra appointment!!
      for (let app of selectedDayApps) {
        if (app.appDetails.barberUID === barber.uid && app.appDetails.isExtra) {
          dayIsWorking = true;
        }
      }

      if (dayIsWorking) {
        tempWorkingBarbers.push(barber)
      }
      
      let tempIndividualBarber = []
      // if individual view, filter for user logged in
      for (let barber of tempWorkingBarbers) {
        if (barber.uid === user.uid) {
          tempIndividualBarber.push(barber)
        }
      }

      // if individual view, set workingBarbers to tempIndividualBarber
      // if team view, set workingBarbers to tempWorkingBarbers

      if (view === "Individual") {
        setWorkingBarbers(tempIndividualBarber)
      } else {
        setWorkingBarbers(tempWorkingBarbers)
      }
    }

  },[rosters, selectedDay, users, appointments, selectedDayApps, view, user])

  const times: { [key: string]: string[] } = {
    "monday" : ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM'],
    "tuesday" : ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM'],
    "wednesday" : ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM'],
    "thursday" : ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM'],
    "friday" : ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM', '6PM', '7PM', '8PM'],
    "saturday" : ['9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM'],
    "sunday" : ['10AM', '11AM', '12PM', '1PM', '2PM', '3PM', '4PM', '5PM']
  }

  let dayTiming = times[`${format(selectedDay,'EEEE').toLowerCase()}`]
  let daySlots = (dayTiming.length - 1) * 3

  const CalendarItem = ({appointmentObject, color}) => {
    const appointment= appointmentObject;
    const tileColor = color ? color : "pink"
    const dayStart = addHours(startOfDay(selectedDay),9)
    const appStart = appointment.appDetails.appStartTime.toDate()
    const appEnd = appointment.appDetails.appEndTime.toDate()
    const appService = appointment.appDetails.service
    const customerName = appointment.appDetails.firstname
    const customerTel = appointment.appDetails.telNo
    const gridrow = (differenceInMinutes(appStart, dayStart) / 20) + 1
    const span = (differenceInMinutes(appEnd, appStart) / 20)
    const isBreak = appointment.appDetails.service === "20 Minute Break" || appointment.appDetails.service === "40 Minute Break" || appointment.appDetails.service === "60 Minute Break"
    const priceExists = appointment.service ? true : false

    const appId = appointment.id;

    const [cancelToggle,setCancelToggle] = useState(false);

    async function handleCancel() {
      await deleteDoc(doc(db, "appointments", appId))
    }

    const [priceToggle,setPriceToggle] = useState(false);
    const [priceObject, setPriceObject] = useState({
      service: "", 
      product: ""
    });
    const [allowPriceSubmit, setAllowPriceSubmit] = useState(false);

    useEffect(() => {
      if (priceObject.service !== "") {
        setAllowPriceSubmit(true)
      } else {
        setAllowPriceSubmit(false)
      }
    },[priceObject])

    async function handlePricePublish() {
      await updateDoc(doc(db, "appointments", appId), {
        service: priceObject.service,
        product: priceObject.product
      })
      setPriceToggle(!priceToggle)
      console.log("Updated document ID:", appId);
    }

    return (
      <Menu 
        as="div" 
        className="z-0 relative flex"
        style={{ gridRow: ` ${gridrow} / span ${span}`}}
      >
          {!cancelToggle && !priceToggle && (
            <Menu.Button as="div" className="flex items-start">
              <li
                key={appStart}
                className={classNames(
                  "z-40 cursor-pointer group absolute inset-1 flex flex-col rounded-lg p-1 text-xs leading-5",
                  isBreak ? "bg-black" : (priceExists ? `bg-pink-200` : `bg-pink-100`)
                )}
              >
                <div
                  className='flex flex-row justify-between'
                >
                  {/* Time */}
                  <p 
                    className={classNames(
                      isBreak ? "text-white" : "text-black"
                    )}
                  >
                      <time dateTime={appStart}>{`${format(appStart, 'hh:mma')}-${format(appEnd, 'hh:mma')}`}</time>
                  </p>
                  <div>
                    <p 
                      className={classNames(
                        isBreak ? "text-white" : "text-black"
                      )}
                    >
                        {appointment.service && (
                          <div>
                            <span className='font-semibold'>
                              S: 
                            </span>
                            <span>
                              $
                            </span>
                            <span>
                              {appointment.service}
                            </span>
                          </div>
                        )}
                    </p>
                  </div>
                </div>
                {/* Name */}
                <div
                  className='flex flex-row justify-between'
                >
                  <p className="font-semibold text-black">{customerName}</p>
                  <p 
                    className={classNames(
                      isBreak ? "text-white" : "text-black"
                    )}
                  >
                      {appointment.product && (
                        <div>
                          <span className='font-semibold'>
                            P: 
                          </span>
                          <span>
                            $
                          </span>
                          <span>
                            {appointment.product}
                          </span>
                        </div>
                      )}
                  </p>
                </div>
                {/* Number */}
                {customerTel === "" ? "" : (<p className="text-black">{`+61${customerTel}`}</p>)}
                {/* Service */}
                <p 
                  className={classNames(
                    isBreak ? "text-white font-semibold" : "text-black"
                  )}
                >
                    {appService}
                </p>
              </li>
            </Menu.Button>
          )}
          {cancelToggle && (
            <div
              className='items-start bg-red-100 select-none group absolute inset-1 flex flex-col gap-y-1 rounded-lg p-2 text-xs leading-5'
            >
              {isBreak ? (
                <div>
                  Are you sure?
                </div>
              ) : (
                <div>
                  Tell client you cancelled.
                </div>
              )}
              <div
                className='flex flex-row gap-x-2'
              >
                <div
                  className="cursor-pointer font-medium rounded-md bg-white p-1"
                  onClick={() => setCancelToggle(!cancelToggle)}                  
                >
                  Exit
                </div>
                <div
                  className="cursor-pointer font-medium rounded-md bg-red-300 p-1"
                  onClick={handleCancel}
                >
                  Cancel {isBreak ? "Break" : "Appointment"}
                </div>
              </div>
            </div>
          )}
          {priceToggle && (
            <div
              className='items-start bg-gray-100 select-none group absolute inset-1 flex flex-col gap-y-2 rounded-lg p-2 text-xs leading-5 overflow-auto'
            >
              <div
                className='flex w-full items-center flex-row gap-x-2 font-medium'
              >
                <div>
                  Service
                </div>
                <input
                  type="number"
                  onChange={(e) => setPriceObject({...priceObject, service: e.target.value})}
                  min="0"
                  className='p-1 w-full rounded-lg border border-gray-200 font-normal'
                />
              </div>
              <div
                className='flex w-full items-center flex-row gap-x-2 font-medium'
              >
                <div>
                  Product
                </div>
                <input
                  type="number"
                  onChange={(e) => setPriceObject({...priceObject, product: e.target.value})}
                  min="0"
                  className='p-1 w-full rounded-lg border border-gray-200 font-normal'
                />
              </div>
              <div
                className='flex w-full flex-row gap-x-2 justify-end'
              >
                <div
                  className="cursor-pointer font-medium rounded-md bg-white p-1"
                  onClick={() => setPriceToggle(!priceToggle)}                  
                >
                  Exit
                </div>
                <button
                  disabled={!allowPriceSubmit}
                  className={classNames(
                      "font-medium rounded-md p-1",
                      allowPriceSubmit ? "cursor-pointer bg-green-200 hover:bg-green-300" : "text-gray-400 cursor-not-allowed bg-gray-200"
                    )
                  }
                  onClick={handlePricePublish}
                >
                  Save price
                </button>
              </div>
            </div>
          )}
        <Menu.Items as="div" className="z-50 flex flex-col divide-y divide-gray-100 absolute mt-2 right-2 text-xs bg-white rounded-lg border border-gray-100">
            <Menu.Item 
              as="div" className="p-2 rounded-lg hover:bg-gray-200 cursor-pointer" 
              onClick={() => {setCancelToggle(!cancelToggle)}}
            >
              Cancel {isBreak ? "Break" : "Appointment"}
            </Menu.Item>
            {
              isBreak ? "" : (
                <Menu.Item 
                  as="div" className="p-2 rounded-lg hover:bg-gray-200 cursor-pointer" 
                  onClick={() => {setPriceToggle(!priceToggle)}}
                >
                  Add price
                </Menu.Item>
              )
            }
        </Menu.Items>
      </Menu>
    )
  }

  const ExtraItem = ({appointment, color}) => {
    const tileColor = color ? color : "pink"
    const dayStart = addHours(startOfDay(selectedDay),9)
    const appService = appointment.appDetails.service
    const customerName = appointment.appDetails.firstname
    const customerTel = appointment.appDetails.telNo
    const isBreak = appointment.appDetails.service === "20 Minute Break" || appointment.appDetails.service === "40 Minute Break" || appointment.appDetails.service === "60 Minute Break"
    const priceExists = appointment.service ? true : false

    const appId = appointment.id;

    const [cancelToggle,setCancelToggle] = useState(false);

    async function handleCancel() {
      await deleteDoc(doc(db, "appointments", appId))
    }

    const [priceToggle,setPriceToggle] = useState(false);
    const [priceObject, setPriceObject] = useState({
      service: "", 
      product: ""
    });
    const [allowPriceSubmit, setAllowPriceSubmit] = useState(false);

    useEffect(() => {
      if (priceObject.service !== "") {
        setAllowPriceSubmit(true)
      } else {
        setAllowPriceSubmit(false)
      }
    },[priceObject])

    async function handlePricePublish() {
      await updateDoc(doc(db, "appointments", appId), {
        service: priceObject.service,
        product: priceObject.product
      })
      setPriceToggle(!priceToggle)
      console.log("Updated document ID:", appId);
    }

    return (
      <Menu 
        as="div" 
        className="z-0 relative flex flex-col gap-y-2"
      >
          {!cancelToggle && !priceToggle && (
            <Menu.Button as="div" className="flex items-start">
              <li
                key={appService + Math.random()}
                className={classNames(
                  "h-24 cursor-pointer group flex flex-1 flex-col rounded-lg p-1 text-xs leading-5",
                  priceExists ? `bg-pink-200` : `bg-pink-100`
                )}
              >
                <div
                  className='flex flex-row justify-between'
                >
                  <div
                    className='flex flex-row gap-x-1'
                  >
                    <p 
                      className={classNames(
                        isBreak ? "text-white" : "text-black"
                      )}
                    >
                        {appointment.service && (
                          <div>
                            <span className='font-semibold'>
                              S: 
                            </span>
                            <span>
                              $
                            </span>
                            <span>
                              {appointment.service}
                            </span>
                          </div>
                        )}
                    </p>
                    <p 
                      className={classNames(
                        isBreak ? "text-white" : "text-black"
                      )}
                    >
                        {appointment.product && (
                          <div>
                            <span className='font-semibold'>
                              P: 
                            </span>
                            <span>
                              $
                            </span>
                            <span>
                              {appointment.product}
                            </span>
                          </div>
                        )}
                    </p>
                  </div>
                </div>
                {/* Name */}
                <p className="font-semibold text-black">{customerName}</p>
                {/* Number */}
                {customerTel === "" ? "" : (<p className="text-black">{`+61${customerTel}`}</p>)}
                {/* Service */}
                <p 
                  className={classNames(
                    isBreak ? "text-white font-semibold" : "text-black"
                  )}
                >
                    {appService}
                </p>
              </li>
            </Menu.Button>
          )}
          {cancelToggle && (
            <div
              className='items-start bg-red-100 select-none group flex flex-1 flex-col gap-y-1 rounded-lg p-2 text-xs leading-5'
            >
              {isBreak ? (
                <div>
                  Are you sure?
                </div>
              ) : (
                <div>
                  Tell client you cancelled.
                </div>
              )}
              <div
                className='flex flex-row gap-x-2'
              >
                <div
                  className="cursor-pointer font-medium rounded-md bg-white p-1"
                  onClick={() => setCancelToggle(!cancelToggle)}                  
                >
                  Exit
                </div>
                <div
                  className="cursor-pointer font-medium rounded-md bg-red-300 p-1"
                  onClick={handleCancel}
                >
                  Cancel {isBreak ? "Break" : "Appointment"}
                </div>
              </div>
            </div>
          )}
          {priceToggle && (
            <div
              className='items-start bg-gray-100 select-none group flex-1 flex flex-col gap-y-2 rounded-lg p-2 text-xs leading-5 overflow-auto'
            >
              <div
                className='flex w-full items-center flex-row gap-x-2 font-medium'
              >
                <div>
                  Service
                </div>
                <input
                  type="number"
                  onChange={(e) => setPriceObject({...priceObject, service: e.target.value})}
                  min="0"
                  className='p-1 w-full rounded-lg border border-gray-200 font-normal'
                />
              </div>
              <div
                className='flex w-full items-center flex-row gap-x-2 font-medium'
              >
                <div>
                  Product
                </div>
                <input
                  type="number"
                  onChange={(e) => setPriceObject({...priceObject, product: e.target.value})}
                  min="0"
                  className='p-1 w-full rounded-lg border border-gray-200 font-normal'
                />
              </div>
              <div
                className='flex w-full flex-row gap-x-2 justify-end'
              >
                <div
                  className="cursor-pointer font-medium rounded-md bg-white p-1"
                  onClick={() => setPriceToggle(!priceToggle)}                  
                >
                  Exit
                </div>
                <button
                  disabled={!allowPriceSubmit}
                  className={classNames(
                      "font-medium rounded-md p-1",
                      allowPriceSubmit ? "cursor-pointer bg-green-200 hover:bg-green-300" : "text-gray-400 cursor-not-allowed bg-gray-200"
                    )
                  }
                  onClick={handlePricePublish}
                >
                  Save price
                </button>
              </div>
            </div>
          )}
        <Menu.Items as="div" className="z-50 flex flex-col divide-y divide-gray-100 absolute right-1 mt-1 text-xs bg-white rounded-lg border border-gray-100">
            <Menu.Item 
              as="div" className="p-2 rounded-lg hover:bg-gray-200 cursor-pointer" 
              onClick={() => {setCancelToggle(!cancelToggle)}}
            >
              Cancel {isBreak ? "Break" : "Appointment"}
            </Menu.Item>
            {
              isBreak ? "" : (
                <Menu.Item 
                  as="div" className="p-2 rounded-lg hover:bg-gray-200 cursor-pointer" 
                  onClick={() => {setPriceToggle(!priceToggle)}}
                >
                  Add price
                </Menu.Item>
              )
            }
        </Menu.Items>
      </Menu>
    )
  }

  const TimeRow = ({time}:{time:string}) => {
    return (
      <>
          <div
            key={time + Math.random()}
          >
            <div className="flex justify-center mt-1 text-xs leading-5 text-gray-400">
              {time}
            </div>
          </div>
          <div
            key={time + Math.random()}
          />
          <div
            key={time + Math.random()}
          />
      </>
    )
  }

  const BarberItem = ({keyValue, barber}:{keyValue: any, barber: object}) => {
    return (
      <div
        key={keyValue + Math.random()}
        className='z-20 flex flex-1 flex-col items-center justify-center py-3 gap-y-3 text-xs font-semibold text-gray-900 bg-white bg-opacity-85 border-b-2 border-gray-200'
      >
        <div className="flex items-center justify-center h-14 w-14 rounded-full bg-sky-500 text-white font-medium text-2xl">
          {`${barber.firstname[0]}`}
        </div>
        <p className="text-xs font-medium text-gray-900">
          {barber.firstname}
        </p>
      </div>
    )
  }

  const [ flyOverOpen, setFlyOverOpen]  = useState(false);
  const [ flyOverOpenBreak, setFlyOverOpenBreak]  = useState(false);

  return (
    <div className="flex flex-col h-full">
      <AddAppointment flyOverOpen={flyOverOpen} setFlyOverOpen={setFlyOverOpen} user={user}/>
      <AddBreak flyOverOpen={flyOverOpenBreak} setFlyOverOpen={setFlyOverOpenBreak} user={user}/>
      {/* <CancelAppointment openCancel={openCancel} setOpenCancel={setOpenCancel}/> */}
      <header className="flex flex-col sticky top-0 z-30 bg-white ">
        <div className="flex flex-none items-center justify-between border-b border-gray-200 px-6 py-4">
            <div
              className="flex flex-col"
            >
              <h1 className="text-base font-semibold leading-6 text-gray-900">
                {format(selectedDay, 'dd MMM, yyyy')}
              </h1>
              <div
                className="text-xs"
              >
                {format(selectedDay, 'iii')}
              </div>
            </div>

            <div className="flex items-center gap-x-2">
              <div>
                <Menu as="div" className="z-50 relative">
                  <Menu.Button as="div" className="select-none cursor-pointer rounded-md px-2 py-2 text-xs font-semibold border border-gray-300 text-black hover:text-gray-500 focus:relative hover:bg-gray-50">
                    {`${view} view`}
                  </Menu.Button>
                    <Menu.Items as="div" className="flex flex-col divide-y divide-gray-100 absolute mt-2 right-0 text-xs bg-white rounded-lg border border-gray-100">
                        <Menu.Item as="div" className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => setView("Individual")}>
                          Individual
                        </Menu.Item>
                        <Menu.Item as="div" className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => setView("Team")}>
                          Team
                        </Menu.Item>
                    </Menu.Items>
                </Menu>
              </div>
              <div className="relative flex items-center rounded-md bg-white  md:items-stretch">
                  <button
                    onClick={() => setSelectedDay(addDays(selectedDay, -1))}
                    type="button"
                    className="flex h-9 w-12 items-center justify-center rounded-l-md border-y border-l border-gray-300 pr-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pr-0 md:hover:bg-gray-50"
                  >
                    <span className="sr-only">Previous day</span>
                    <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setSelectedDay(today)}
                    type="button"
                    className={classNames(
                      "hidden border-y border-gray-300 px-3.5 text-xs font-semibold text-gray-900 hover:bg-gray-50 focus:relative md:block",
                      isSameDay(selectedDay, today) ? 'bg-gray-100' : ''
                    )}
                  >
                    Today
                  </button>
                  <div
                    className="items-center hidden border-y border-gray-300 px-3.5 text-xs font-medium text-gray-900 focus:relative md:flex"
                  >
                    {format(selectedDay, 'dd MMM, yyyy')}
                  </div>
                  <span className="relative -mx-px h-9 w-px bg-gray-300 md:hidden" />
                  <button
                    onClick={() => setSelectedDay(addDays(selectedDay, 1))}
                    type="button"
                    className="flex h-9 w-12 items-center justify-center rounded-r-md border-y border-r border-gray-300 pl-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pl-0 md:hover:bg-gray-50"
                  >
                    <span className="sr-only">Next day</span>
                    <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
              </div>
              <div className="flex items-center">                  
                  <Menu as="div" className="z-50 relative">
                    <Menu.Button as="div" className="select-none cursor-pointer rounded-md bg-black px-3 py-2 text-xs font-semibold text-white  hover:bg-gray-800">
                      Add event
                    </Menu.Button>
                      <Menu.Items as="div" className="flex flex-col divide-y divide-gray-100 absolute mt-2 right-0 text-xs bg-white rounded-lg border border-gray-100">
                          <Menu.Item as="div" className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => setFlyOverOpen(true)}>
                            Add appointment
                          </Menu.Item>
                          <Menu.Item as="div" className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => setFlyOverOpenBreak(true)}>
                            Add break
                          </Menu.Item>
                      </Menu.Items>
                  </Menu>
              </div>
            </div>
        </div>
      </header>

      {/* Calendar */}
      {workingBarbers.length === 0 ? (
          <div
            className='flex flex-row items-center justify-center text-sm p-2'
          >
            {`${view === "Team" ? "No barbers are": "You are not"} working on this day. Roster work to add appointments.`}
          </div>
        ) :
          <div
            className='flex flex-row h-20 flex-grow w-full items-start overflow-y-auto overflow-x-auto'
          >
            {/* Showcase of times */}
            <div className="sticky left-0 flex flex-col z-20 w-11 bg-white border-r border-gray-100">
                <div
                  className='sticky top-0 select-none overflow-hidden'
                >
                  <BarberItem keyValue='time' barber={{firstname: 'Time'}}/>
                  <div 
                    style={{
                      content: '',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '90%',
                      backgroundColor: 'rgba(255, 255, 255, 1)' // change the color and opacity as needed
                    }}
                  />
                </div>
                <div className="h-5 border-b-2 border-gray-100" />
                <div 
                  className="grid flex-auto grid-cols-1 grid-rows-1"
                >
                  {/* Horizontal lines */}
                  <div
                    className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
                    style={{
                      gridTemplateRows: `repeat(${daySlots}, minmax(6rem, 1fr))`,
                    }}
                  >
                    {dayTiming.map((time) => (
                      <TimeRow key={time} time={time}/>
                    ))}
                  </div>
                </div>
            </div>
            {workingBarbers.map((barber) => {
                const barberColor = barber.color
                const barberApps = selectedDayApps.filter((appointment) => appointment.appDetails.barberUID === barber.uid)
                const barberAppsNoExtras = barberApps.filter((app) => ((app.appDetails.isExtra === false) || (app.appDetails.isExtra === undefined)))
                const barberExtras = barberApps.filter((app) => app.appDetails.isExtra === true)
                const hasExtraAppointments = barberExtras > 0 ? true : false

                return (
                  <div key={barber.firstname + Math.random()} className="flex w-full flex-col divide-x divide-gray-100">
                      <div
                        className='sticky top-0 z-10'
                      >
                        <BarberItem keyValue={barber.firstname} barber={barber}/>
                      </div>
                      <div className="h-5 border-b-2 border-gray-100 text-white select-none">hi</div>
                      <div 
                        className="grid flex-auto grid-cols-1 grid-rows-1"
                        style={{
                          minWidth: '200px'
                        }}
                      >
                        {/* Horizontal lines */}
                        <div
                          className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
                          style={{
                            gridTemplateRows: `repeat(${daySlots}, minmax(6rem, 1fr))`,
                            minWidth: '200px'
                          }}
                        >
                          {dayTiming.map(() => (
                            <>
                              <div className=''/>
                              <div/>
                              <div/>
                            </>
                          ))}
                        </div>

                        {/* Events */}
                        <ol
                          className="col-start-1 col-end-2 row-start-1 grid grid-cols-1"
                          style={{
                            gridTemplateRows: `repeat(${daySlots}, minmax(6rem, 1fr))`,
                            minWidth: '200px'
                          }}
                        >
                          {barberAppsNoExtras.map((appointment) =>
                            { 
                              return (<CalendarItem key={appointment.appDetails.appStartTime} appointmentObject={appointment} color={barberColor}/>)
                          }
                          )}
                        </ol>
                      </div>
                      {/* Extra appointments */}
                      <div
                        className='flex flex-col gap-y-2 p-2'
                      >
                        <h1
                          className='text-sm font-semibold text-gray-900'
                        >
                          Extra appointments:
                        </h1>
                        {hasExtraAppointments ? (
                          <p className='text-xs text-gray-700'>No extra appointments</p>
                        ) : (
                          <div
                            className='flex flex-col gap-y-2 text-xs'
                          >
                            {barberExtras.map((app) => (
                              <ExtraItem key={app.appDetails.appStartTime} appointment={app} color={barberColor}/>
                            ))}
                            {/* {barberExtras.map((app) => (
                              <div
                                key={app.id + Math.random()}
                                className='flex cursor-pointer flex-col gap-y-1 bg-gray-200 rounded-lg px-1 py-1.5 hover:bg-gray-300'
                              >
                                <span className='font-medium'>{app.appDetails.firstname}</span>
                                <span>{app.appDetails.service}</span>
                              </div>
                            ))} */}
                          </div>
                        )}
                      </div>
                  </div>
                )
              })}
          </div>
        }
      
    </div>
  )
}