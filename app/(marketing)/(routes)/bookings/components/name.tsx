import React from 'react';

interface NameProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const Name: React.FC<NameProps> = ({ value, onChange }) => {
  // Split the incoming value into first and last name
  const [firstName, setFirstName] = React.useState(() => value.split(' ')[0] || '');
  const [lastName, setLastName] = React.useState(() => value.split(' ')[1] || '');

  // Update both local state and parent state
  const handleNameChange = (type: 'first' | 'last', inputValue: string) => {
    const newFirstName = type === 'first' ? inputValue : firstName;
    const newLastName = type === 'last' ? inputValue : lastName;
    
    setFirstName(newFirstName);
    setLastName(newLastName);
    
    // Combine names and trigger the parent onChange
    const fullName = `${newFirstName}${newLastName ? ' ' + newLastName : ''}`;
    onChange({ target: { value: fullName } } as React.ChangeEvent<HTMLInputElement>);
  };

  return (
    <div className="grid grid-cols-1 gap-1 space-y-0">
      <label className="block font-semibold leading-6 text-gray-900 sm:mt-1.5">
        <div className='flex flex-row gap-x-1'>
          <span className='text-red-600'>5.</span>
          NAME
        </div>
      </label>
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={firstName}
          onChange={(e) => handleNameChange('first', e.target.value)}
          name="firstname"
          id="User-firstname"
          placeholder="First Name"
          className="block w-full rounded-md border-0 p-1 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-sky-600 sm:leading-6"
        />
        <input
          type="text"
          value={lastName}
          onChange={(e) => handleNameChange('last', e.target.value)}
          name="lastname"
          id="User-lastname"
          placeholder="Last Name"
          className="block w-full rounded-md border-0 p-1 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-sky-600 sm:leading-6"
        />
      </div>
    </div>
  );
};

export default Name;
