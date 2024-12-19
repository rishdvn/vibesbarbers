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
    <div className="grid grid-cols-1 gap-4 space-y-0">
                    <label className="block font-semibold leading-6 text-white sm:mt-1.5">
                        <div className='flex flex-row gap-x-1'>
                            <span className='text-red-600'>1.</span>
                            SERVICE
                        </div>
                    </label>
                    {Object.keys(services).map((serviceKey) => (
                        <div 
                            key={serviceKey} 
                            className={`
                                flex items-center justify-between
                                rounded-lg cursor-pointer border p-4
                                text-lg font-medium text-white
                                transition-all duration-200 ease-in-out
                                ${service === serviceKey 
                                    ? 'bg-green-600 border-green-400 shadow-md' 
                                    : 'bg-gray-800 border-gray-700 hover:bg-gray-700 hover:border-green-500'}
                            `}
                            onClick={() => onChange(serviceKey)}
                        >
                            <span>{serviceKey}</span>
                        </div>
                    ))}
                </div>
  );
};

export default Service;
