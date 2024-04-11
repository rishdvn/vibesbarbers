"use client";

import { Fragment, useEffect, useRef, useState } from 'react'
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, EllipsisHorizontalIcon } from '@heroicons/react/20/solid'
import { Menu, Transition } from '@headlessui/react'
import { add, addDays, addHours, addMinutes, differenceInMinutes, eachDayOfInterval, endOfMonth, endOfWeek, format, formatDistance, getDay, isEqual, isSameDay, isSameMonth, parse, parseISO, startOfDay, startOfWeek } from 'date-fns';
import AppFlyOver from './appflyover';


const appointments = [
  {
    id: 1,
    name: 'Rishabh Dhawan',
    type: 'Haircut',
    startDatetime: '2024-03-14T09:00',
    endDatetime: '2024-03-14T09:20',
  },
  {
    id: 2,
    name: 'Sanjit Naimbir',
    type: 'Haircut',
    startDatetime: '2024-03-14T09:20',
    endDatetime: '2024-03-14T09:40',
  },
  {
    id: 3,
    name: 'Sreerag Sreekumar',
    type: 'Haircut and Beard',
    startDatetime: '2024-03-14T09:40',
    endDatetime: '2024-03-14T10:20',
  },
  {
    id: 4,
    name: 'Vince',
    type: 'Haircut',
    startDatetime: '2024-03-14T10:40',
    endDatetime: '2024-03-14T11:00',
  },
  {
    id: 5,
    name: 'Vince',
    type: 'Haircut',
    startDatetime: '2024-03-14T10:40',
    endDatetime: '2024-03-14T11:00',
  },
  {
    id: 6,
    name: 'Panchali',
    type: 'Nails',
    startDatetime: '2024-03-14T09:00',
    endDatetime: '2024-03-14T10:00',
  },
  {
    id: 7,
    name: 'Patrick',
    type: 'Hair',
    startDatetime: '2024-02-20T10:00',
    endDatetime: '2024-02-20T10:20',
  },
]

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}


