import React from 'react';

interface ServiceProps {
  service: string;
  onChange: (service: string) => void;
  services: { [key: string]: number };
}

const Service: React.FC<ServiceProps> = ({ service, onChange, services }) => {
  const handleServiceSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedService = e.target.value;
    onChange(selectedService);
  };

  return (
    <div className="grid grid-cols-1 gap-1 space-y-0">
                    <label
                        className="block font-semibold leading-6 text-gray-900 sm:mt-1.5"
                    >
                        <div className='flex flex-row gap-x-1'>
                          <span className='text-red-600'>
                            1.
                          </span>
                          SERVICE
                        </div>
                    </label>
                    {Object.keys(services).map((serviceKey) => (
                        <div 
                            key={serviceKey} 
                            className={
                                'flex rounded-lg cursor-pointer hover:bg-gray-50 border border-gray-200 p-3 ' +
                                (service === serviceKey ? 'ring-2 ring-offset-1 ring-blue-500' : '')
                            }
                            onClick={() => onChange(serviceKey)}
                        >
                            {serviceKey}
                        </div>
                    ))}
                </div>
  );
};

export default Service;
