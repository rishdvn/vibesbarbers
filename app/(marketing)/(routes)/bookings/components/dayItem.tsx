'use client'
import React from 'react';
import { format, isSameDay } from 'date-fns';
import { TZDate } from '@date-fns/tz';

interface DayItemProps {
  day: TZDate;
  isWorking: boolean;
  isSelected: boolean;
  onSelectDay: (day: TZDate) => void;
}

const TIMEZONE = 'Australia/Sydney'; // AEST/AEDT timezone

const DayItem: React.FC<DayItemProps> = ({ day, isWorking, isSelected, onSelectDay }) => {
  return (
    <div className='flex flex-col items-center justify-center gap-y-1'>
      <div>{format(day, "EEEEE")}</div>
      <button
        className={`flex items-center justify-center h-14 w-14 rounded-3xl flex-shrink-0 text-md font-semibold ${isWorking ? 'bg-gray-200 cursor-pointer hover:bg-gray-100' : 'bg-gray-50 cursor-not-allowed'} ${isSelected ? 'ring-2 ring-offset-1 ring-blue-500' : ''}`}
        onClick={(event) => {
          event.preventDefault();
          onSelectDay(day);
        }}
        disabled={!isWorking}
      >
        {format(day, "d")}
      </button>
    </div>
  );
};

export default DayItem;