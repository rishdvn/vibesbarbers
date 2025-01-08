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
    <button
      onClick={(event) => {
        event.preventDefault();
        onSelectDay(day);
      }}
      disabled={!isWorking}
      className={`
        w-24 h-24
        rounded-full
        border-2
        flex flex-col
        items-center
        justify-center
        transition-all
        flex-shrink-0
        ${isSelected
          ? 'border-green-500 bg-green-700 text-gray-100'
          : isWorking
            ? 'border-gray-700 hover:border-gray-600 bg-gray-800 text-gray-100'
            : 'border-gray-800 bg-gray-900 text-gray-500 cursor-not-allowed'
        }
      `}
    >
      <span className="text-sm font-medium">{format(day, 'MMM')}</span>
      <span className="text-3xl font-bold my-1">{format(day, 'd')}</span>
      <span className="text-sm font-medium">{format(day, 'EEE')}</span>
    </button>
  );
};

export default DayItem;