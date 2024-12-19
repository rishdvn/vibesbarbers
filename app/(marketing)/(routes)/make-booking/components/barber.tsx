'use client'
import React from 'react';
// import classNames from 'classnames';

interface BarberProps {
  users: { uid: string; firstname: string }[];
  barber: string;
  handleBarberChange: (barber: { uid: string; firstname: string }) => void;
}

const Barber: React.FC<BarberProps> = ({ users, barber, handleBarberChange }) => {
  return (
    <div className="grid grid-cols-1 gap-1 space-y-0">
      <label className="block font-semibold leading-6 text-gray-100 sm:mt-1.5">
        <div className='flex flex-row gap-x-1'>
          <span className='text-red-500'>2.</span>
          BARBER
        </div>
      </label>
      <div className="flex gap-4 overflow-x-auto pb-2 w-full" id="scrollbar-style1">
        <div className="flex min-w-max gap-4">
          {users.map((user) => (
            <button
              key={user.uid}
              onClick={(event) => 
                {
                  event.preventDefault();
                  handleBarberChange(user)
                }}
              className={`
                w-28 h-28 
                rounded-full 
                border-2 
                flex flex-col 
                items-center 
                justify-center 
                transition-all
                flex-shrink-0
                text-gray-100
                ${barber === user.uid
                  ? 'border-green-500 bg-green-700 text-gray-100' 
                  : 'border-gray-700 hover:border-gray-600 bg-gray-800'
                }
              `}
            >
              <span className="text-2xl font-bold mb-1">{user.firstname[0].toUpperCase()}</span>
              <span className="text-sm font-medium">{user.firstname}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Barber;
