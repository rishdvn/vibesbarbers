'use server';

import React from 'react';
import Link from 'next/link';

const services = [
    {
      name: 'Haircut',
      time: '20mins',
      href: '#',
    },
    {
      name: 'Haircut & Beard',
      time: '40mins',
      imageUrl:
        'https://images.unsplash.com/photo-1519244703995-f4e0f30006d5?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
      href: '#',
    }
  ]
  
  export default function ServicesLanding() {
  return (
    <div>
      <ul role="list" className="divide-y divide-gray-100">
        {services.map((service) => (
          <li key={service.time} className="flex items-center justify-between gap-x-6 py-5">
            <div className="flex min-w-0 gap-x-4">
              <div className="flex flex-col min-w-0 gap-y-1">
                <p className="text-md font-semibold leading-6 text-gray-900">{service.name}</p>
                <p className="mt-1 truncate text-sm leading-5 text-gray-500">{service.time}</p>
              </div>
            </div>
            <Link
              href="/bookings"
              className="rounded-full bg-white px-2.5 py-1 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
            >
              Book now
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
