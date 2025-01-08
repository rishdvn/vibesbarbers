import React from 'react';

interface NameProps {
  value: { firstname: string; lastname: string };
  onChange: (e: { firstname: string; lastname: string }) => void;
}

const Name: React.FC<NameProps> = ({ value, onChange }) => {
  // Direct event handlers
  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange({
      firstname: newValue,
      lastname: value.lastname
    });
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange({
      firstname: value.firstname,
      lastname: newValue
    });
  };

  return (
    <div className="grid grid-cols-1 gap-1 space-y-0">
      <label className="block font-semibold leading-6 text-gray-100 sm:mt-1.5">
        <div className='flex flex-row gap-x-1'>
          <span className='text-red-500'>5.</span>
          NAME
        </div>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={value.firstname}
          onChange={handleFirstNameChange}
          name="firstname"
          id="User-firstname"
          placeholder="First Name"
          className="block w-full rounded-md border-0 p-1 text-gray-100 bg-gray-800 ring-1 ring-inset ring-gray-700 placeholder:text-gray-500 focus:ring-1 focus:ring-inset focus:ring-green-700 sm:leading-6"
        />
        <input
          type="text"
          value={value.lastname}
          onChange={handleLastNameChange}
          name="lastname"
          id="User-lastname"
          placeholder="Last Name"
          className="block w-full rounded-md border-0 p-1 text-gray-100 bg-gray-800 ring-1 ring-inset ring-gray-700 placeholder:text-gray-500 focus:ring-1 focus:ring-inset focus:ring-green-700 sm:leading-6"
        />
      </div>
    </div>
  );
};

export default Name;
