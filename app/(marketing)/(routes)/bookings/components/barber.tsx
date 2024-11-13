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
      <label className="block font-semibold leading-6 text-gray-900 sm:mt-1.5">
        <div className='flex flex-row gap-x-1'>
          <span className='text-red-600'>2.</span>
          BARBER
        </div>
      </label>
      <div className='grid grid-cols-3 gap-1 space-y-0'>
        {users.map((user) => (
          <div 
            key={user.uid} 
            className={'flex flex-col items-center rounded-lg cursor-pointer hover:bg-gray-50 border border-gray-200 p-3 gap-y-2 ' + (barber === user.uid ? 'ring-2 ring-offset-1 ring-blue-500' : '')}
            onClick={() => handleBarberChange(user)}
          >
            <div className='flex items-center justify-center w-12 h-12 rounded-3xl bg-green-200 text-xl font-medium'>
              <p>{user.firstname[0].toUpperCase()}</p>
            </div>
            {user.firstname}
          </div>
        ))}
      </div>
    </div>
  );
};

export default Barber;
