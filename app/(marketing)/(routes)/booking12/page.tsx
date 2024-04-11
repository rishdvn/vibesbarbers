"use client";

import { forwardRef, useEffect, useState } from "react";
import Breadcrumbs from "../../_components/breadcrumbs";
import Professionals from "../../_components/professional";
import Services from "../../_components/services";
import Summary from "../../_components/summary";
import Times from "../../_components/time";
import { CheckCircleIcon } from "@heroicons/react/20/solid";
import { add, addDays, addHours, addMinutes, areIntervalsOverlapping, differenceInMinutes, eachDayOfInterval, endOfDay, endOfMonth, endOfWeek, format, formatDistance, getDay, isBefore, isEqual, isSameDay, isSameMonth, isSameSecond, parse, parseISO, set, startOfDay, startOfWeek, toDate } from 'date-fns';
import { ArrowLeftIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, onSnapshot, query, updateDoc, where } from 'firebase/firestore'
import { db } from '@/src/index.ts'


const BookingPage = () => {

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

  async function handleSubmit() {
    await publishToAppointments(appDetails);
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
      !(appDetails.telNo.length === 9 || appDetails.telNo.length === 0) || 
      appDetails.appDay === "" || 
      (appDetails.isExtra === false && (appDetails.appStartTime === "" || appDetails.appEndTime === ""))
    ) {
      setAllowSubmit(false)
    } else {
      setAllowSubmit(true)
    }
  },[appDetails])

    {/* 2. CALENDARS + APPOINTMENTS */}

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
              rosterStartTime = add(selectedDay, {hours: rosterStartTimeObject.hour, minutes: rosterStartTimeObject.min})
            } else {
              rosterStartTime = add(selectedDay, {hours: Number(rosterStartTimeObject.hour) + 12, minutes: rosterStartTimeObject.min})
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
          <div className="flex-auto text-xs font-semibold">{format(currentMonth, 'MMMM yyyy')}</div>
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
                disabled={appDetails.isExtra ? false : (isBefore(day,today) || !dayIsWorking)}
                key={day.toDateString()}
                type="button"
                className={classNames(
                  'py-1.5 focus:z-10',
                  // same month, is after and is working ==> allow selective 
                  appDetails.isExtra || (isSameMonth(day, firstDayCurrentMonth) && !isBefore(day,today) && dayIsWorking) ? 'bg-white cursor-pointer hover:bg-gray-100' : 'bg-gray-50',
                  (!appDetails.isExtra && (isSameMonth(day, firstDayCurrentMonth) && isBefore(day,today) || !dayIsWorking)) && 'bg-gray-50 cursor-not-allowed',
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

  // Create a app details object that dynamically stores
  function handleAppDetails(e) {
    setAppDetails(prev => ({...prev, [e.target.name]: e.target.value}))
  }

  const handleServiceChange = (service) => {
    setAppDetails(prev => ({...prev, service: service.title}));
  }

  const handleBarberChange = (barber) => {
    setAppDetails(prev => ({...prev, barberUID: barber.uid, appDay: "", appStartTime: "", appEndTime: ""}));
  }


    const router = useRouter();

    // Form data state/logic
    const [formData, setFormData] = useState({});
    const [isDisabled, setisDisabled] = useState(true);

    const [pageData, setPageData] = useState([
        { name: 'Service', title: 'Select Service', current: true, breadcrumb: true},
        { name: 'Professional', title: 'Select Professional', current: false, breadcrumb: false},
        { name: 'Time', title: 'Select Time', current: false, breadcrumb: false},
        { name: 'Confirmation', title: 'Confirmation', current: false, breadcrumb: false},
      ]);

      console.log(formData)
    
    // functions

    const handleService = (data: any) => {
        setFormData(prevFormData => ({...prevFormData, service: data}))
        setPageData(prevPageData => {
            // Create a copy of the previous pageData array
            const newPageData = [...prevPageData];
            
            // Update the breadcrumb property of the specified index
            newPageData[1] = { ...newPageData[1], breadcrumb: true };
        
            // Return the updated pageData array
            return newPageData;
          });
    }

    const handleProfessional = (data: any) => {
        setFormData(prevFormData => ({...prevFormData, professional: data}))
        setPageData(prevPageData => {
            // Create a copy of the previous pageData array
            const newPageData = [...prevPageData];
            
            // Update the breadcrumb property of the specified index
            newPageData[2] = { ...newPageData[2], breadcrumb: true };
        
            // Return the updated pageData array
            return newPageData;
          });
    }

    const handleTime = (data: any) => {
        setFormData(prevFormData => ({...prevFormData, time: data}))
        setPageData(prevPageData => {
            // Create a copy of the previous pageData array
            const newPageData = [...prevPageData];
            
            // Update the breadcrumb property of the specified index
            newPageData[3] = { ...newPageData[3], breadcrumb: true };
        
            // Return the updated pageData array
            return newPageData;
          });
    }

    const handlePageChange = (page: number) => {
        // for breadcrumbs
        setPage(page)
        setPageData(pageData.map((item, index) => {
            if (index === page) {
                return {...item, current: true}
            } else {
                return {...item, current: false}
            }
        }))
    }

    const nextPage = (page: number) => {
        setPage(page => page + 1);
    }

    const handleSelectedDay = (day: any) => {
        setSelectedDay(day);
    }


    // Page state/logic
    const [page, setPage] = useState(0);
    const pages = [
        <Services key="services" data={formData} handleService={handleService}/>,
        <Professionals key="professionals" data={formData} handleProfessional={handleProfessional} />,
        <Times today={today} selectedDay={selectedDay} handleSelectedDay={handleSelectedDay} key="times" data={formData} handleTime={handleTime}/>,
        <Summary selectedDay={selectedDay} isDisabled={isDisabled} page={page} nextPage={nextPage} data={formData} />
    ]

    useEffect(() => {
        setPageData(pageData.map((item, index) => {
            if (index === page) {
                return {...item, current: true}
            } else {
                return {...item, current: false}
            }
        }))
    }, [page]);

    useEffect(() => {
        if (page === 0) {
            setisDisabled(true);
            if (formData.service) {
                setisDisabled(false);
            }
        } else if (page === 1) {
            setisDisabled(true);
            if (formData.professional) {
                setisDisabled(false);
            }
        } else if (page === 2) {
            setisDisabled(true);
            if (formData.time) {
                setisDisabled(false);
            }
        }
    }, [page, formData]);
    
    return (
        <>
        <div className="border-b border-slate ">
            <div className="flex flex- justify-between max-w-screen-xl mx-auto py-6 px-2">
                <div className="flex flex-row gap-x-5 items-center">
                    <button
                        onClick={() => {
                            if (page > 0) {
                                setPage(page => page - 1)
                            } else if (page === 0) {
                                router.push('/')
                            }
                            }
                        }
                        type="button"
                        className="inline-flex items-center gap-x-2 rounded-md bg-white px-3.5 py-2.5 text-sm font-semibold text-black hover:bg-gray-100"
                        >
                        <ArrowLeftIcon className="-ml-0.5 h-5 w-5" aria-hidden="true" />
                    </button>
                    <h1 className="text-black text-xl font-bold">Make a booking</h1>
                </div>
                {/* <Breadcrumbs page={page} pageData={pageData} handlePageChange={handlePageChange}/> */}
            </div> 
        </div>
        <div className="flex-1 justify-center max-w-screen-lg mx-auto px-4">
            <div className="flex flex-col py-10 justify-center gap-y-10">
                <Breadcrumbs page={page} pageData={pageData} handlePageChange={handlePageChange}/>
                <div className="flex flex-row justify-center gap-x-5 ">
                    <div className="w-2/3 flex flex-col gap-y-4  ">
                        <h1 className="text-black text-2xl font-bold">{pageData[page].title}</h1>
                        {pages[page]}
                    </div>
                    {page === 3 ? null : (
                        <div className="w-1/3">
                            <Summary selectedDay={selectedDay} isDisabled={isDisabled} page={page} nextPage={nextPage} data={formData}/>
                        </div>
                    )}
                </div>
            </div>
        </div>
        </>
    )
};

export default BookingPage;