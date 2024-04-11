"use client";

import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../src/index.ts";
import { useEffect, useState } from "react";
import { add, addDays, addHours, addMinutes, differenceInMinutes, eachDayOfInterval, endOfMonth, endOfWeek, format, formatDate, formatDistance, getDay, isEqual, isSameDay, isSameMonth, isSameWeek, isWithinInterval, parse, parseISO, startOfDay, startOfWeek } from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import RegFlyOver from "./regshiftflyover.tsx";
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'
import { useUserAuth } from "@/src/context/AuthContext";
import TeamFlyOver from "./teamflyover.tsx";


function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

  export default function MySchedule() {
    // manage user states!
    const [ flyOverOpen, setFlyOverOpen]  = useState(false);
    
    // save loggedin users details
    const {user, userProfile} = useUserAuth();

    // fetch all users
    const [users, setUsers] = useState([]);
    useEffect(() => {
      onSnapshot(collection(db, "users"), (querySnapshot) => {
        const usersFetched = [];
        querySnapshot.forEach((doc) => {
          usersFetched.push(doc.data());
        });
        setUsers(usersFetched);
      })
    },[])

    const [selectedUser, setSelectedUser] = useState(user);

    const TeamMember = () => {
      const selectedUserUID = selectedUser.uid;
      const userProfile = users.find(user => user.uid === selectedUserUID);

      return (
        <div className="flex flex-row gap-x-2 text-sm">
          <div
            className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-b from-cyan-500 to-blue-500"
          >
              <p
                className="text-white font-normal text-2xl"
              >
                {`${userProfile ? userProfile.firstname[0] : ""}`}
              </p>
          </div>
          <div
            className="flex flex-col gap-y-1"
          >
            <span className="font-medium hover:text-gray-900" aria-hidden="true">
                {`${userProfile ? userProfile.firstname : ""} ${userProfile ? userProfile.lastname: ""}`}
            </span>
            <Menu as="span"
              className="cursor-pointer font-medium text-xs text-purple-800 hover:text-purple-900" aria-hidden="true"
            >
              <Menu.Button>
                Change team member
              </Menu.Button>
              <Menu.Items as="div" className="absolute">
                <div
                  className="mt-2 bg-white rounded-md border border-gray-200 divide-y divide-gray-200 font-normal text-gray-800"
                >
                  {users.map((user) => (
                    <Menu.Item key={user.uid}>
                      {({ active }) => (
                        <div
                          className={classNames(
                            active ? 'bg-gray-100' : '',
                            'flex items-center px-2 py-2'
                          )}
                          onClick={() => setSelectedUser(user)}
                        >
                          {user.firstname} {user.lastname}
                        </div>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Menu>
          </div>
        </div>
      )
    }

    // collect rosters data
    const [rosters, setRosters] = useState(null);

    useEffect(() => {
      onSnapshot(collection(db, "roster"), (querySnapshot) => {
        const rostersFetched = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.uid === selectedUser.uid) {
            rostersFetched.push(data);
          }
        });
        rostersFetched.sort((a, b) => a.selectedTimes.start.toDate() - b.selectedTimes.start.toDate());
        setRosters(rostersFetched);
      });
    },[selectedUser, flyOverOpen])

    // if (rosters) {
    //   for (const roster of rosters) {
    //     if (roster.selectedTimes.end === "Never") {
    //       console.log(format(roster.selectedTimes.start.toDate(),'dd MMM yyyy') + " to indefinite")
    //     } else {
    //       console.log(format(roster.selectedTimes.start.toDate(),'dd MMM yyyy') + " to " + format(roster.selectedTimes.end.toDate(),'dd MMM yyyy'))
    //     }
    //   }
    // }

    
    const weekDays = [
      "Mon", 
      "Tues",
      "Wed",
      "Thurs",
      "Fri",
      "Sat",
      "Sun"
    ]

    const daysOfWeek = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday"
    ]
    
    const RosteredShift = ({roster}) => {

      const rosterData = roster.selectedTimes;
      const startDate = format(rosterData.start.toDate(),"dd MMM yyyy").toUpperCase()
      const endDate = rosterData.end === "Never" ? "INDEFINITE" : format(rosterData.end.toDate(),"dd MMM yyyy").toUpperCase()

      let allDaysOff = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].every(day => !rosterData[day].isWorking)
      
      return (
        <div
          className="flex flex-col mt-4"
          key={rosterData.start.toDate() + Math.random()}
        >
          <h1
            className="text-xs font-semibold leading-6  sm:mt-1.5 text-gray-700"
          >
            {rosterData.end === "Never" ? `${startDate} - ${endDate}` : 
              isSameDay(rosterData.start.toDate(), rosterData.end.toDate()) ? startDate : `${startDate} - ${endDate}`
            }
          </h1>
          {allDaysOff ? (
            <div
              className="flex flex-col gap-y-1 mt-2 rounded-lg text-gray-700 text-xs font-medium"
            >
              SCHEDULED LEAVE
            </div>
          ) : (
            <table className="w-full divide-y divide-gray-300 text-gray-700">
              {/* HEADING */}
              <thead>
                <tr>
                  {weekDays.map((day) => tableHeading(day))}
                </tr>
              </thead>
              {/* BODY */}
              <tbody className="divide-y divide-gray-200 bg-white">
                <tr>  
                  {daysOfWeek.map((day) => {
                    const rosterDay  = day.toLowerCase();
                    const rosterDayData = rosterData[rosterDay];

                    return (                
                        <td
                          className="whitespace-nowrap text-sm"
                          key={rosterDay + Math.random()}                 
                        >
                          <div
                            className="flex flex-col gap-y-1 pr-3 py-2 text-xs font-normal rounded-lg"
                          > 
                            {rosterDayData.isWorking === true ? (
                              <div>
                                {`${rosterDayData.start_time.hour}:${rosterDayData.start_time.min + rosterDayData.start_time.period} - ${rosterDayData.end_time.hour}:${rosterDayData.end_time.min + rosterDayData.end_time.period}`}
                              </div>
                            ) : ("Not working")}
                          </div>
                      </td>
                    )
                  })}
                </tr>
              </tbody>
            </table>
          )}
        </div>
      )
    }

    const today = startOfDay(new Date())
    const [selectedDay, setSelectedDay] = useState(today);
    const [currentMonth, setCurrentMonth] = useState(format(today,'MMM-yyyy'));
    let firstDayCurrentMonth = parse(currentMonth, 'MMM-yyyy', new Date())
  
    let days = eachDayOfInterval({
      start: startOfWeek(firstDayCurrentMonth),
      end: endOfWeek(endOfMonth(firstDayCurrentMonth))
  });

    const [weekInterval, setWeekInterval] = useState(Object)

    useEffect(() => {
      if (getDay(selectedDay) === 0) {
        // if Sunday, get previous day
        const prevDay = addDays(selectedDay,-1)
        setWeekInterval(eachDayOfInterval({
          start: addDays(startOfWeek(prevDay),1),
          end: addDays(endOfWeek(prevDay),1)
        }))
      } else {
        setWeekInterval(eachDayOfInterval({
          start: addDays(startOfWeek(selectedDay),1),
          end: addDays(endOfWeek(selectedDay),1)
        }))
      }
    },[selectedDay])
  
    const tableHeading = (day) => {
      return (
        <th 
            key = {day + Math.random()}
            scope="col" className="py-2 pr-2 text-left text-xs font-medium "
        >
          {day.toUpperCase()}
        </th>
      )
    }

    const [index, setIndex] = useState(0);

    return ( 
      <>
      <RegFlyOver flyOverOpen={flyOverOpen} setFlyOverOpen={setFlyOverOpen} user={selectedUser}/>
      <div className="h-full overflow-y-auto py-10 px-4 sm:px-6 lg:px-12 text-gray-900">
         
        <div className="flex flex-col gap-y-6">
          <h1 className="text-2xl font-semibold leading-6 ">Schedule</h1>
        </div>
          <Disclosure as="nav" className="bg-white border-b border-gray-200 pt-2">
          {({ open }) => (
            <>
              <div className="mx-auto max-w-7xl">
                <div className="flex justify-between">
                  <div className="flex">
                    <div className="flex space-x-6">
                      <div
                        onClick={() => setIndex(0)}
                        className={classNames(
                          "cursor-pointer inline-flex items-center border-b-2 py-2  px-1 text-sm font-medium text-gray-900",
                          index === 0 ? "border-blue-500" : ""
                        )}
                      >
                        Rostered Shifts
                      </div>
                      
                      <div
                        onClick={() => setIndex(2)}
                        className={classNames(
                          "cursor-pointer inline-flex items-center border-b-2 py-2  px-1  text-sm font-medium text-gray-900",
                          index === 2 ? "border-blue-500" : ""
                        )}
                      >
                        Current shifts
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </Disclosure>
      
        {/* Details */}
        <div
          className="pt-10 flex flex-col gap-y-4"
        >

        <TeamMember />

          { index === 0 ? (
            <div>
              {/* Rostered shifts */}
          <div className="overflow-x-auto -mr-4 sm:-mx-6 lg:-mx-8">
            <div className="inline-block gap-y-2 min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <div
                  className="flex flex-col gap-y-2 "
              >
                  <label
                      htmlFor="User-name"
                      className="block items-center text-lg font-semibold leading-6  sm:mt-1.5"
                  >
                      Rostered shifts
                  </label>
                  {rosters && rosters.length === 0 ? (
                    <div
                      className="text-sm font-medium text-gray-900"
                    >
                      You have no rostered shifts.
                    </div>
                  ) : (
                    <div
                      className="text-sm font-medium text-gray-900"
                    >
                      You are rostered to work:
                    </div>
                  )}
              </div>

              <div
                className="flex  flex-col gap-y-4"
              >
                {rosters ? rosters.map((roster) => 
                {
                  const rosteredStart = roster.selectedTimes.start.toDate()
                  const rosteredEnd = roster.selectedTimes.end

                  if (!(rosteredEnd === "Never")) {
                    const rosteredEnd = roster.selectedTimes.end.toDate()
                    const inInterval = isWithinInterval(today, {start: rosteredStart, end: rosteredEnd})
                    const inFuture = today < rosteredStart
                    if (inInterval || inFuture) {
                      return (
                      <RosteredShift roster={roster} key={roster.selectedTimes.start.toDate()}/>
                      )
                    }
                  } else {
                    return (
                    <RosteredShift roster={roster} key={roster.selectedTimes.start.toDate()}/>
                    )
                  }
                }
                ) : 
                  <div className="rounded-lg bg-gray-200 animate-pulse p-8">
                    <div className="bg-gray-400 rounded-lg"></div>
                  </div>
              }
              </div>


              {/* <div
                className="flex gap-x-1 px-2 -mx-2 py-2 text-sm text-pink-800 bg-pink-50 rounded-lg "
              ))}

              {/* <div
                className="flex gap-x-1 px-2 -mx-2 py-2 text-sm text-pink-800 bg-pink-50 rounded-lg "
              >
                Missing schedule for:
                <span
                  className="font-medium"
                >
                  x, 
                </span>
                <span
                  className="font-medium"
                >
                  y,
                </span>
                and 
                <span
                  className="font-medium"
                >
                  z
                </span>
                (over next three months)
              </div> */}

              {userProfile && userProfile.role === "Admin" && (
                <div
                  className="flex justify-end mt-8"
                >
                  <button
                      onClick={() => setFlyOverOpen(true)}
                      type="button"
                      className="flex-1 block rounded-md bg-black hover:bg-gray-700 px-3 py-2 text-center text-sm font-medium text-white hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                  >
                      Add
                  </button>
                </div>
              )}

              {/* <div
                className="cursor-pointer flex flex-row w-full bg-gray-50 hover:bg-gray-100 items-center rounded-lg justify-center gap-x-2 py-2 "
              >
                <PlusIcon className="h-4 w-4 text-gray-400" />
              </div> */}

            </div>

          </div>
            </div>) : (
              <div>
                {/* Working hours */}
          <div className="-mr-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <div
                    className="flex flex-row items-end justify-between gap-x-2 py-3 "
                >
                      <label
                          htmlFor="User-name"
                          className="block items-center text-lg font-semibold leading-6  sm:mt-1.5"
                      >
                          Current shifts
                      </label>



                    <div>
                        <div
                            className="flex flex-row gap-x-3 pr-2 md:pr-0"
                        > 
                          <div
                            className="flex flex-col gap-y-6"
                          >
                              <div className="relative flex items-center rounded-md bg-white md:items-stretch">
                                  <button
                                      onClick={() => setSelectedDay(addDays(selectedDay, -7))}
                                      type="button"
                                      className="flex h-9 w-12 items-center justify-center rounded-l-md border-y border-l border-gray-200 pr-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pr-0 md:hover:bg-gray-50"
                                  >
                                  <span className="sr-only">Previous day</span>
                                  <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
                                  </button>
                                  <button
                                  type="button"
                                    onClick={() => setSelectedDay(today)}
                                    className={classNames(
                                        isSameWeek(selectedDay, today) ? "bg-gray-100 font-medium" : "",
                                        "hidden border-y border-gray-200 px-3 text-xs text-gray-900 hover:bg-gray-100 focus:relative md:block",
                                    )}
                                  >
                                      This week
                                  </button>
                                  <button
                                  type="button"
                                  className="cursor-default hidden border-y border-gray-200 px-3 text-xs font-normal text-gray-900 focus:relative md:block"
                                  >
                                      {`${format(weekInterval[0], 'd')} - ${format(weekInterval[6], 'd, MMM yy')}`}
                                  </button>
                                  <span className="relative -mx-px h-5 w-px bg-gray-300 md:hidden" />
                                  <button
                                  onClick={() => setSelectedDay(addDays(selectedDay, 7))
                                  }
                                  type="button"
                                  className="flex h-9 w-12 items-center justify-center rounded-r-md border-y border-r border-gray-200 pl-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pl-0 md:hover:bg-gray-50"
                                  >
                                  <span className="sr-only">Next day</span>
                                  <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
                                  </button>
                              </div>

                              

                          </div>
                          
                            
                        </div>
                    </div>
                </div>
              <table className="min-w-full divide-y divide-gray-300 text-gray-700">
                <thead>
                  <tr>
                    {weekInterval.map((day) => tableHeading(format(day, 'EEE, do MMM')))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    <tr 
                    >
                      {weekInterval.map((day) => (
                        <td
                          className="whitespace-nowrap gap-y-1 py-1 pr-1 text-sm"
                          key={day + Math.random()}
                        >
                          <div
                            className="flex flex-col gap-y-1 mr-1"
                          >
                            {rosters.map((roster) => {
                              const rosteredStart = roster.selectedTimes.start
                              const rosteredEnd = roster.selectedTimes.end

                              if (rosteredEnd === "Never") {
                                if (isSameDay(day, rosteredStart.toDate()) || day > rosteredStart.toDate()) {
                                  // get day times
                                  const dayOfWeek = format(day, 'EEEE').toLowerCase();
                                  const isWorking = roster.selectedTimes[dayOfWeek].isWorking === true

                                  if (isWorking) {
                                    const startTime = roster.selectedTimes[dayOfWeek].start_time;
                                    const endTime = roster.selectedTimes[dayOfWeek].end_time;
                                    return (
                                      <div
                                        key={roster.selectedTimes.start.toDate() + Math.random()}
                                        className="flex flex-col gap-y-1 py-2 pl-2 pr-3 rounded-lg bg-gray-200 text-black text-xs font-normal"
                                      > 
                                        <span
                                          className="font-semibold"
                                        >
                                        Shift:
                                        </span>
                                        <span>
                                        {`${startTime.hour}:${startTime.min + startTime.period} - ${endTime.hour}:${endTime.min + endTime.period}`}
                                        </span>
                                      </div>
                                    )
                                  } else {
                                    return (
                                      <div
                                        key={roster.selectedTimes.start.toDate() + Math.random()}
                                        className="flex flex-col gap-y-1 py-2 pl-2 pr-3 rounded-lg bg-black text-white text-xs font-normal"
                                      > 
                                        Not working
                                      </div>
                                    )
                                  }
                                }
                              } else {
                                const inInterval = isWithinInterval(day, {start: rosteredStart.toDate(), end: rosteredEnd.toDate()})
                                if (inInterval) {
                                  // get day times
                                  const dayOfWeek = format(day, 'EEEE').toLowerCase();
                                  const isWorking = roster.selectedTimes[dayOfWeek].isWorking === true

                                  if (isWorking) {
                                    const startTime = roster.selectedTimes[dayOfWeek].start_time;
                                    const endTime = roster.selectedTimes[dayOfWeek].end_time;
                                    return (
                                      <div
                                        key={roster.selectedTimes.start.toDate() + Math.random()}
                                        className="flex flex-col gap-y-1 py-2 pl-2 pr-3 rounded-lg bg-gray-200 text-black text-xs font-normal"
                                      > 
                                        <span
                                          className="font-semibold"
                                        >
                                        Shift:
                                        </span>
                                        <span>
                                        {`${startTime.hour}:${startTime.min + startTime.period} - ${endTime.hour}:${endTime.min + endTime.period}`}
                                        </span>
                                      </div>
                                    )
                                  } else {
                                    return (
                                      <div
                                        key={roster.selectedTimes.start.toDate() + Math.random()}
                                        className="flex flex-col gap-y-1 py-2 pl-2 pr-3 rounded-lg bg-black text-white text-xs font-normal"
                                      > 
                                        Not working
                                      </div>
                                    )
                                  }
                                }
                              }
                            })}
                          </div>
                        </td>
                      ))}
                    </tr>
                </tbody>
              </table>
            </div>
          </div>
              </div>
            )}
        
        </div>
        
      </div>
      </>
    )
  }
  