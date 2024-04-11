"use client";

import { useState } from 'react';

export default function Profile({formSubmitted, user, updateDocByUid, setFormSubmitted}:{formSubmitted: boolean, user: any, updateDocByUid: Function, setFormSubmitted: Function}) {
    // user info
    const [userCredentials, setUserCredentials] = useState({firstname: '', lastname: ''})
    
    function handleUserCredentials(e) {
        return (
          setUserCredentials({...userCredentials, [e.target.name]: e.target.value})
        )
      }

    // handle Submit
    async function handleSubmit(e) {
        e.preventDefault();
        await updateDocByUid(user.uid, userCredentials);
        
        setFormSubmitted(true);
    }

  return (
    <div className="space-y-10 divide-y divide-gray-900/10">
      <div className="grid grid-cols-1 gap-x-8 gap-y-8 md:grid-cols-3">
        <h2 className="text-base font-semibold leading-7 text-gray-900">Personal Information</h2>
        <form className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
          <div className="px-4 py-6 sm:p-8">
            <div className="grid max-w-2xl grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
              <div className="sm:col-span-3">
                <label htmlFor="first-name" className="block text-sm font-medium leading-6 text-gray-900">
                  First name
                </label>
                <div className="mt-2">
                  <input
                    onChange={(e) => handleUserCredentials(e)}
                    type="text"
                    name="firstname"
                    id="firstname"
                    autoComplete="given-name"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="sm:col-span-3">
                <label htmlFor="last-name" className="block text-sm font-medium leading-6 text-gray-900">
                  Last name
                </label>
                <div className="mt-2">
                  <input
                    onChange={(e) => handleUserCredentials(e)}
                    type="text"
                    name="lastname"
                    id="lastname"
                    autoComplete="family-name"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="sm:col-span-4">
                <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                  Email address
                </label>
                <div className="mt-2">
                  <input
                    disabled
                    placeholder={user.email}
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              <div className="sm:col-span-4">
                <label htmlFor="role" className="block text-sm font-medium leading-6 text-gray-900">
                  Role
                </label>
                <div className="mt-2">
                  <select
                    onChange={(e) => handleUserCredentials(e)}
                    id="role"
                    name="role"
                    required
                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xs sm:text-sm sm:leading-6"
                  >
                    <option className="text-gray-500" value="">Select an option</option>
                    <option>Admin</option>
                    <option>Barber</option>
                    <option>Receptionist</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-end gap-x-6 border-t border-gray-900/10 px-4 py-4 sm:px-8">
            <button
              onClick={(e) => handleSubmit(e)}
              type="submit"
              disabled={formSubmitted}
              className="rounded-md disabled:bg-gray-300 bg-red-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              {formSubmitted ? "Access Requested" : "Request Access"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
