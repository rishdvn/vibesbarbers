"use client";

import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../src/index.ts";
import { useEffect, useState } from "react";

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

const users = [
    {
      firstname: 'yo',
      lastname: 'yoyo',
      email: 'hi',
      approved: true
    },

]


const weekDays = [
  "Mon", 
  "Tues",
  "Wed",
  "Thurs",
  "Fri",
  "Sat",
  "Sun"
]

  export default function BusinessSetting() {
    const [hours, setHours] = useState([]);    
    
    useEffect(() => {
      const unsubscribe = onSnapshot(collection(db, "businesshours"), (querySnapshot) => {
        const hoursFetched = [];
        querySnapshot.forEach((doc) => {
          hoursFetched.push(doc.data());
        });
        setHours(hoursFetched);
      });
  
      // Clean up the listener when the component unmounts
      return () => unsubscribe();
    }, []);

    console.log(hours)

    const [editing, isEditing] = useState(false);

    const tableHeading = (day) => {
      return (
        <th scope="col" className="px-3 py-3.5 text-left text-sm font-medium  sm:pl-0">
          {day}
        </th>
      )
    }

    return (
      <div className="pt-10 px-4 sm:px-6 lg:px-24 text-gray-900">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold leading-6 ">Business Details</h1>
          </div>
        </div>

        {/* Details */}
        <div
          className="pt-10 flex flex-col gap-y-2"
        >
          {/* <div className="flex flex-col gap-y-2">
            <label
              className="block text-md font-medium leading-6  sm:mt-1.5"
            >
              Business Name
            </label>
            {editing ? (
              <div className="flex flex-row gap-x-2">
                <input
                  type="text"
                  name="firstname"
                  id="User-name"
                  value="Vibes Barber"
                  className="text-sm block w-full rounded-md border-0 py-1.5  ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-sky-600 sm:text-sm sm:leading-6"
                />
                <button
                  className="text-sm px-4 rounded-lg bg-black hover:bg-gray-800 text-white"
                >
                  Save
                </button>
              </div>
            ) : (
              <div
                className="text-sm p-2 cursor-pointer rounded-lg  hover:bg-gray-50 select-none"
                onClick={() => isEditing(true)}
              >
                Vibes Barber
              </div>
            )}
          </div> */}

          {/* Working hours */}
          <div className="-mr-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <label
                htmlFor="User-name"
                className="block text-md font-medium leading-6  sm:mt-1.5"
              >
                Business Hours
              </label>
              <table className="min-w-full divide-y divide-gray-300 text-gray-700">
                <thead>
                  <tr>
                    {weekDays.map((day) => tableHeading(day))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                    <tr 
                    >
                      {hours.map((day) => (
                        <td
                          onClick={() => console.log("clicked")}
                          className="whitespace-nowrap py-2 pr-2 text-sm"
                          key={day}
                        >
                          <div
                            className="flex flex-col gap-y-1 h-16 p-3 select-none cursor-pointer text-xs font-normal rounded-lg bg-gray-50 hover:bg-gray-100"
                          > 
                            <span>
                            {`${day.start.hours}:${day.start.minutes}${day.start.period}`}
                            </span>
                            <span>
                            - {`${day.end.hours}:${day.end.minutes}${day.end.period}`}
                            </span>
                          </div>
                        </td>
                      ))}
                    </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Working hours */}
          <div className="mt-8 flow-root">
            <div className="-mr-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                <label
                  htmlFor="User-name"
                  className="block text-md font-medium leading-6  sm:mt-1.5"
                >
                  Business Closed Periods
                </label>
                
              </div>
            </div>
          </div>

        </div>
        
      </div>
    )
  }
  