export default function DayView() {
  const container = useRef(null)
  const containerNav = useRef(null)
  const containerOffset = useRef(null)

  const today = startOfDay(new Date())
  const [selectedDay, setSelectedDay] = useState(today);
  const [currentMonth, setCurrentMonth] = useState(format(today,'MMM-yyyy'));
  let firstDayCurrentMonth = parse(currentMonth, 'MMM-yyyy', new Date())

  let selectedDayApps = appointments.filter((appointment) => isSameDay(parseISO(appointment.startDatetime), selectedDay))

  let days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth))
});

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

  function availableSlots() {
    let dayStart = addHours(startOfDay(selectedDay),9)
    for (let i = 0; i < (daySlots -1); i++) {
      let slot = [addMinutes(dayStart, (i - 1) * 20), addMinutes(dayStart, i * 20)]
    }
  }
  
  availableSlots()

  function changeSelectedDay(day: string) {
    if (format(selectedDay, 'MM') === format(day, 'MM')) {
      setSelectedDay(day)
    } else {
      setSelectedDay(day)
      setCurrentMonth(format(day, 'MMM-yyyy'))
    }
  }

  function nextMonth() {
      let firstDayNextMonth = add(firstDayCurrentMonth, {months: 1})
      setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'))
  }

  function prevMonth() {
      let firstDayNextMonth = add(firstDayCurrentMonth, {months: -1})
      setCurrentMonth(format(firstDayNextMonth, 'MMM-yyyy'))
  }

  const CalendarItem = (appointment: object) => {
    const dayStart = addHours(startOfDay(selectedDay),9)
    const appStart = parseISO(appointment.startDatetime)
    const appEnd = parseISO(appointment.endDatetime)
    const gridrow = (differenceInMinutes(appStart, dayStart) / 20) + 1
    const span = (differenceInMinutes(appEnd, appStart) / 20)
  
    return (
        <li className="relative mt-px flex" style={{ gridRow: ` ${gridrow} / span ${span}`}}>
          <a
          href="#"
          className="group absolute inset-1 flex flex-row gap-x-3 overflow-y-auto rounded-lg bg-pink-50 p-2 text-xs leading-5 hover:bg-pink-100"
          >
          <p className="order-1 font-semibold text-pink-700">{appointment.name}</p>
          <p className="order-1 text-pink-500 group-hover:text-pink-700">
              {appointment.type}
          </p>
          <p className="text-pink-500 group-hover:text-pink-700">
              <time dateTime={appointment.startDatetime}>{`${format(parseISO(appointment.startDatetime), 'hh:mm a')} - ${format(parseISO(appointment.endDatetime), 'hh:mm a')} `}</time>
          </p>
          </a>
        </li>
    )
  }

  const CalendarRow = (time: string) => {
    return (
        <>
          <div>
            <div className="sticky left-0 -ml-14 -mt-2.5 w-14 pr-2 text-right text-xs leading-5 text-gray-400">
              {time.time}
            </div>
          </div>
          <div/>
          <div/>
        </>
    )
  
  }

  let mobileInterval = eachDayOfInterval({
    start: addDays(selectedDay, -3),
    end: addDays(selectedDay, 3)
  });


  const [ flyOverOpen, setFlyOverOpen]  = useState(false);

  const [selectedUser, setSelectedUser] = useState({});

  const handleRowClick = (user) => {
    setSelectedUser(user);
    setFlyOverOpen(true);
  }

  const Calendar = () => {
    return (
    <div className="isolate flex flex-auto overflow-y-auto h-full bg-white">
          
          <div ref={container} className="flex flex-auto flex-col overflow-y-auto">
            <div
              ref={containerNav}
              className="sticky top-0 z-10 grid flex-none grid-cols-7 bg-white text-xs text-gray-500  ring-1 ring-black ring-opacity-5 md:hidden"
            >
              {mobileInterval.map((day) => (
                <button 
                  onClick={() => setSelectedDay(day)}
                  key={day.date}
                  type="button" 
                  className="flex flex-col items-center pb-1.5 pt-3"
                >
                  <span>{format(day, 'EEEEE')}</span>
                  {/* Default: "text-gray-900", Selected: "bg-gray-900 text-white", Today (Not Selected): "text-red-500", Today (Selected): "bg-black text-white" */}
                  <span className={classNames(
                      "mt-3 flex h-8 w-8 items-center justify-center rounded-full text-base font-semibold text-gray-900", 
                      isEqual(day, selectedDay) && 'bg-gray-900 text-white',
                      isEqual(day, today) && 'text-red-500',
                      isEqual(day, today) && isEqual(day, selectedDay) && 'bg-black text-white'
                  )}>
                    {format(day, 'd')}
                  </span>
                </button>
              ))}
            </div>
            <div className="flex w-full flex-auto">
              <div className="w-14  flex-none bg-white ring-1 ring-gray-100 " />
              <div className="flex-auto">
                <div className="h-5 border-b-2 border-gray-100" />
                <div className="grid flex-auto grid-cols-1 grid-rows-1">
                  {/* Horizontal lines */}
                  <div
                    className="col-start-1 col-end-2 row-start-1 grid divide-y divide-gray-100"
                    style={{ gridTemplateRows: `4.5rem repeat(${daySlots}, minmax(4.5rem, 1fr))` }}
                  >
                    {dayTiming.map((time) => (
                      <CalendarRow key={time} time={time}/>
                    ))}
                  </div>
  
                  {/* Events */}
                  <ol
                    className="col-start-1 col-end-2 row-start-1 grid grid-cols-1"
                    style={{ gridTemplateRows: `4.5rem repeat(${daySlots}, minmax(4.5rem, 1fr)) auto` }}
                  >
                    {selectedDayApps.map((appointment) => 
                      <CalendarItem key={appointment.id} {...appointment}/>
                    )}
                  </ol>
                </div>
              </div>
            </div>
          </div>
          <div className="hidden w-1/2 max-w-md flex-none border-l border-gray-100 px-8 py-10 md:block">
            <div className="flex items-center text-center text-gray-900">
              <button
                onClick={prevMonth}
                type="button"
                className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Previous month</span>
                <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
              </button>
              <div className="flex-auto text-xs font-semibold">{format(currentMonth, 'MMMM yyyy')}</div>
              <button
                onClick={nextMonth}
                type="button"
                className="-m-1.5 flex flex-none items-center justify-center p-1.5 text-gray-400 hover:text-gray-500"
              >
                <span className="sr-only">Next month</span>
                <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
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
            <div className="isolate mt-2 grid grid-cols-7 gap-px rounded-lg bg-gray-200 text-xs  ring-1 ring-gray-200">
              {days.map((day, dayIdx) => (
                  <button
                    onClick={() => changeSelectedDay(day)}
                    key={day.date}
                    type="button"
                    className={classNames(
                      'py-1.5 hover:bg-gray-100 focus:z-10',
                      isSameMonth(day, firstDayCurrentMonth) ? 'bg-white' : 'bg-gray-50',
                      (isEqual(day, selectedDay) || isEqual(day, today)) && 'font-semibold',
                      isEqual(day, selectedDay) && 'text-white',
                      !isEqual(day, selectedDay) && isSameMonth(day, firstDayCurrentMonth) && !isEqual(day, today) && 'text-gray-900',
                      !isEqual(day, selectedDay) && !isSameMonth(day, firstDayCurrentMonth) && !isEqual(day, today) && 'text-gray-400',
                      isEqual(day, today) && !isEqual(day, selectedDay) && 'text-red-500',
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
                        isEqual(day, selectedDay) && isEqual(day, today) && 'bg-black',
                        isEqual(day, selectedDay) && !isEqual(day, today) && 'bg-gray-900'
                      )}
                    >
                      {format(day,'d')}
                    </time>
                  </button>
              ))}
            </div>
          </div>
        </div>
    )
  }

  useEffect(() => {
    // Set the container scroll position based on the current time.
    const currentMinute = new Date().getHours() * 60
    if (container.current && containerNav.current && containerOffset.current) {
      container.current.scrollTop =
        ((container.current.scrollHeight - containerNav.current.offsetHeight - containerOffset.current.offsetHeight) *
          currentMinute) /
        1440
    }
  }, [])

  return (
    <div 
      className="h-full flex flex-col"
    >
      <header className="bg-white z-10 sticky top-0 flex flex-none items-center justify-between border-b border-gray-200 px-6 py-4">
        <div>
          <h1 className="text-base font-semibold leading-6 text-gray-900">
            <time dateTime="2022-01-22" className="sm:hidden">
              {format(selectedDay, 'MMM d, yyyy')}
            </time>
            <time dateTime="2022-01-22" className="hidden sm:inline">
              {format(selectedDay, 'MMM d, yyyy')}
            </time>
          </h1>
          <p className="mt-1 text-xs text-gray-500">{format(selectedDay, 'EEEE')}</p>
        </div>
        <div className="flex items-center">
          <div className="relative flex items-center rounded-md bg-white -sm md:items-stretch">
            <button
              onClick={() => setSelectedDay(addDays(selectedDay, -1))}
              type="button"
              className="flex h-9 w-12 items-center justify-center rounded-l-md border-y border-l border-gray-300 pr-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pr-0 md:hover:bg-gray-50"
            >
              <span className="sr-only">Previous day</span>
              <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="hidden border-y border-gray-300 px-4.5 text-xs font-semibold text-gray-900 hover:bg-gray-50 focus:relative md:block"
            >
             {format(selectedDay, 'MMM d, yyyy')}
            </button>
            <span className="relative -mx-px h-5 w-px bg-gray-300 md:hidden" />
            <button
              onClick={() => setSelectedDay(addDays(selectedDay, 1))}
              type="button"
              className="flex h-9 w-12 items-center justify-center rounded-r-md border-y border-r border-gray-300 pl-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pl-0 md:hover:bg-gray-50"
            >
              <span className="sr-only">Next day</span>
              <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
          <div className="hidden md:ml-4 md:flex md:items-center">
            <Menu as="div" className="relative">
              <Menu.Button
                type="button"
                className="flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-xs font-semibold text-gray-900 -sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              >
                Day view
                <ChevronDownIcon className="-mr-1 h-5 w-5 text-gray-400" aria-hidden="true" />
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 z-10 mt-3 w-36 origin-top-right overflow-hidden rounded-md bg-white -lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <a
                          href="#"
                          className={classNames(
                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                            'block px-4 py-2 text-xs'
                          )}
                        >
                          Day view
                        </a>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <a
                          href="#"
                          className={classNames(
                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                            'block px-4 py-2 text-xs'
                          )}
                        >
                          Week view
                        </a>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <a
                          href="#"
                          className={classNames(
                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                            'block px-4 py-2 text-xs'
                          )}
                        >
                          Month view
                        </a>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <a
                          href="#"
                          className={classNames(
                            active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                            'block px-4 py-2 text-xs'
                          )}
                        >
                          Year view
                        </a>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
            <div className="ml-6 h-6 w-px bg-gray-300" />
            <button
              type="button"
              className="ml-6 rounded-md bg-black px-3 py-2 text-xs font-semibold text-white -sm hover:bg-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Add event
            </button>
          </div>
          <Menu as="div" className="relative ml-6 md:hidden">
            <Menu.Button className="-mx-2 flex items-center rounded-full border border-transparent p-2 text-gray-400 hover:text-gray-500">
              <span className="sr-only">Open menu</span>
              <EllipsisHorizontalIcon className="h-5 w-5" aria-hidden="true" />
            </Menu.Button>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-3 w-36 origin-top-right divide-y divide-gray-100 overflow-hidden rounded-md bg-white -lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="#"
                        className={classNames(
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                          'block px-4 py-2 text-xs'
                        )}
                      >
                        Create event
                      </a>
                    )}
                  </Menu.Item>
                </div>
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <a
                      onClick={() => setSelectedDay(today)}
                      href="#"
                        className={classNames(
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                          'block px-4 py-2 text-xs'
                        )}
                      >
                        Go to today
                      </a>
                    )}
                  </Menu.Item>
                </div>
                <div className="py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="#"
                        className={classNames(
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                          'block px-4 py-2 text-xs'
                        )}
                      >
                        Day view
                      </a>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="#"
                        className={classNames(
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                          'block px-4 py-2 text-xs'
                        )}
                      >
                        Week view
                      </a>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="#"
                        className={classNames(
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                          'block px-4 py-2 text-xs'
                        )}
                      >
                        Month view
                      </a>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="#"
                        className={classNames(
                          active ? 'bg-gray-100 text-gray-900' : 'text-gray-700',
                          'block px-4 py-2 text-xs'
                        )}
                      >
                        Year view
                      </a>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </header>
      
      <div
        className='text-black flex-grow overflow-y-auto'
      >
        <Calendar />
      </div>

    </div>
  )
}

