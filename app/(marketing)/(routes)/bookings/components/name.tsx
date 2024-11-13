import React from 'react';

interface NameProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Name: React.FC<NameProps> = ({ value, onChange }) => {
  return (
    <div className="grid grid-cols-1 gap-1 space-y-0">
      <label className="block font-semibold leading-6 text-gray-900 sm:mt-1.5">
        <div className='flex flex-row gap-x-1'>
          <span className='text-red-600'>5.</span>
          NAME
        </div>
      </label>
      <div className="col-span-1">
        <input
          type="text"
          value={value}
          onChange={onChange}
          name="firstname"
          id="User-name"
          className="block w-full rounded-md border-0 p-1 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-sky-600 sm:leading-6"
        />
      </div>
    </div>
  );
};

export default Name;
