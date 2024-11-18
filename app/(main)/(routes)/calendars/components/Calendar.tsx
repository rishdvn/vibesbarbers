'use client';

import { Fragment, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/20/solid';
import { format, isSameDay, isSameMonth, startOfDay } from 'date-fns';
import { useCalendar } from '../context';
import { Header } from './Header';
import { CalendarCanvas } from './CalendarCanvas';

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
  }
  

export function CalendarMultiView() {
  const { 
    view,
    setView,
    selectedDay,
    setSelectedDay,
    workingBarbers,
    appointments,
    selectedDayAppointments,
    timeSlots,
    businessHours
  } = useCalendar();

  const today = startOfDay(new Date());
  const [currentMonth, setCurrentMonth] = useState(format(today, 'MMM-yyyy'));

  return (
    <div className="flex flex-col h-full">
      <Header selectedDay={selectedDay} setSelectedDay={setSelectedDay} setView={setView} view={view} />
      
      <CalendarCanvas workingBarbers={workingBarbers} view={view} />
    </div>
  );
}