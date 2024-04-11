import { addDays, eachDayOfInterval, format, isEqual, startOfDay } from "date-fns";
import { useState } from "react";

const times = [
    '9:00AM', 
    '10:00AM',
    '11:00AM',
    '12:00PM',
    '1:00PM',
    '2:00PM',
    '3:00PM',
  ]

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
  }

  export default function Times({today, selectedDay, handleSelectedDay, handleTime, data}: {today: any, selectedDay: any, handleSelectedDay: any, handleTime: any, data: any}) {
    console.log(today)
    
    let mobileInterval = eachDayOfInterval({
        start: addDays(selectedDay, -1),
        end: addDays(selectedDay, 5)
    });

    return (
      <div className="flex flex-col gap-y-3">
        <div
            className="sticky top-0 z-10 grid flex-none grid-cols-7 bg-white text-gray-500"
          >
            {mobileInterval.map((day) => (
              <button 
                onClick={() => handleSelectedDay(day)}
                key={day.date}
                type="button" 
                className="flex flex-col items-center pb-3 pt-3"
              >
                <span
                    className="text-xs font-medium text-gray-900"
                >{format(day, 'EEEEE')}</span>
                {/* Default: "text-gray-900", Selected: "bg-gray-900 text-white", Today (Not Selected): "text-red-500", Today (Selected): "bg-red-500 text-white" */}
                <span className={classNames(
                    "mt-3 flex h-12 w-12 items-center justify-center rounded-full text-base font-semibold text-gray-900", 
                    isEqual(day, selectedDay) && 'bg-gray-900 text-white',
                    isEqual(day, today) && 'text-red-500',
                    isEqual(day, today) && isEqual(day, selectedDay) && 'bg-red-500 text-white'
                )}>
                  {format(day, 'd')}
                </span>
              </button>
            ))}
          </div>
        {times.map((time) => (
          <div
            onClick={() => {handleTime(time)}}
            key={time}
            className={classNames(
                "relative flex items-center rounded-lg border border-gray-300 bg-white px-3 py-3 shadow-sm hover:border-gray-400",
                data.time === time ? 'ring-2 ring-indigo-500 ring-offset-2' : ''
              )}
          >
            <div className="min-w-0 flex-1">
              <a href="#" className="focus:outline-none flex flex-col gap-y-1">
                <span className="absolute inset-0" aria-hidden="true" />
                <p className="text-sm font-medium text-gray-900">{`${time}`}</p>
              </a>
            </div>
          </div>
        ))}
      </div>
    )
  }
  