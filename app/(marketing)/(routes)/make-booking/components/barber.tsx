'use client'
import React from 'react';
// import classNames from 'classnames';

const LoadingBarbers = () => (
  <div className="space-y-2">
      {[1, 2, 3, 4].map((i) => (
          <div 
              key={i}
              className="h-10 bg-gray-800 animate-pulse rounded-lg"
          />
      ))}
  </div>
);

interface BarberProps {
  users: { uid: string; firstname: string }[];
  barber: string;
  handleBarberChange: (barber: { uid: string; firstname: string }) => void;
  isLoading?: boolean;
}

const Barber: React.FC<BarberProps> = ({ isLoading, users, barber, handleBarberChange }) => {
  return (
    <div className="grid grid-cols-1 gap-1 space-y-0">
      <label className="block font-semibold leading-6 text-gray-100 sm:mt-1.5">
        {(users.length === 0 && !isLoading) ? null :
          <div className='flex flex-row gap-x-1'>
            <span className='text-red-500'>2.</span>
            BARBER
            <span className='font-medium'>(Can take up to 15 seconds to load)</span>
          </div>
        }
      </label>
      {isLoading ? <LoadingBarbers /> :
        <div className="flex gap-4 overflow-x-auto pb-2 w-full" id="scrollbar-style1">
          <div className="flex min-w-max gap-4">
            {users.map((item) => {
              const user = item.user
              return (
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
              )
            })}
          </div>
        </div>
      }
    </div>
  );
};

export default Barber;
