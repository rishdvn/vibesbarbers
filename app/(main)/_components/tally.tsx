"use client";

import { addDoc, collection, doc, onSnapshot, updateDoc } from "firebase/firestore";
import { db } from "../../../src/index.ts";
import { use, useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, Bars3Icon, BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { add, addDays, addHours, addMinutes, areIntervalsOverlapping, differenceInMinutes, eachDayOfInterval, endOfDay, endOfMonth, endOfWeek, format, formatDistance, getDay, isEqual, isSameDay, isSameMonth, parse, parseISO, set, startOfDay, startOfWeek } from 'date-fns';

import firebase from 'firebase/app';
import 'firebase/firestore';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function TallyPage() {

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

        setWorkingBarbers(tempWorkingBarbers)
        }

    },[rosters, selectedDay, users, appointments, selectedDayApps])

    // determine each barbers total for the day
    const [revTotals, setRevTotals] = useState({
        productsTotal: 0,
        overallBarberTotal: 0,
    });

    useEffect(() => {
        let overallBarberTotal = 0;
        for (let barber of workingBarbers) {
            let total = 0;
            for (let app of selectedDayApps) {
                if (app.appDetails.barberUID === barber.uid) {
                    if (app.service) {
                        total += Number(app.service)
                    }
                }
            }
            overallBarberTotal += total;
            setRevTotals(prev => ({...prev, [barber.uid]: total}))
        }
        
        let productsTotal = 0;
        if (selectedDayApps) {
            for (let app of selectedDayApps) {
                if (app.product) {
                    productsTotal += Number(app.product)
                }
            }
        }
        setRevTotals(prev => ({...prev, productsTotal: productsTotal, overallBarberTotal: overallBarberTotal}))
    },[appointments, workingBarbers, selectedDayApps])

    // fetch all tallies
    const [tallys, setTallys] = useState([]);

    useEffect(() => {
        onSnapshot(collection(db, "tallys"), (querySnapshot) => {
        const tallysFetched = [];
        querySnapshot.forEach((doc) => {
            let tempTally = {...doc.data(), id: doc.id}
            tallysFetched.push(tempTally);
        });
        setTallys(tallysFetched);
        })
    },[])
    
    // define tallyData as the selectedDays tally information, updates if selectedDay changes or talllys fetch change
    const [tallyData, setTallyData] = useState({});


    useEffect(() => {
        let tempTallyData = {}
        for (let tally of tallys) {
            if (tally.date) {
                const tallyDate = tally.date.toDate();
                if (isSameDay(tallyDate, selectedDay)) {
                    tempTallyData = tally;
                }
            }
        }
        setTallyData(tempTallyData)
    },[tallys, selectedDay])

    //isEditing states
    const [isEditingEftpos, setIsEditingEftpos] = useState(false);
    const [isEditingCash, setIsEditingCash] = useState(false);

    useEffect(() => {
        setIsEditingEftpos(false);
        setIsEditingCash(false);
    },[selectedDay])

    async function handleTallySubmit() {
        if (tallyData.id) {
            const tallyRef = doc(db, "tallys", tallyData.id)
            await updateDoc(tallyRef, tallyData)
        } else {
            const tallyRef = collection(db, "tallys")
            await addDoc(tallyRef, tallyData)
        }
        setIsEditingEftpos(false)
        setIsEditingCash(false)
    }

    return ( 
        <div className="h-full overflow-y-auto py-10 px-4 sm:px-6 lg:px-12 text-gray-900">
            <h1 className="text-2xl font-semibold leading-6 ">Tally</h1>
            
            <div
                className="flex flex-col gap-y-2 mt-8"
            >
                {/* Selected Day Toggle */}
                <div
                    className="flex flex-1 justify-end"
                >
                    <div className="relative flex items-center rounded-lg bg-white sm:items-stretch">
                        <button
                            onClick={() => setSelectedDay(addDays(selectedDay, -1))}
                            type="button"
                            className="flex h-9 w-12 items-center justify-center rounded-l-lg border-y border-l border-gray-200 pr-1 text-gray-400 hover:text-gray-500 focus:relative sm:w-9 sm:pr-0 sm:hover:bg-gray-50"
                        >
                        <span className="sr-only">Previous day</span>
                        <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                        type="button"
                        onClick={() => setSelectedDay(today)}
                        className={classNames(
                            isSameDay(selectedDay, today) ? "bg-gray-100 font-medium" : "",
                            "border-y border-gray-200 px-3 h-full text-xs text-gray-900 hover:bg-gray-100 focus:relative",
                        )}
                        >
                            Today
                        </button>
                        <button
                        type="button"
                        className="cursor-default border-y border-gray-200 h-full px-3 text-xs font-normal text-gray-900 focus:relative"
                        >
                            {`${format(selectedDay, 'd MMM')}`}
                        </button>
                        <button
                        onClick={() => setSelectedDay(addDays(selectedDay, 1))
                        }
                        type="button"
                        className="flex h-9 w-12 items-center justify-center rounded-r-lg border-y border-r border-gray-200 pl-1 text-gray-400 hover:text-gray-500 focus:relative sm:w-9 sm:pl-0 sm:hover:bg-gray-50"
                        >
                        <span className="sr-only">Next day</span>
                        <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>
                </div>
                
                {/* Table */}
                <div
                    className="flex flex-col gap-y-8 mt-8"
                >
                    <div className="flex flex-col gap-y-3">
                        <h1 className="text-sm font-semibold text-blue-700">
                            1. Cash and EFTPOS Total
                        </h1>
                        <table className="min-w-full divide-y divide-gray-300 text-sm text-gray-700">
                            <thead>
                                <tr className="flex flex-row justify-between">
                                    <th className="font-semibold text-xs flex flex-1 items-start py-1">
                                        EFTPOS
                                    </th>
                                    <th className="font-semibold text-xs flex flex-1 items-start py-1">
                                        Cash
                                    </th>
                                    <th className="font-semibold text-xs flex flex-1 items-start py-1 text-green-700">
                                        EFT + Cash = Total 1
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="flex flex-row justify-between">
                                    <td className="flex flex-1 items-start px-0.5 py-1">
                                        {!isEditingEftpos && (
                                            <div
                                                onClick={() => setIsEditingEftpos(!isEditingEftpos)}
                                                className={classNames(
                                                    !tallyData.eftposTotal ? "bg-yellow-100 hover:bg-yellow-200" : "bg-gray-100 hover:bg-gray-200",
                                                    "text-xs mr-2 flex flex-1 cursor-pointer rounded-lg p-2"
                                                )}
                                            >
                                                {tallyData.eftposTotal ? (
                                                    <div>
                                                        {`$${tallyData.eftposTotal}`}
                                                    </div>
                                                ) : "Enter EPTPOS total"}
                                            </div>
                                        )}
                                        {isEditingEftpos && (
                                            <div
                                                className="flex flex-row gap-x-1 w-full"
                                            >
                                                <input 
                                                    type="number" min={0} className="w-full rounded-lg px-1 py-1.5 border border-gray-200"
                                                    onChange={(e) => setTallyData({...tallyData, eftposTotal: e.target.value, date: selectedDay})}
                                                    value={tallyData.eftposTotal ? tallyData.eftposTotal : ""}
                                                />
                                                <div
                                                    className="cursor-pointer flex items-center rounded-lg bg-black text-white px-2 text-xs"
                                                    onClick={handleTallySubmit}
                                                >
                                                    SAVE
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="flex flex-1 items-start px-0.5 py-1">
                                        {!isEditingCash && (
                                        <div
                                            onClick={() => setIsEditingCash(!isEditingEftpos)}
                                            className={classNames(
                                                !tallyData.cashTotal ? "bg-yellow-100 hover:bg-yellow-200" : "bg-gray-100 hover:bg-gray-200",
                                                "text-xs mr-2 flex flex-1 cursor-pointer rounded-lg p-2"
                                            )}
                                        >
                                            {tallyData.cashTotal ? (
                                                <div>
                                                    {`$${tallyData.cashTotal}`}
                                                </div>
                                            ) : "Enter Cash total"}
                                        </div>
                                        )}
                                        {isEditingCash && (
                                            <div
                                                className="flex flex-row gap-x-1 w-full"
                                            >
                                                <input 
                                                    type="number" min={0} className="w-full rounded-lg px-1 py-1.5 border border-gray-200"
                                                    onChange={(e) => setTallyData({...tallyData, cashTotal: e.target.value, date: selectedDay})}
                                                    value={tallyData.cashTotal ? tallyData.cashTotal : ""}
                                                />
                                                <div
                                                    className="cursor-pointer flex items-center rounded-lg bg-black text-white px-2 text-xs"
                                                    onClick={handleTallySubmit}
                                                >
                                                    SAVE
                                                </div>
                                            </div>
                                        )}
                                    </td>
                                    <td className="flex flex-1 text-xs items-start px-1 py-2">
                                        {tallyData.eftposTotal && tallyData.cashTotal ? `$${Number(tallyData.eftposTotal) + Number(tallyData.cashTotal)}` : "Enter EFTPOS and Cash totals"}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-y-3">
                        <h1 className="text-sm font-semibold text-blue-700">
                            2. Difference in GSTs
                        </h1>
                        <table className="min-w-full divide-y divide-gray-300 text-sm text-gray-700">
                            <thead>
                                <tr className="flex flex-row justify-between">
                                    <th className="font-semibold text-xs flex flex-1 items-start">
                                        GST = Total 2 - Total 1
                                    </th>
                                    <th className="font-semibold text-xs flex flex-1 items-start">
                                        EFT / 11
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="flex flex-row justify-between">
                                    <td className="flex flex-1 text-xs items-start px-1 py-2">
                                        {tallyData.eftposTotal && tallyData.cashTotal ? `$${(revTotals.overallBarberTotal + revTotals.productsTotal)-(Number(tallyData.eftposTotal) + Number(tallyData.cashTotal))}` : "Enter EFTPOS and Cash totals"}
                                    </td>
                                    <td className="flex flex-1 text-xs items-start px-1 py-2">
                                        {tallyData.eftposTotal ? (
                                            <div>
                                                {`$${(tallyData.eftposTotal / 11).toFixed(2)}`}
                                            </div>
                                        ) : "Enter EPTPOS total"}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-y-3">
                        <h1 className="text-sm font-semibold text-blue-700">
                            3. Barber and Product Totals
                        </h1>
                        <table className="min-w-full divide-y divide-gray-300 text-sm text-gray-700">
                            <thead>
                                <tr className="flex flex-row justify-between">
                                    {workingBarbers.map((barber) => (
                                        <th key={barber.uid} className="font-semibold text-xs flex flex-1 items-start">
                                            {`${barber.firstname}'s total`}
                                        </th>
                                    ))}
                                    <th className="font-semibold text-xs flex flex-1 items-start text-red-700">
                                        Barbers total
                                    </th>
                                    <th className="font-semibold text-xs flex flex-1 items-start text-red-700">
                                        Products total
                                    </th>
                                    <th className="font-semibold text-xs flex flex-1 items-start text-green-700">
                                        Total 2
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="flex flex-row justify-between">
                                    {workingBarbers.map((barber) => (
                                        <td key={barber.uid} className="flex flex-1 text-xs items-start px-1 py-2">
                                            {`$${revTotals[barber.uid]}`}
                                        </td>
                                    ))}
                                    <td className="flex flex-1 text-xs items-start px-1 py-2">
                                        {`$${revTotals.overallBarberTotal}`}
                                    </td>
                                    <td className="flex flex-1 text-xs items-start px-1 py-2">
                                        {`$${revTotals.productsTotal}`}
                                    </td>
                                    <td className="flex flex-1 text-xs items-start px-1 py-2">
                                        {`$${revTotals.overallBarberTotal + revTotals.productsTotal}`}
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                </div>
            </div>
</div>
    )
}
  