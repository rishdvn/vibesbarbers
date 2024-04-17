/*
  This example requires some changes to your config:
  
  ```
  // tailwind.config.js
  module.exports = {
    // ...
    plugins: [
      // ...
      require('@tailwindcss/forms'),
    ],
  }
  ```
*/
import { Fragment, useEffect, useState } from 'react'
import { Listbox, Dialog, Transition } from '@headlessui/react'
import { CheckIcon, ChevronDownIcon } from '@heroicons/react/20/solid'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { LinkIcon, PlusIcon, QuestionMarkCircleIcon } from '@heroicons/react/20/solid'
import { collection, doc, getDocs, query, updateDoc, where } from 'firebase/firestore'
import { db } from '@/src/index.ts'

const statusOptions = [
    { title: 'Pending', description: 'This user does not have access to the portal.'},
    { title: 'Approved', description: 'This user has access to the portal.'},
  ]

  const roleOptions = [
    { title: 'Admin', description: 'User has complete control over portal.'},
    { title: 'Barber', description: 'User can view their schedule, add/remove clients, manage client financials and change their availability.'},
    { title: 'Receptionist', description: 'User can view their schedule, add/remove clients and manage client financials.'},
  ]

  function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
  }


export default function TeamFlyOver({flyOverOpen, setFlyOverOpen, user}:{flyOverOpen: boolean, setFlyOverOpen: Function, user: {}}) {
    // come back to this
    async function getDocIdByUid(uid) {
        const q = query(collection(db, "users"), where("uid", "==", uid));
        const querySnapshot = await getDocs(q);
        let docId = null;
        querySnapshot.forEach((doc) => {
          // doc.data() is never undefined for query doc snapshots
          docId = doc.id;
        });
        return docId;
      }
    
      async function updateDocByUid(uid, userCredentials) {
        const docId = await getDocIdByUid(uid);
        if (docId) {
          const userDoc = doc(db, "users", docId);
          await updateDoc(userDoc, userCredentials);
        } else {
          console.error("No document found with the given uid");
        }
      }

    const handleSubmit = () => {
        updateDocByUid(user.uid, userCredentials);
        setFlyOverOpen(false);
    }
    
    // Create a userCred object that dynamically stores
    const [userCredentials, setUserCredentials] = useState(user);

    console.log(userCredentials)

    const [allowSubmit, setAllowSubmit] = useState(false);

      
    useEffect(() => {
      if (userCredentials.firstname && (userCredentials.firstname.length === 0 || userCredentials.lastname.length === 0)) {
        setAllowSubmit(false)
      } else {
        setAllowSubmit(true)
      }
    },[userCredentials])


    function handleUserCredentials(e) {
        console.log({...userCredentials, [e.target.name]: e.target.value})
        setUserCredentials({...userCredentials, [e.target.name]: e.target.value})
      }

    // if leave without saving chnages, or change user
    useEffect(() => {
        setUserCredentials(user);
      }, [user, flyOverOpen]);

    const [selectedStatus, setSelectedStatus] = useState({});

    useEffect(() => {
        if (user.approved === false) {
            setSelectedStatus(statusOptions[0]);
        } else {
            setSelectedStatus(statusOptions[1]);
        }
    },
    [user])

    const handleStatusChange = (status) => {
      setSelectedStatus(status);
      setUserCredentials(prev => ({...prev, approved: status.title === "Approved" ? true : false}));
    }

    const [selectedRole, setSelectedRole] = useState({});

    const handleRoleChange = (role) => {
      setUserCredentials(prev => ({...prev, role: role.title}))
    }


    const handleColorChange = (color) => {
      setUserCredentials(prev => ({...prev, color: color}))
    }

    console.log(userCredentials)
   

  return (
    <Transition.Root show={flyOverOpen} as={Fragment}>
      <Dialog as="div" className="z-10" onClose={setFlyOverOpen}>
        <div className="fixed inset-0 overflow-hidden bg-black bg-opacity-50 z-10">
          <div className="overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0.5 right-0 flex pl-16">
              <Transition.Child
                as={Fragment}
                enter="transform transition ease-in-out duration-500 sm:duration-700"
                enterFrom="translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in-out duration-500 sm:duration-700"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full"
              >
                <Dialog.Panel className="pointer-events-auto w-screen rounded-l-md border-l border-y border-gray-200 max-w-md bg-gray-100">
                  <form className="flex h-full rounded-l-md flex-col overflow-y-scroll bg-white">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="bg-black px-4 py-9 sm:px-4">
                        <div className="flex items-center justify-between space-x-3">
                            <Dialog.Title className="text-base font-medium leading-6 text-white">
                              Edit details
                            </Dialog.Title>
                          <div className="flex h-7 items-center">
                            <button
                              type="button"
                              className="relative text-gray-400 hover:text-gray-500"
                              onClick={() => setFlyOverOpen(false)}
                            >
                              <span className="absolute -inset-2.5" />
                              <span className="sr-only">Close panel</span>
                              <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Divider container */}
                      <div className="text-xs flex flex-col gap-y-6 mt-4">
                        
                        {/* User first name */}
                        <div className="grid grid-cols-1 gap-2 space-y-0 px-4 ">
                          <label
                            className="block  font-medium leading-6 text-gray-900 sm:mt-1.5"
                          >
                            First Name
                          </label>
                          <div className="col-span-1">
                            <input
                              type="text"
                              value={userCredentials.firstname}
                              onChange={handleUserCredentials}
                              name="firstname"
                              id="User-name"
                              className=" block w-full rounded-md border-0 p-1.5 text-gray-900 ring-1 focus:outline-none ring-inset ring-gray-300 placeholder:text-gray-400 sm: sm:leading-6"
                            />
                          </div>
                        </div>

                        {/* User last name */}
                        <div className="grid grid-cols-1 gap-2 space-y-0 px-4 ">
                          <div>
                            <label
                              htmlFor="User-name"
                              className="block  font-medium leading-6 text-gray-900 sm:mt-1.5"
                            >
                              Last Name
                            </label>
                          </div>
                          <div className="col-span-1">
                            <input
                              type="text"
                              value={userCredentials.lastname}
                              onChange={handleUserCredentials}
                              name="lastname"
                              id="User-name"
                              className=" block w-full rounded-md border-0 p-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:outline-none sm: sm:leading-6"
                            />
                          </div>
                        </div>

                        {/* User email */}
                        <div className="grid grid-cols-1 gap-2 space-y-0 px-4 ">
                          <div>
                            <label
                              htmlFor="User-name"
                              className="block  font-medium leading-6 text-gray-900 sm:mt-1.5"
                            >
                              Email
                            </label>
                          </div>
                          <div className="col-span-1">
                            <input
                                disabled
                              type="text"
                              value={user ? user.email : ""}
                              name="User-email"
                              id="User-email"
                              className="select-none  block w-full rounded-md border-0 p-1.5 text-gray-600 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:outline-none sm: sm:leading-6"
                            />
                          </div>
                        </div>

                        {/* User status */}
                        <div className="grid grid-cols-1 gap-2 space-y-0 px-4 ">
                          <label
                            htmlFor="User-name"
                            className="block  font-medium leading-6 text-gray-900 sm:mt-1.5"
                          >
                            Role
                          </label>
                            <Listbox value={selectedStatus} onChange={handleRoleChange}>
                              {({ open }) => (
                                <>
                                <Listbox.Label className="sr-only">Change published status</Listbox.Label>
                                <div className="relative">
                                    <div className="inline-flex divide-x rounded-md divide-gray-800"
                                    >
                                        {/* List status */}
                                        <div className="select-none  font-medium inline-flex items-center gap-x-1.5 rounded-l-md px-3 py-2 bg-gray-50 text-gray-800">
                                          {userCredentials.role}
                                        </div>
                                        
                                        {/* List button */}
                                        <Listbox.Button className="inline-flex items-center rounded-l-none rounded-r-md p-2  focus:outline-none bg-gray-50 hover:bg-gray-200 ">
                                            <ChevronDownIcon className="h-5 w-5 text-gray-800" aria-hidden="true" />
                                        </Listbox.Button>
                                    </div>

                                    <Transition
                                      show={open}
                                      as={Fragment}
                                      leave="transition ease-in duration-100"
                                      leaveFrom="opacity-100"
                                      leaveTo="opacity-0"
                                    >
                                      <Listbox.Options className="absolute left-0 z-10 mt-2 w-72 origin-top-right divide-y divide-gray-200 overflow-hidden rounded-md bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                                          {roleOptions.map((option) => (
                                              <Listbox.Option
                                                  key={option.title}
                                                  className={({ active }) =>
                                                  classNames(
                                                      active ? 'bg-gray-50' : '',
                                                      'text-gray-800 text-medium cursor-default select-none p-4 '
                                                  )
                                                  }
                                                  value={option}
                                              >
                                                  {({ selectedStatus, active }) => (
                                                      <div className="flex flex-col">
                                                          <div className="flex justify-between">
                                                          <p className={selectedStatus ? 'font-medium': 'font-normal'}>{option.title}</p>
                                                          {selectedStatus ? (
                                                              <span className={active ? 'text-black' : 'text-gray-600'}>
                                                              </span>
                                                          ) : null}
                                                          </div>
                                                          <p 
                                                              className=" font-normal text-gray-600 mt-2"
                                                          >
                                                              {option.description}
                                                          </p>
                                                      </div>
                                                  )}
                                              </Listbox.Option>
                                          ))}
                                      </Listbox.Options>
                                    </Transition>
                                </div>
                                </>
                              )}
                            </Listbox>
                        </div>

                        {/* User status */}
                        <div className="grid grid-cols-1 gap-2 space-y-0 px-4 ">
                          <label
                            htmlFor="User-name"
                            className="block  font-medium leading-6 text-gray-900 sm:mt-1.5"
                          >
                            Status
                          </label>
                          <div className="col-span-1">
                            <Listbox value={selectedStatus} onChange={handleStatusChange}>
                                {({ open }) => (
                                    <>
                                    <Listbox.Label className="sr-only">Change published status</Listbox.Label>
                                    <div className="relative">
                                        <div className={classNames(
                                            "inline-flex divide-x rounded-md",
                                            (selectedStatus.title === "Pending") ? "divide-orange-800" : "divide-green-800"
                                        )}
                                        >
                                            {/* List status */}
                                            <div className={classNames(
                                                "inline-flex items-center gap-x-1.5 rounded-l-md px-3 py-2 ", 
                                                (selectedStatus.title === "Pending") ? "bg-orange-50 text-orange-800" : "bg-green-50 text-green-800"
                                            )}
                                            >
                                                <CheckIcon className="-ml-0.5 h-4 w-4" aria-hidden="true" />
                                                <p className="select-none  font-medium">{selectedStatus.title}</p>
                                            </div>
                                            
                                            {/* List button */}
                                            <Listbox.Button className={classNames(
                                                "inline-flex items-center rounded-l-none rounded-r-md p-2  focus:outline-none ",
                                                (selectedStatus.title === "Pending") ? "bg-orange-50 hover:bg-orange-200 " : "bg-green-50 hover:bg-green-200 "
                                            )}
                                            >
                                                <span className="sr-only">Change published status</span>
                                                <ChevronDownIcon className={classNames(
                                                    "h-5 w-5 ", 
                                                    (selectedStatus.title === "Pending") ? "text-orange-800" : "text-green-800"
                                                )}
                                                aria-hidden="true" />
                                            </Listbox.Button>
                                        </div>

                                        <Transition
                                        show={open}
                                        as={Fragment}
                                        leave="transition ease-in duration-100"
                                        leaveFrom="opacity-100"
                                        leaveTo="opacity-0"
                                        >
                                        <Listbox.Options className="absolute left-0 z-10 mt-2 w-72 origin-top-right divide-y divide-gray-200 overflow-hidden rounded-md bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                                            {statusOptions.map((option) => (
                                                <Listbox.Option
                                                    key={option.title}
                                                    className={({ active }) =>
                                                    classNames(
                                                        active ? 'bg-gray-50' : '',
                                                        'text-gray-800 text-medium cursor-default select-none p-4 '
                                                    )
                                                    }
                                                    value={option}
                                                >
                                                    {({ selectedStatus, active }) => (
                                                        <div className="flex flex-col">
                                                            <div className="flex justify-between">
                                                            <p className={selectedStatus ? 'font-medium': 'font-normal'}>{option.title}</p>
                                                            {selectedStatus ? (
                                                                <span className={active ? 'text-black' : 'text-gray-600'}>
                                                                </span>
                                                            ) : null}
                                                            </div>
                                                            <p 
                                                                className=" font-normal text-gray-600 mt-2"
                                                            >
                                                                {option.description}
                                                            </p>
                                                        </div>
                                                    )}
                                                </Listbox.Option>
                                            ))}
                                        </Listbox.Options>
                                        </Transition>
                                    </div>
                                    </>
                                )}
                            </Listbox>
                          </div>
                        </div>

                        {/* Colour */}
                        <div className="grid grid-cols-1 gap-2 space-y-0 px-4 ">
                          <label
                            htmlFor="User-name"
                            className="block  font-medium leading-6 text-gray-900 sm:mt-1.5"
                          >
                            Colour
                          </label>
                          <div className="grid grid-flow-col ">
                            {["blue", "red", "pink", "green", "indigo", "orange", "yellow"].map((color) => {
                                const colorVariants = {
                                  blue: 'bg-blue-200 hover:bg-blue-300 border-blue-600',
                                  red: 'bg-red-200 hover:bg-red-300 border-red-600',
                                  pink: 'bg-pink-200 hover:bg-pink-300 border-pink-600',
                                  green: 'bg-green-200 hover:bg-green-300 border-green-600',
                                  indigo: 'bg-indigo-200 hover:bg-indigo-300 border-indigo-600',
                                  orange: 'bg-orange-200 hover:bg-orange-300 border-orange-600',
                                  yellow: 'bg-yellow-100 hover:bg-yellow-300 border-yellow-600',
                                }
                              return (
                                <div
                                  onClick={() => handleColorChange(color)}
                                  key={color}
                                  className={classNames(
                                    `h-12 w-12 border-2 ${colorVariants[color]} rounded-lg cursor-pointer`,
                                    userCredentials.color === color ? "ring-2 ring-offset-1 ring-gray-300" : ""
                                  )}
                                ></div>
                              )
                            })}
                          </div>
                        </div>

                      </div>

                    </div>

                    {/* Action buttons */}
                    <div className="text-xs flex-shrink-0 px-4 py-2">
                      <div className="flex justify-end space-x-3">
                        <button
                          type="button"
                          className="rounded-md bg-white px-3 py-2  font-medium text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                          onClick={() => setFlyOverOpen(false)}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={!allowSubmit}
                          onClick={handleSubmit}
                          className={classNames(
                            "inline-flex justify-center rounded-md px-3 py-2", 
                            allowSubmit ? "cursor-pointer bg-black font-medium text-white hover:bg-gray-700" : "bg-gray-400 cursor-not-allowed font-medium text-white"
                          )}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}
