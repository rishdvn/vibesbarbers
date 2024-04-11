
import { Fragment, forwardRef, useEffect, useState } from 'react'
import { Listbox, Dialog, Transition, Menu } from '@headlessui/react'
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore'
import { db } from '@/src/index.ts'
import { add, addDays, addHours, addMinutes, areIntervalsOverlapping, differenceInMinutes, eachDayOfInterval, endOfDay, endOfMonth, endOfWeek, format, formatDistance, getDay, isBefore, isEqual, isSameDay, isSameMonth, parse, parseISO, set, startOfDay, startOfWeek, toDate } from 'date-fns';


  function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
  }


export default function RegFlyOver({flyOverOpen, setFlyOverOpen, user}:{flyOverOpen: boolean, setFlyOverOpen: Function, user: {}}) {
  const [rosters, setRosters] = useState(null);

  useEffect(() => {
    onSnapshot(collection(db, "roster"), (querySnapshot) => {
      const rostersFetched = {};
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.uid === user.uid) {
          rostersFetched[doc.id] = data;
        }
      });
      setRosters(rostersFetched);
    });
  },[user,flyOverOpen])

  async function checkOverlap() {
    await setOverlapAction([]);
    let overlap;
    // selected start and selected end exists
    if (selectedTime.start && selectedTime.end) {
      // loop over the existing rosters
      for (const rosterId in rosters) {
        // define rostered start and end time
        const roster = rosters[rosterId];
        const rosterStartTime = roster.selectedTimes.start;
        const rosterEndTime = roster.selectedTimes.end;
        // 1. if selected end time is a date
        if (selectedTime.end instanceof Date) {
          // determine if overlaps exists, and if so, send to handleOverlap
          // if rostered end time is a date
          if (!(rosterEndTime === "Never")) {
            // if selected time overlaps with rostered time
            if (areIntervalsOverlapping({start: selectedTime.start, end: selectedTime.end},{start: rosterStartTime.toDate(), end: rosterEndTime.toDate()})) {
              // determine action of overlaps and append to overlapAction state
              handleOverlap({selectedStart: selectedTime.start, selectedEnd: selectedTime.end, rosteredStart: rosterStartTime.toDate(), rosteredEnd: rosterEndTime.toDate(), rosterId: rosterId})
            }
            // if rostered end time is indefinite
          } else {
            // check for overlap with rostered schedule
            if ((selectedTime.start < rosterStartTime.toDate() || isSameDay(selectedTime.start, rosterStartTime.toDate())) && selectedTime.end > rosterStartTime.toDate() || 
            (selectedTime.start > rosterStartTime.toDate()) ) {
              // determine action of overlaps and append to overlapAction state
              handleOverlap({selectedStart: selectedTime.start, selectedEnd: selectedTime.end, rosteredStart: rosterStartTime.toDate(), rosteredEnd: rosterEndTime, rosterId: rosterId})
            }
          }
        } else { {/* 2. if selected end is indefinite */}
          if (!(rosterEndTime === "Never")) {
            if (!(selectedTime.start > rosterStartTime.toDate() && selectedTime.start > rosterEndTime.toDate())) {
              handleOverlap({selectedStart: selectedTime.start, selectedEnd: selectedTime.end, rosteredStart: rosterStartTime.toDate(), rosteredEnd: rosterEndTime.toDate(), rosterId: rosterId})
            }
          } else {
            handleOverlap({selectedStart: selectedTime.start, selectedEnd: selectedTime.end, rosteredStart: rosterStartTime.toDate(), rosteredEnd: rosterEndTime, rosterId: rosterId})
          }
        }
      }
    }
  }

  const [overlapAction, setOverlapAction] = useState([]);

  interface handleOverlapProps {
    selectedStart: Date, 
    selectedEnd: Date, 
    rosteredStart: Date,
    rosteredEnd: Date, 
    rosterId: string
  }

  const handleOverlap = ({selectedStart, selectedEnd, rosteredStart, rosteredEnd, rosterId}: handleOverlapProps) => {
    if (selectedEnd instanceof Date) {
      // if selected start is before rostered start
      if (rosteredEnd instanceof Date) {
        if (selectedStart < rosteredStart || isSameDay(selectedStart, rosteredStart)) {
          // and selected end is after rostered end
          if (selectedEnd > rosteredEnd) {
            let actionObject = {}
            // we delete existing roster
            actionObject["action"] = "delete"
            actionObject["rosterId"] = rosterId
            actionObject["message"] = "NOTE: Publishing this roster will overwrite existing roster from " + format(rosteredStart, 'dd-MMM-yyyy') + " to " + format(rosteredEnd, 'dd-MMM-yyyy')
            setOverlapAction(prevOverlapActions => [...prevOverlapActions, actionObject]);
          } else {
            // and selected end is before rostered end
            let actionObject = {}
            // we delete edit roster
            actionObject["action"] = "edit"
            actionObject["rosterId"] = rosterId
            actionObject["newStart"] = startOfDay(addDays(selectedEnd, 1))
            actionObject["message"] = "NOTE: Publishing this roster will reschedule roster from " + format(rosteredStart, 'dd-MMM-yyyy') + " to " + format(rosteredEnd, 'dd-MMM-yyyy') + " to one scheduled from " + format(addDays(selectedEnd, 1), 'dd-MMM-yyyy') + " to " + format(rosteredEnd, 'dd-MMM-yyyy')
            setOverlapAction(prevOverlapActions => [...prevOverlapActions, actionObject]);
          }
          // if selected start is after rostered start
        } else if (selectedStart > rosteredStart) {
          // and selected end is before rostered end
          if (selectedEnd < rosteredEnd) {
            // publish two new periods
            let actionObject = {}
            actionObject["action"] = "republish"
            actionObject["rosterId"] = rosterId
            actionObject["newStart"] = startOfDay(addDays(selectedEnd, 1))
            actionObject["newEnd"] = endOfDay(addDays(selectedStart, -1))
            actionObject["message"] = "NOTE: Publishing this roster will split roster from " + format(rosteredStart, 'dd-MMM-yyyy') + " to " + format(rosteredEnd, 'dd-MMM-yyyy') + " to one scheduled from " + format(rosteredStart, 'dd-MMM-yyyy') + " to " + format(addDays(selectedStart,-1), 'dd-MMM-yyyy') + " and one from " + format(addDays(selectedEnd, 1), 'dd-MMM-yyyy') + " to " + format(rosteredEnd, 'dd-MMM-yyyy')
            setOverlapAction(prevOverlapActions => [...prevOverlapActions, actionObject]);
          } else {
            // and selected end is after rostered end
            let actionObject = {}
            // we edit existing roster
            actionObject["action"] = "edit"
            actionObject["rosterId"] = rosterId
            actionObject["newEnd"] = endOfDay(addDays(selectedStart, -1))
            actionObject["message"] = "NOTE: Publishing this roster will overwrite existing roster from " + format(rosteredStart, 'dd-MMM-yyyy') + " to " + format(rosteredEnd, 'dd-MMM-yyyy') + " to one from " + format(rosteredStart, 'dd-MMM-yyyy') + " to " + format(addDays(selectedStart, -1), 'dd-MMM-yyyy')
            setOverlapAction(prevOverlapActions => [...prevOverlapActions, actionObject]);
          }
        }
      } else {
        // if rostered end is indefinite
        if ((selectedStart < rosteredStart || isSameDay(selectedStart, rosteredStart)) && selectedEnd > rosteredStart) {
          let actionObject = {}
            actionObject["action"] = "edit"
            actionObject["rosterId"] = rosterId
            actionObject["newStart"] = startOfDay(addDays(selectedEnd, 1))
            actionObject["message"] = "NOTE: Publishing this roster will overwrite existing roster from " + format(rosteredStart, 'dd-MMM-yyyy') + " to indefinite to one that now starts from " + format(addDays(selectedEnd, 1), 'dd-MMM-yyyy') + " to indefinite"
            setOverlapAction(prevOverlapActions => [...prevOverlapActions, actionObject]);
        } else { {/*  */}
          let actionObject = {}
            actionObject["action"] = "republish"
            actionObject["rosterId"] = rosterId
            actionObject["newStart"] = startOfDay(addDays(selectedEnd, 1))
            actionObject["newEnd"] = endOfDay(addDays(selectedStart, -1))
            actionObject["message"] = "NOTE: Publishing this roster will split the roster from " + format(rosteredStart, 'dd-MMM-yyyy') + " to indefinite to one scheduled from " + format(rosteredStart, 'dd-MMM-yyyy') + " to " + format(endOfDay(addDays(selectedStart, -1)), 'dd-MMM-yyyy') + " and one from " + format(addDays(selectedEnd, 1), 'dd-MMM-yyyy') + " to indefinite"
            setOverlapAction(prevOverlapActions => [...prevOverlapActions, actionObject]);
        }
      }
    } else if (!(selectedEnd instanceof Date)) { {/* is selectedEnd is indefinite */}
      if (rosteredEnd instanceof Date) {
        if (selectedStart > rosteredStart && selectedStart < rosteredEnd) {
          let actionObject = {}
          actionObject["action"] = "edit"
          actionObject["rosterId"] = rosterId
          actionObject["newEnd"] = endOfDay(addDays(selectedStart, -1))
          actionObject["message"] = "NOTE: Publishing this roster will adjust existing roster from " + format(rosteredStart, 'dd-MMM-yyyy') + " to " + format(rosteredEnd, 'dd-MMM-yyyy') + " to one that now ends on " + format(addDays(selectedStart, -1), 'dd-MMM-yyyy')
          setOverlapAction(prevOverlapActions => [...prevOverlapActions, actionObject]);
        } else {
          let actionObject = {}
          actionObject["action"] = "delete"
          actionObject["rosterId"] = rosterId
          actionObject["message"] = "NOTE: Publishing this roster will overwrite existing roster from " + format(rosteredStart, 'dd-MMM-yyyy') + " to " + format(rosteredEnd, 'dd-MMM-yyyy')
          setOverlapAction(prevOverlapActions => [...prevOverlapActions, actionObject]);
        }
      } else {
        let actionObject = {}
        actionObject["action"] = "delete"
        actionObject["rosterId"] = rosterId
        actionObject["message"] = "NOTE: Publishing this roster will overwrite existing roster from " + format(rosteredStart, 'dd-MMM-yyyy') + " to indefinite"
        setOverlapAction(prevOverlapActions => [...prevOverlapActions, actionObject]);
      }
    }
  }

  {/* 1. PUBLISH DATA TO DATABASE */}
      async function getDocIdByUid(uid) {
        const q = query(collection(db, "users"), where("uid", "==", uid));
        const querySnapshot = await getDocs(q);
        let docId = null;
        querySnapshot.forEach((doc) => {
          // doc.data() is never undefined for query doc snapshots
          docId = doc.id;
        });
        return docId;
      }
    
      async function updateDocByUid(uid, userCredentials) {
        const docId = await getDocIdByUid(uid);
        if (docId) {
          const userDoc = doc(db, "users", docId);
          await updateDoc(userDoc, userCredentials);
        } else {
          console.error("No document found with the given uid");
        }
      }

      async function publishToRoster(uid, selectedTimes) {
        try {
          const docRef = await addDoc(collection(db, "roster"), {
            uid: uid,
            selectedTimes: selectedTimes
          });
          console.log("Document written with ID: ", docRef.id);
        } catch (e) {
          console.error("Error adding document: ", e);
        }
      }

      async function deleteDocByRosterId(overlapAction) {
        const rosterId = overlapAction.rosterId;
        await deleteDoc(doc(db, "roster", rosterId));
      }

      async function editDocByRosterId(overlapAction) {
        const rosterId = overlapAction.rosterId;
        const rosterRef = await doc(db, "roster", rosterId);
        
        if (overlapAction.newEnd) {
          await updateDoc(rosterRef, {
            "selectedTimes.end": overlapAction.newEnd
          });
        } else if (overlapAction.newStart) {
          await updateDoc(rosterRef, {
            "selectedTimes.start": overlapAction.newStart
          });
        }
      }

      async function republishDocByRosterId(overlapAction) {
        const rosterId = overlapAction.rosterId;
        const rosterRef = doc(db, "roster", rosterId)
        
         // Retrieve the existing roster
        const rosterDoc = await getDoc(rosterRef);
        const existingRoster = rosterDoc.data();

        const rosterNewEnd = {
          ...existingRoster,
          selectedTimes: {
            ...existingRoster.selectedTimes,
            end: overlapAction.newEnd
          }
        };

        try {
          const docRef = await addDoc(collection(db, "roster"), rosterNewEnd);
          console.log("Document written with ID: ", docRef.id);
        } catch (e) {
          console.error("Error adding document: ", e);
        }
        
        const rosterNewStart = {
          ...existingRoster,
          selectedTimes: {
            ...existingRoster.selectedTimes,
            start: overlapAction.newStart
          }
        };

        try {
          const docRef = await addDoc(collection(db, "roster"), rosterNewStart);
          console.log("Document written with ID: ", docRef.id);
        } catch (e) {
          console.error("Error adding document: ", e);
        }

        await deleteDoc(rosterRef);
      }

    const [submitAllowed, setSubmitAllowed] = useState(false)

    const validateSubmit = () => {
      let daysValid = daysOfWeek.every(day => 
        (selectedTime[day].start_time && selectedTime[day].end_time && selectedTime[day].isValid === true) || selectedTime[day].isWorking === false
      );

      let startEndValid;
      if (selectedTime.start instanceof Date && selectedTime.end instanceof Date && (isBefore(selectedTime.start,selectedTime.end) || isSameDay(selectedTime.start, selectedTime.end))) {
        startEndValid = true;
      } else if (selectedTime.start instanceof Date && selectedTime.end === "Never") {
        startEndValid = true;
      } else {
        startEndValid = false;
      }

      if (daysValid && startEndValid) {
          setSubmitAllowed(true);
      } else {
        setSubmitAllowed(false);
      }
    }

    async function handleSubmit() {
      await publishToRoster(user.uid, selectedTime);    
      if (overlapAction) {
        for (let actionObject of overlapAction) {
          if (actionObject.action === "delete") {
            await deleteDocByRosterId(actionObject);
          } else if (actionObject.action === "republish") {
            await republishDocByRosterId(actionObject);
          } else if (actionObject.action === "edit") {
            await editDocByRosterId(actionObject);
          }
        }
      }
      setFlyOverOpen(false);
    }

    // if leave without saving chnages, or change user
    useEffect(() => {
        setSelectedTime({
          "monday": {isWorking: true, isValid: true},
          "tuesday": {isWorking: true, isValid: true},
          "wednesday": {isWorking: true, isValid: true},
          "thursday": {isWorking: true, isValid: true},
          "friday": {isWorking: true, isValid: true},
          "saturday": {isWorking: true, isValid: true},
          "sunday": {isWorking: true, isValid: true},
          "start": null,
          "end": null
        });
        setIsBeforeDay(today);
        setStartSelectedDay(today);
        setOverlapAction([]);
        
      }, [flyOverOpen]);

    
    {/* 2. CALENDARS */}

    const today = startOfDay(new Date());
    const [startSelectedDay, setStartSelectedDay] = useState(today);
    const [startCurrentMonth, setStartCurrentMonth] = useState(format(today,'MMM-yyyy'));
    let startFirstDayCurrentMonth = parse(startCurrentMonth, 'MMM-yyyy', new Date())

    const [isBeforeDay, setIsBeforeDay] = useState(today);
  

    function changeStartSelectedDay(day: string) {
      if (format(startSelectedDay, 'MM') === format(day, 'MM')) {
        setSelectedTime(prev => ({...prev, "start": day})) // ensure did correct
        setStartSelectedDay(day)
        setIsBeforeDay(day)
        
      } else {
        setSelectedTime(prev => ({...prev, "start": day})) // ensure did correct
        setStartSelectedDay(day)
        setIsBeforeDay(day)
        setStartCurrentMonth(format(day, 'MMM-yyyy'))
        
      }
    }

    // calendar days
    let days = eachDayOfInterval({
      start: startOfWeek(startFirstDayCurrentMonth),
      end: endOfWeek(endOfMonth(startFirstDayCurrentMonth))
    });

  function nextMonth() {
    let startFirstDayNextMonth = add(startFirstDayCurrentMonth, {months: 1})
    setStartCurrentMonth(format(startFirstDayNextMonth, 'MMM-yyyy'))
  }

  function prevMonth() {
      let startFirstDayNextMonth = add(startFirstDayCurrentMonth, {months: -1})
      setStartCurrentMonth(format(startFirstDayNextMonth, 'MMM-yyyy'))
  }

  const StartCalendar = forwardRef((props, ref) => (
    <div ref={ref}>
      <div className="p-2">
        <div className="flex items-center text-center text-gray-900">
          <button
            onClick={prevMonth}
            type="button"
            className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Previous month</span>
            <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="flex-auto text-xs font-semibold">{format(startCurrentMonth, 'MMMM yyyy')}</div>
          <button
            onClick={nextMonth}
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
          {days.map((day, dayIdx) => (
              <button
                onClick={() => changeStartSelectedDay(day)}
                disabled={isBefore(day,today)}
                key={day.toDateString()}
                type="button"
                className={classNames(
                  'py-1.5 focus:z-10',
                  isSameMonth(day, startFirstDayCurrentMonth) && !isBefore(day,today) ? 'bg-white cursor-pointer hover:bg-gray-100' : 'bg-gray-50',
                  isSameMonth(day, startFirstDayCurrentMonth) && isBefore(day,today) ? 'bg-gray-50 cursor-not-allowed' : '',
                  (isEqual(day, startSelectedDay) || isEqual(day, today)) && 'font-semibold',
                  isEqual(day, startSelectedDay) && 'text-white',
                  !isEqual(day, startSelectedDay) && isSameMonth(day, startFirstDayCurrentMonth) && !isEqual(day, today) && 'text-gray-900',
                  !isEqual(day, startSelectedDay) && !isSameMonth(day, startFirstDayCurrentMonth) && !isEqual(day, today) && 'text-gray-400',
                  isEqual(day, today) && !isEqual(day, startSelectedDay) && 'text-red-500',
                  dayIdx === 0 && 'rounded-tl-lg',
                  dayIdx === 6 && 'rounded-tr-lg',
                  dayIdx === days.length - 7 && 'rounded-bl-lg',
                  dayIdx === days.length - 1 && 'rounded-br-lg'
                )}
              >
                <time
                  dateTime={day.date}
                  className={classNames(
                    'mx-auto flex h-7 w-7 items-center justify-center rounded-full',
                    isEqual(day, startSelectedDay) && isEqual(day, today) && 'bg-red-500',
                    isEqual(day, startSelectedDay) && !isEqual(day, today) && 'bg-gray-900'
                  )}
                >
                  {format(day,'d')}
                </time>
              </button>
          ))}
        </div>
      </div>
    </div>
  )) 

    // END CALENDAR DAY

    const [endSelectedDay, setEndSelectedDay] = useState(today);
    const [endCurrentMonth, setEndCurrentMonth] = useState(format(today,'MMM-yyyy'));
    let endFirstDayCurrentMonth = parse(endCurrentMonth, 'MMM-yyyy', new Date())

  // calendar days
    let endDays = eachDayOfInterval({
      start: startOfWeek(endFirstDayCurrentMonth),
      end: endOfWeek(endOfMonth(endFirstDayCurrentMonth))
    });

    function changeEndSelectedDay(day) {
      if (format(endSelectedDay, 'MM') === format(day, 'MM')) {
        setSelectedTime(prev => ({...prev, "end": day}))
        setEndSelectedDay(day)
        
      } else {
        setSelectedTime(prev => ({...prev, "end": day}))
        setEndSelectedDay(day)
        setEndCurrentMonth(format(day, 'MMM-yyyy'));
        
      }
    }

    function endNextMonth() {
    let endFirstDayNextMonth = add(endFirstDayCurrentMonth, {months: 1})
    setEndCurrentMonth(format(endFirstDayNextMonth, 'MMM-yyyy'))
    }

    function endPrevMonth() {
      let endFirstDayNextMonth = add(endFirstDayCurrentMonth, {months: -1})
      setEndCurrentMonth(format(endFirstDayNextMonth, 'MMM-yyyy'))
    }

    const EndCalendar = forwardRef((props, ref) => (
      <div className="p-2">
        <div className="flex items-center text-center text-gray-900">
          <button
            onClick={endPrevMonth}
            type="button"
            className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Previous month</span>
            <ChevronLeftIcon className="h-4 w-4" aria-hidden="true" />
          </button>
          <div className="flex-auto text-xs font-semibold">{format(endCurrentMonth, 'MMMM yyyy')}</div>
          <button
            onClick={endNextMonth}
            type="button"
            className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Next month</span>
            <ChevronRightIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="mt-2 grid grid-cols-7 text-center text-xs leading-6 text-gray-500">
          <div>S</div>
          <div>M</div>
          <div>T</div>
          <div>W</div>
          <div>T</div>
          <div>F</div>
          <div>S</div>
        </div>
        <div className="isolate mt-2 grid grid-cols-7 gap-px rounded-lg bg-gray-200 text-xs ring-1 ring-gray-200">
          {endDays.map((day, dayIdx) => (
              <button
                onClick={() => changeEndSelectedDay(endOfDay(day))}
                disabled={isBefore(day,isBeforeDay)}
                key={day.toDateString()}
                type="button"
                className={classNames(
                  'py-1.5 focus:z-10',
                  isSameMonth(day, endFirstDayCurrentMonth) && !isBefore(day,isBeforeDay) ? 'bg-white cursor-pointer hover:bg-gray-100' : 'bg-gray-50',
                  isSameMonth(day, endFirstDayCurrentMonth) && isBefore(day,isBeforeDay) ? 'bg-gray-50 cursor-not-allowed' : '',
                  (isEqual(day, endSelectedDay) || isEqual(day, today)) && 'font-semibold',
                  isEqual(day, endSelectedDay) && 'text-white',
                  !isEqual(day, endSelectedDay) && isSameMonth(day, endFirstDayCurrentMonth) && !isEqual(day, today) && 'text-gray-900',
                  !isEqual(day, endSelectedDay) && !isSameMonth(day, endFirstDayCurrentMonth) && !isEqual(day, today) && 'text-gray-400',
                  isEqual(day, today) && !isEqual(day, endSelectedDay) && 'text-red-500',
                  dayIdx === 0 && 'rounded-tl-lg',
                  dayIdx === 6 && 'rounded-tr-lg',
                  dayIdx === days.length - 7 && 'rounded-bl-lg',
                  dayIdx === days.length - 1 && 'rounded-br-lg'
                )}
              >
                <time
                  dateTime={day.date}
                  className={classNames(
                    'mx-auto flex h-7 w-7 items-center justify-center rounded-full',
                    isEqual(day, endSelectedDay) && isEqual(day, today) && 'bg-red-500',
                    isEqual(day, endSelectedDay) && !isEqual(day, today) && 'bg-gray-900'
                  )}
                >
                  {format(day,'d')}
                </time>
              </button>
          ))}
        </div>
      </div>
    )) 

  const daysOfWeek = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]

  const DaySchedule = ({day}:{day: string}) => {
    const daySchedule = selectedTime[day]
    const dayStartTime = daySchedule.start_time
    const dayEndTime = daySchedule.end_time

    // convert start time to date
    let startHour;
    if (dayStartTime) {
      startHour = dayStartTime.hour;
      if (dayStartTime.period === "PM" && dayStartTime.hour !== 12) {
        startHour = Number(dayStartTime.hour) + 12;
      } else if (dayStartTime.period === "AM" && dayStartTime.hour === 12) {
        startHour = 0;
      }
    }

    const startToDate = dayStartTime 
    ? new Date(2014, 1, 11, startHour, dayStartTime.min, 0)
    : null;

    // convert end time to date
    let endHour;
    if (dayEndTime) {
      endHour = dayEndTime.hour;
      if (dayEndTime.period === "PM" && dayEndTime.hour !== 12) {
        endHour = Number(dayEndTime.hour) + 12;
      } else if (dayEndTime.period === "AM" && dayEndTime.hour === 12) {
        endHour = 0;
      }
    }

    const endToDate = dayEndTime 
      ? new Date(2014, 1, 11, endHour, dayEndTime.min, 0)
      : null;

    // Publish endAfterStart?

    const endAfterStart = startToDate && endToDate && toDate(startToDate) < toDate(endToDate)
    
    return (
    <div className="flex flex-col gap-y-3">
      <label
          htmlFor="User-name"
          className="block text-xs font-semibold leading-6 text-gray-900"
        >
          {day.toUpperCase()}
      </label>
      {selectedTime[day].isWorking ? (
        <div
          className='flex flex-col gap-y-3'
        >
          <TimeSelect day={day} useCase="Start Time" />
          <TimeSelect day={day} useCase="End Time" />
        </div>
      ) : (
        ""
      )}
      {(selectedTime[day].isValid || !selectedTime[day].isWorking) ? "" : (
        <div
          className="text-red-600 text-xs font-semibold "
        >
          End time cannot be before start time
        </div>
      )
      }
      <div className="text-xs font-semibold text-gray-500 flex flex-row items-center gap-x-2 col-span-1">
          <input
            type="checkbox"
            name="not_working"
            id="not_working"
            checked={!selectedTime[day].isWorking}
            onChange={() => handleWorking(day)}
          />
          Not working
        </div>
    </div>
  )}

    {/* 3. STORE TIME SELECTION INFO */}
    const [selectedTime, setSelectedTime] = useState({
      "monday": {isWorking: true, isValid: true},
      "tuesday": {isWorking: true, isValid: true},
      "wednesday": {isWorking: true, isValid: true},
      "thursday": {isWorking: true, isValid: true},
      "friday": {isWorking: true, isValid: true},
      "saturday": {isWorking: true, isValid: true},
      "sunday": {isWorking: true, isValid: true},
      "start": null,
      "end": null
    })

    const handleTimeSelect = (day, useCaseKey, time) => {

       {/* START, END TIME STUFF*/}
        if (useCaseKey === "start_time" && selectedTime[day].end_time) {
          {/* inputting start-time */}
          const daySchedule = selectedTime[day]
          const dayEndTime = daySchedule.end_time

          let startHour = time.hour;
          if (time.period === "PM" && time.hour !== 12) {
            startHour = Number(time.hour) + 12;
          } else if (time.period === "AM" && time.hour === 12) {
            startHour = 0;
          }

          const startToDate = time
            ? new Date(2014, 1, 11, startHour, time.min, 0)
            : null;

           // convert end time to date
            let endHour;
            if (dayEndTime) {
              endHour = dayEndTime.hour;
              if (dayEndTime.period === "PM" && dayEndTime.hour !== 12) {
                endHour = Number(dayEndTime.hour) + 12;
              } else if (dayEndTime.period === "AM" && dayEndTime.hour === 12) {
                endHour = 0;
              }
            }

            const endToDate = dayEndTime 
              ? new Date(2014, 1, 11, endHour, dayEndTime.min, 0)
              : null;

            // Publish endAfterStart?
            const endAfterStart = startToDate && endToDate && toDate(startToDate) < toDate(endToDate)
            // setSelectedTime({...selectedTime, [day]: {...selectedTime[day], [useCaseKey]: time, isValid: endAfterStart}})
            setSelectedTime(prev => ({...prev, [day]: {...prev[day], [useCaseKey]: time, isValid: endAfterStart}})) // ensure correct

        } else if (useCaseKey === "end_time" && selectedTime[day].start_time) {
          {/* inputting start-time */}
          const daySchedule = selectedTime[day]
          const dayStartTime = daySchedule.start_time
          
          // convert start time to date
          let startHour;
          if (dayStartTime) {
            startHour = dayStartTime.hour;
            if (dayStartTime.period === "PM" && dayStartTime.hour !== 12) {
              startHour = Number(dayStartTime.hour) + 12;
            } else if (dayStartTime.period === "AM" && dayStartTime.hour === 12) {
              startHour = 0;
            }
          }
  
          const startToDate = dayStartTime 
          ? new Date(2014, 1, 11, startHour, dayStartTime.min, 0)
          : null;

          // convert end time to date
          let endHour;
          if (time) {
            endHour = time.hour;
            if (time.period === "PM" && time.hour !== 12) {
              endHour = Number(time.hour) + 12;
            } else if (time.period === "AM" && time.hour === 12) {
              endHour = 0;
            }
          }
  
          const endToDate = time 
            ? new Date(2014, 1, 11, endHour, time.min, 0)
            : null;
  
          // Publish endAfterStart?
  
          const endAfterStart = startToDate && endToDate && toDate(startToDate) < toDate(endToDate)
          // setSelectedTime({...selectedTime, [day]: {...selectedTime[day], [useCaseKey]: time, isValid: endAfterStart}});
          setSelectedTime(prev => ({...prev, [day]: {...prev[day], [useCaseKey]: time, isValid: endAfterStart}}));
        } else {
          // setSelectedTime({...selectedTime, [day]: {...selectedTime[day], [useCaseKey]: time}});
          setSelectedTime(prev => ({...prev, [day]: {...prev[day], [useCaseKey]: time}}));
        }
    }

    const handleWorking = (day) => {
      if (!selectedTime[day].isWorking) {
        // setSelectedTime({...selectedTime, [day]: {...selectedTime[day], isWorking: true}})
        setSelectedTime(prev => ({...prev, [day]: {...prev[day], isWorking: true}}))
      } else {
        // setSelectedTime({...selectedTime, [day]: {...selectedTime[day], isWorking: false}})
        setSelectedTime(prev => ({...prev, [day]: {...prev[day], isWorking: false}}))
      }
    };
  

    const scheduleLeave = () => {

      const areAllDaysOff = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].every(day => !selectedTime[day].isWorking);

      if (areAllDaysOff) {
        // if currently off (isWorking is false), now set isWorking to true
        // setSelectedTime({
        //   ...selectedTime,
        //   "monday": {...selectedTime["monday"], isWorking: true},
        //   "tuesday": {...selectedTime["tuesday"], isWorking: true},
        //   "wednesday": {...selectedTime["wednesday"], isWorking: true},
        //   "thursday": {...selectedTime["thursday"], isWorking: true},
        //   "friday": {...selectedTime["friday"], isWorking: true},
        //   "saturday": {...selectedTime["saturday"], isWorking: true},
        //   "sunday": {...selectedTime["sunday"], isWorking: true},
        // })
        setSelectedTime(prev => ({
          ...prev,
          "monday": {...prev["monday"], isWorking: true},
          "tuesday": {...prev["tuesday"], isWorking: true},
          "wednesday": {...prev["wednesday"], isWorking: true},
          "thursday": {...prev["thursday"], isWorking: true},
          "friday": {...prev["friday"], isWorking: true},
          "saturday": {...prev["saturday"], isWorking: true},
          "sunday": {...prev["sunday"], isWorking: true},
        }))
      } else {
        // if currently working (isWorking is true), now set isWorking to false (no longer working)
        // setSelectedTime({
        //   ...selectedTime,
        //   "monday": {...selectedTime["monday"], isWorking: false},
        //   "tuesday": {...selectedTime["tuesday"], isWorking: false},
        //   "wednesday": {...selectedTime["wednesday"], isWorking: false},
        //   "thursday": {...selectedTime["thursday"], isWorking: false},
        //   "friday": {...selectedTime["friday"], isWorking: false},
        //   "saturday": {...selectedTime["saturday"], isWorking: false},
        //   "sunday": {...selectedTime["sunday"], isWorking: false},
        // })
        setSelectedTime(prev => ({
          ...prev,
          "monday": {...prev["monday"], isWorking: false},
          "tuesday": {...prev["tuesday"], isWorking: false},
          "wednesday": {...prev["wednesday"], isWorking: false},
          "thursday": {...prev["thursday"], isWorking: false},
          "friday": {...prev["friday"], isWorking: false},
          "saturday": {...prev["saturday"], isWorking: false},
          "sunday": {...prev["sunday"], isWorking: false},
        }))
      }
    }

  const TimeSelect = ({day, useCase}:{day: string, useCase: string}) => {
    const [tempTime, setTempTime] = useState({})
    const useCaseKey = useCase.replace(" ", "_").toLowerCase()
    const hours = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"]
    const mins = ["00", "20", "40"]

    return (
      <Menu as="div" className="flex flex-col relative text-left">
        <div
          className='flex flex-col gap-y-2'
        >
          <div
            className='text-xs font-semibold text-gray-500'
          >
            {useCase.toUpperCase()}
          </div>

          <div>
            <Menu.Button className="w-full">
              <div
                className={classNames(
                  "rounded-lg border border-gray-300 flex items-start p-2 text-xs text-gray-500 font-medium cursor-pointer",
                  selectedTime && selectedTime[day] && selectedTime[day][useCaseKey] ? 'text-gray-700' : ''
                )}
              >
                  {selectedTime[day] && selectedTime[day][useCaseKey] ? `${selectedTime[day][useCaseKey].hour}:${selectedTime[day][useCaseKey].min} ${selectedTime[day][useCaseKey].period}` : 'Select time'}
              </div>
            </Menu.Button>
          </div>
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
                  {/* COLS */}
                  <div
                    className='flex flex-col h-52 divide-y '
                  >
                    <div
                      className='flex flex-1 h-40 divide-x divide-gray-200'
                    >
                      {/* HOURS */}
                      <div
                        className='flex flex-col flex-1 text-xs font-medium text-gray-500 divide-y divide-gray-200'
                      >
                        <div
                          className='bg-gray-100 flex justify-center items-center p-1'
                        >
                          HOURS
                        </div>
                        <div
                          className='overflow-y-auto flex w-full flex-col items-center py-1'
                        >
                          {hours.map((hour) => (
                            <div
                              key={hour}
                              onClick={() => setTempTime(prev => ({...prev, hour: hour}))}
                              className={classNames(
                                tempTime.hour === hour ? 'bg-gray-200' : 'bg-white',
                                'w-full p-1 text-center font-normal hover:bg-gray-100 cursor-pointer'
                              )}
                            >
                              {hour}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* MINS */}
                      <div
                        className='flex flex-col flex-1 text-xs font-medium text-gray-500 divide-y divide-gray-200'
                      >
                        <div
                          className='bg-gray-100 flex justify-center items-center p-1'
                        >
                          MINS
                        </div>
                        <div
                          className='overflow-y-auto flex w-full flex-col items-center py-1'
                        >
                          {mins.map((min) => (
                            <div
                              key={min}
                              onClick={() => setTempTime(prev => ({...prev, min: min}))}
                              className={classNames(
                                tempTime.min === min ? 'bg-gray-200' : 'bg-white',
                                'w-full p-1 text-center font-normal hover:bg-gray-100 cursor-pointer'
                              )}
                            >
                              {min}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* PERIOD */}
                      <div
                        className='flex flex-col flex-1 text-xs font-medium text-gray-500 divide-y divide-gray-200'
                      >
                        <div
                          className='bg-gray-100 flex justify-center items-center p-1'
                        >
                          PERIOD
                        </div>
                        <div
                          className='flex flex-col w-full items-center py-1'
                        >
                          <div                
                              className={classNames(
                                tempTime.period === "AM" ? 'bg-gray-200' : 'bg-white',
                                'w-full p-1 text-center font-normal hover:bg-gray-100 cursor-pointer'
                              )}
                              onClick={() => setTempTime(prev => ({...prev, period: 'AM'}))}
                            >
                              AM
                            </div>
                            <div
                              className={classNames(
                                tempTime.period === "PM" ? 'bg-gray-200' : 'bg-white',
                                'w-full p-1 text-center font-normal hover:bg-gray-100 cursor-pointer'
                              )}
                              onClick={() => setTempTime(prev => ({...prev, period: 'PM'}))}
                            >
                              PM
                            </div>
                        </div>
                      </div>
                    </div>

                    <div
                      className="px-2 py-1 gap-x-2 rounded-b-lg flex items-center justify-between "
                    >
                      <div
                        className='text-xs text-gray-700 font-medium'
                      >
                        {tempTime.hour === undefined ? "Select time" : (`${tempTime.hour}:${tempTime.min ? tempTime.min : ""} ${tempTime.period ? tempTime.period : ""}`)}
                      </div>
                      <Menu.Item>
                        <div
                          className={`px-2 py-1 text-xs rounded-lg ${tempTime.hour && tempTime.min && tempTime.period ? 'cursor-pointer bg-black text-white' : 'font-medium cursor-not-allowed bg-gray-400 text-gray-700'}`}
                          onClick={() => {
                            if (tempTime.hour && tempTime.min && tempTime.period) {
                              handleTimeSelect(day, useCaseKey, tempTime);
                              
                            }
                          }}
                        >
                          SAVE
                        </div>
                      </Menu.Item>
                    </div>
                  </div>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    )
  }

  useEffect(() => {
    validateSubmit();
    checkOverlap();
  }, [selectedTime]);

  {/* MAIN RETURN */}
  return (
    <Transition.Root show={flyOverOpen} as={Fragment}>
      <Dialog as="div" className="z-10" onClose={setFlyOverOpen}>
        <div
          className='fixed inset-0 overflow-hidden bg-black bg-opacity-50 z-10'
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
                                Add to schedule
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
                        <div className="flex flex-col gap-y-10 px-4 py-5">
                          {/* Duration */}
                          <div
                            className="flex flex-col gap-y-3"
                          >
                            <label
                              htmlFor="User-name"
                              className="block text-xs font-semibold leading-6 text-gray-900 sm:mt-1.5"
                            >
                             DURATION
                            </label>

                            {/* Start time */}
                            <div
                              className="grid grid-cols-1 gap-y-1 space-y-0"
                            >   
                                <label
                                  htmlFor="User-name"
                                  className="block text-xs font-semibold leading-6 text-gray-700 sm:mt-1.5"
                                >
                                  START DATE
                                </label>

                                <Menu as="div" className="flex flex-col relative text-left">
                                  <div>
                                    <Menu.Button className="w-full">
                                      <div
                                        className="rounded-lg border border-gray-300 flex items-start py-2 px-1 text-xs text-gray-500 font-medium cursor-pointer"
                                      >
                                        {selectedTime.start ? format(selectedTime.start, 'dd-MMM-yyyy') : "dd-MMM-YYYY"}
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
                                            <StartCalendar />
                                          </Menu.Item>
                                      </div>
                                    </Menu.Items>
                                  </Transition>
                                </Menu>
                            </div>

                            <div
                              className='grid grid-cols-1 gap-1 space-y-0'
                            >
                              <label
                                htmlFor="User-name"
                                className="block text-xs font-semibold leading-6 text-gray-700 sm:mt-1.5"
                              >
                                END DATE
                              </label>

                              <Menu as="div" className="flex flex-col relative text-left">
                                <div>
                                  <Menu.Button className="w-full">
                                    <div
                                      className="rounded-lg border border-gray-300 flex items-start py-2 px-1 text-xs text-gray-500 font-medium cursor-pointer"
                                    >
                                      {selectedTime.end ? (selectedTime.end instanceof Date ? format(selectedTime.end, 'dd-MMM-yyyy') : selectedTime.end) : "dd-MMM-YYYY"}
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
                                    <Menu.Item>
                                        <div
                                          onClick={() => {setSelectedTime(prev => ({...prev, "end": "Never"}))}} 
                                          className='p-2 text-xs text-gray-500 font-medium cursor-pointer hover:bg-gray-100'
                                        >
                                          Never
                                        </div>
                                    </Menu.Item>
                                    <Menu.Item>
                                        <EndCalendar />
                                    </Menu.Item>
                                  </Menu.Items>
                                </Transition>
                              </Menu>
                            </div>

                            {selectedTime.start instanceof Date && selectedTime.end instanceof Date && !(isBefore(selectedTime.start,selectedTime.end) || isSameDay(selectedTime.start, selectedTime.end)) ? (
                              <div


                                className="text-red-600 text-xs font-semibold "
                              >
                                End time cannot be before start time
                              </div>
                            ) : ""}

                            {overlapAction ? (
                              <div
                                className="flex flex-col gap-y-2 text-red-600 text-xs font-semibold "
                              >
                                {overlapAction.map((actionObject) => {
                                  return (
                                    <div
                                      key={actionObject.message}
                                    >
                                      {actionObject.message}
                                    </div>
                                  )
                                })}
                              </div>
                            ) : ""}
                          </div>

                          {/* Duration */}
                          <div
                            className="flex flex-col gap-y-3"
                          >
                            <label
                              htmlFor="User-name"
                              className="block text-xs font-semibold leading-6 text-gray-900 sm:mt-1.5"
                            >
                              LEAVE
                            </label>

                            {/* Start time */}
                            <div
                              className="grid grid-cols-1 gap-y-1 space-y-0"
                            >  
                                <div className="text-xs font-semibold text-gray-500 flex flex-row items-center gap-x-2 col-span-1">
                                    <input
                                      type="checkbox"
                                      name="not_working"
                                      id="not_working"
                                      checked={["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].every(day => !selectedTime[day].isWorking)}
                                      onChange={() => scheduleLeave()}
                                    />
                                    Schedule entire period as leave
                                </div> 
                            </div>
                          </div>

                          {/* Daily schedule */}
                          {daysOfWeek.map((day) => (
                            <DaySchedule key={day} day={day} />
                          ))}

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
                              disabled={!submitAllowed}
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
