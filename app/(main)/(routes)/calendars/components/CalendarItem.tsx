import { Menu } from '@headlessui/react';
import { addHours, differenceInMinutes, format, startOfDay } from 'date-fns';
import { deleteDoc, doc, Timestamp, updateDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { db } from '@/src';
import { useCalendar } from '../context';
import { AppointmentDoc, Appointment } from '@/utils/schemas/Appointment';




function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}
  

export const CalendarItem = ({appointment, color}: {appointment: AppointmentDoc, color: 'blue' | 'red' | 'pink' | 'green' | 'indigo' | 'orange' | 'yellow'}) => {
    const { selectedDay } = useCalendar();
    let dayStart;
    if (format(selectedDay, 'EEEE').toLowerCase() === "sunday") {
      dayStart = addHours(startOfDay(selectedDay),9)
    } else {
      dayStart = addHours(startOfDay(selectedDay),9)
    }
    const appStart = appointment.appDetails.appStartTime
    const appEnd = appointment.appDetails.appEndTime
    const appService = appointment.appDetails.service
    const customerName = appointment.appDetails.firstname
    const customerTel = appointment.appDetails.telNo
    const gridrow = (differenceInMinutes(appStart, dayStart) / 20) + 1
    const span = (differenceInMinutes(appEnd, appStart) / 20)
    const isBreak = appointment.appDetails.service === "20 Minute Break" || appointment.appDetails.service === "40 Minute Break" || appointment.appDetails.service === "60 Minute Break"
    const priceExists = appointment.appDetails.service ? true : false
    const tileColor = color ? color : "pink"
    const colorCompleted = {
      blue: 'bg-blue-200 ',
      red: 'bg-red-200',
      pink: 'bg-pink-200 ',
      green: 'bg-green-200 ',
      indigo: 'bg-indigo-200 ',
      orange: 'bg-orange-200 ',
      yellow: 'bg-yellow-200 ',
    }
    const colorTodo = {
      blue: 'bg-blue-100',
      red: 'bg-red-100',
      pink: 'bg-pink-100',
      green: 'bg-green-100',
      indigo: 'bg-indigo-100',
      orange: 'bg-orange-100',
      yellow: 'bg-yellow-100',
    }

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

    // const [isChecked, setIsChecked] = useState(false);

    async function handleCheckedPublish() {
      await updateDoc(doc(db, "appointments", appId), {
        isChecked: !appointment.isChecked
      })
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
                  isBreak ? "bg-black" : (priceExists ? `${colorCompleted[color]}` : `${colorTodo[color]}`)
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
                      <time dateTime={appStart.toString()}>{`${format(appStart, 'hh:mma')}-${format(appEnd, 'hh:mma')}`}</time>
                  </p>
                  <div>
                    <p 
                      className={classNames(
                        isBreak ? "text-white" : "text-black"
                      )}
                    >
                        {appointment.appDetails.service && (
                          <div>
                            <span className='font-semibold'>
                              S: 
                            </span>
                            <span>
                              ${appointment.service}
                            </span>
                            <span>
                              {appointment.appDetails.service}
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
          <div className="relative h-full w-full"
          key={appId + Math.random()}>
            <div className="absolute bottom-0 right-0 z-50 flex justify-end items-end p-2">
              <input
                type="checkbox"
                className="cursor-pointer"
                onClick={handleCheckedPublish}
                checked={appointment.isChecked}
              ></input>
            </div>
          </div>
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