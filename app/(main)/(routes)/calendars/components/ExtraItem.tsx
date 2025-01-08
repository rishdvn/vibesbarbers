import { Menu } from '@headlessui/react';
import { addHours, startOfDay } from 'date-fns';
import { deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { useState, useEffect } from 'react';
import { db } from '@/src';
import { useCalendar } from '../context';
import { Appointment, AppointmentDoc } from '@/utils/schemas/Appointment';


function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
  }
  

interface ExtraItemProps {
  appointment: AppointmentDoc;
  color: 'blue' | 'red' | 'pink' | 'green' | 'indigo' | 'orange' | 'yellow';
}

const colorVariants = {
  completed: {
    blue: 'bg-blue-200',
    red: 'bg-red-200',
    pink: 'bg-pink-200',
    green: 'bg-green-200',
    indigo: 'bg-indigo-200',
    orange: 'bg-orange-200',
    yellow: 'bg-yellow-200',
  },
  todo: {
    blue: 'bg-blue-100',
    red: 'bg-red-100',
    pink: 'bg-pink-100',
    green: 'bg-green-100',
    indigo: 'bg-indigo-100',
    orange: 'bg-orange-100',
    yellow: 'bg-yellow-100',
  }
};

export const ExtraItem: React.FC<ExtraItemProps> = ({ appointment, color }) => {
  const appService = appointment.appDetails.service;
  const customerName = appointment.appDetails.firstname;
  const customerTel = appointment.appDetails.telNo;
  const isBreak = /Break$/.test(appService);
  const priceExists = !!appointment.appDetails.service;

  const [cancelToggle, setCancelToggle] = useState(false);
  const [priceToggle, setPriceToggle] = useState(false);
  const [priceObject, setPriceObject] = useState({
    service: "",
    product: ""
  });
  const [allowPriceSubmit, setAllowPriceSubmit] = useState(false);

  useEffect(() => {
    setAllowPriceSubmit(!!priceObject.service);
  }, [priceObject]);

  const handleCancel = async () => {
    await deleteDoc(doc(db, "appointments", appointment.id));
  };

  const handlePricePublish = async () => {
    await updateDoc(doc(db, "appointments", appointment.id), {
      service: priceObject.service,
      product: priceObject.product
    });
    setPriceToggle(false);
  };

  return (
    <Menu as="div" className="z-0 relative flex flex-col gap-y-2">
      {!cancelToggle && !priceToggle && (
        <Menu.Button as="div" className="flex">
          <li
            className={classNames(
              "h-24 cursor-pointer group flex flex-1 flex-col rounded-lg p-1 text-xs leading-5",
              priceExists ? colorVariants.completed[color] : colorVariants.todo[color]
            )}
          >
            <div className="flex flex-row justify-between">
              <div className="flex flex-row gap-x-1">
                {appointment.service && (
                  <p className="text-black">
                    <span className="font-semibold">S: </span>
                    <span>$</span>
                    <span>{appointment.service}</span>
                  </p>
                )}
                {appointment.product && (
                  <p className="text-black">
                    <span className="font-semibold">P: </span>
                    <span>$</span>
                    <span>{appointment.product}</span>
                  </p>
                )}
              </div>
            </div>
            <p className="font-semibold text-black">{customerName}</p>
            {customerTel && <p className="text-black">{`+61${customerTel}`}</p>}
            <p className={classNames(
              isBreak ? "text-white font-semibold" : "text-black"
            )}>
              {appService}
            </p>
          </li>
        </Menu.Button>
      )}

      {cancelToggle && (
        <div className="items-start bg-red-100 select-none group flex flex-1 flex-col gap-y-1 rounded-lg p-2 text-xs leading-5">
          <div>{isBreak ? "Are you sure?" : "Tell client you cancelled."}</div>
          <div className="flex flex-row gap-x-2">
            <button
              className="cursor-pointer font-medium rounded-md bg-white p-1"
              onClick={() => setCancelToggle(false)}
            >
              Exit
            </button>
            <button
              className="cursor-pointer font-medium rounded-md bg-red-300 p-1"
              onClick={handleCancel}
            >
              Cancel {isBreak ? "Break" : "Appointment"}
            </button>
          </div>
        </div>
      )}

      {priceToggle && (
        <div className="items-start bg-gray-100 select-none group flex-1 flex flex-col gap-y-2 rounded-lg p-2 text-xs leading-5 overflow-auto">
          <div className="flex w-full items-center flex-row gap-x-2 font-medium">
            <div>Service</div>
            <input
              type="number"
              onChange={(e) => setPriceObject({ ...priceObject, service: e.target.value })}
              min="0"
              className="p-1 w-full rounded-lg border border-gray-200 font-normal"
            />
          </div>
          <div className="flex w-full items-center flex-row gap-x-2 font-medium">
            <div>Product</div>
            <input
              type="number"
              onChange={(e) => setPriceObject({ ...priceObject, product: e.target.value })}
              min="0"
              className="p-1 w-full rounded-lg border border-gray-200 font-normal"
            />
          </div>
          <div className="flex w-full flex-row gap-x-2 justify-end">
            <button
              className="cursor-pointer font-medium rounded-md bg-white p-1"
              onClick={() => setPriceToggle(false)}
            >
              Exit
            </button>
            <button
              disabled={!allowPriceSubmit}
              className={classNames(
                "font-medium rounded-md p-1",
                allowPriceSubmit
                  ? "cursor-pointer bg-green-200 hover:bg-green-300"
                  : "text-gray-400 cursor-not-allowed bg-gray-200"
              )}
              onClick={handlePricePublish}
            >
              Save price
            </button>
          </div>
        </div>
      )}

      <Menu.Items className="z-50 flex flex-col divide-y divide-gray-100 absolute right-1 mt-1 text-xs bg-white rounded-lg border border-gray-100">
        <Menu.Item>
          {({ active }) => (
            <button
              className={classNames(
                "p-2 rounded-lg cursor-pointer",
                active ? "bg-gray-200" : ""
              )}
              onClick={() => setCancelToggle(true)}
            >
              Cancel {isBreak ? "Break" : "Appointment"}
            </button>
          )}
        </Menu.Item>
        {!isBreak && (
          <Menu.Item>
            {({ active }) => (
              <button
                className={classNames(
                  "p-2 rounded-lg cursor-pointer",
                  active ? "bg-gray-200" : ""
                )}
                onClick={() => setPriceToggle(true)}
              >
                Add price
              </button>
            )}
          </Menu.Item>
        )}
      </Menu.Items>
    </Menu>
  );
};
