"use client";

import { ReactNode, useEffect } from "react";
import { Fragment, useState } from 'react'
import { Menu, Dialog, Transition } from '@headlessui/react'
import {
  Bars3Icon,
  CalendarIcon,
  CalendarDaysIcon,
  Cog6ToothIcon,
  DocumentDuplicateIcon,
  ShoppingBagIcon,
  HomeIcon,
  UserIcon,
  UsersIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useUserAuth } from "@/src/context/AuthContext";

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

export default function Sidebar({children}:{children:ReactNode}) {
  const { user, userProfile, signUserOut } = useUserAuth();
  
  const router = useRouter();
  const pathName = usePathname();
  const pathNameSlice = pathName.slice(1);

  const imageSize = 50;
  const navWidth = 60;
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [navItems, setNavItems] = useState(
    [
      // { name: 'Home', href: '/home', icon: HomeIcon, current: pathNameSlice === "home" },
      // { name: 'My Calendar', href: '/calendar', icon: CalendarIcon, current: pathNameSlice === "calendar" },
      { name: 'Calendar', href: '/calendar', icon: CalendarDaysIcon, current: pathNameSlice === "calendar" },
      // { name: 'Tally', href: '/tally', icon: ShoppingBagIcon, current: pathNameSlice === "tally" },
      // { name: 'Sales', href: '/sales', icon: DocumentDuplicateIcon, current: pathNameSlice === "sales" },
      // { name: 'Team', href: '/team', icon: UsersIcon, current: pathNameSlice === "team" },
      // { name: 'Schedule', href: '/schedule', icon: DocumentDuplicateIcon, current: pathNameSlice === "schedule" },
      // { name: 'Business Setting', href: '/setting', icon: Cog6ToothIcon, current: pathNameSlice === "setting" },
    ]
  )

  useEffect(() => {
    if (userProfile) {
      if (userProfile.role === "Admin") {
        setNavItems([
          { name: 'Calendar', href: '/calendar', icon: CalendarDaysIcon, current: pathNameSlice === "calendar" },
          { name: 'Tally', href: '/tally', icon: ShoppingBagIcon, current: pathNameSlice === "tally" },
          { name: 'Team', href: '/team', icon: UsersIcon, current: pathNameSlice === "team" },
          { name: 'Schedule', href: '/schedule', icon: DocumentDuplicateIcon, current: pathNameSlice === "schedule" }
        ])
      } else {
        setNavItems([
          { name: 'Calendar', href: '/calendar', icon: CalendarDaysIcon, current: pathNameSlice === "calendar" },
          { name: 'Schedule', href: '/schedule', icon: DocumentDuplicateIcon, current: pathNameSlice === "schedule" }
        ])
      }
    }
  },[userProfile])

  const pageIndex = navItems.findIndex((item) => item.href === pathName);
  
  const handleCurrent = ({index}:{index: number}) => {
    const updatedNavItems = navItems.map((item, i) => ({
      ...item,
      current: i === index ? true : false
    }));
    setNavItems(updatedNavItems);
  };
  
  const handleNavigation = ({index}:{index: number}) => {
    handleCurrent({index});
    setSidebarOpen(false);
    router.push(navItems[index].href);
  }

  async function handleSignout() {
    await signUserOut();
    router.push('/login')
  }

  return (
    <div className="flex flex-col lg:flex-row lg:py-0.5 lg:pr-0.5 h-full bg-gray-200"
    >
      <Transition.Root show={sidebarOpen} as={Fragment}>
          <Dialog as="div" className="relative z-5 lg:hidden" onClose={setSidebarOpen}>
            <Transition.Child
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-900/80" />
            </Transition.Child>

            <div className="fixed inset-0 flex">
              <Transition.Child
                as={Fragment}
                enter="transition ease-in-out duration-300 transform"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in-out duration-300 transform"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                  <Transition.Child
                    as={Fragment}
                    enter="ease-in-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in-out duration-300"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                      <button type="button" className="-m-2.5 p-2.5" onClick={() => setSidebarOpen(false)}>
                        <span className="sr-only">Close sidebar</span>
                        <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                      </button>
                    </div>
                  </Transition.Child>
                  {/* Sidebar component, swap this element with another sidebar if you like */}
                  
                  <div
                    className="w-full rounded-r-md border-r my-1 p-4 border-gray-300 lg:p-4 flex flex-col bg-white"
                  >
                      {/* Logo + Navigation */}
                      <div
                        className=" gap-y-4 flex flex-col flex-1"
                      >
                        {/* Logo */}
                        <div
                          className=""
                        >
                          <Image width={imageSize} height={imageSize} src="/black_logo_vibes.png" alt="logo" />
                        </div>
                        {/* Navigation */}
                        <div
                          className=""
                        >
                          <nav className="flex flex-col gap-y-10">
                            <ul role="list" className="flex flex-col ">
                              <li
                              >
                                <ul role="list" className="space-y-1 ">
                                  {navItems.map((item, index) => (
                                    <li key={item.name}>
                                      <div
                                      onClick={() => handleNavigation({index})}
                                        className={classNames(
                                          item.current
                                            ? 'bg-gray-100 text-black'
                                            : 'text-gray-700 hover:text-black hover:bg-gray-100',
                                          'cursor-default group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium items-center'
                                        )}
                                      >
                                        <item.icon
                                          className={classNames(
                                            item.current ? 'text-black' : 'text-gray-700 group-hover:text-black',
                                            'h-5 w-5 shrink-0'
                                          )}
                                          aria-hidden="true"
                                        />
                                        {item.name}
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              </li>                
                            </ul>
                          </nav>
                        </div>
                      </div>

                      <div className="-mx-4 mt-auto z-5 lg:flex lg:flex-col">
                        <a
                          href="#"
                          className="flex items-center justify-between pl-4 pr-6 py-3 text-sm font-medium leading-6 text-gray-600 hover:bg-gray-100"
                        >
                          <div
                            className="flex items-center gap-x-2"
                          >
                            <div
                              className="flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-b from-cyan-500 to-blue-500"
                            >
                              {/* <UserIcon className="stroke-white h-5 w-5" aria-hidden="true" /> */}
                              <p
                                className="text-white font-medium text-md"
                              >
                                {`${userProfile ? userProfile.firstname[0]: ""}`}
                              </p>
                            </div>
                            <span className="sr-only">Your profile</span>
                            <span className="hover:text-gray-900" aria-hidden="true">{`${userProfile ? userProfile.firstname  : ""}`}</span>
                          </div>
                          <div
                            className="text-medium"
                            onClick={() => {handleSignout()}}
                          >
                            Sign out
                          </div>
                        </a>
                      </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </Dialog>
        </Transition.Root>

      <div 
        className="rounded-md border-r border-y border-gray-300 lg:p-4 flex flex-col lg:w-64 bg-white "
      >
        <div
          className={`flex flex-col h-full hidden z-5 lg:flex lg:flex-col`}
        >
          {/* Logo + Navigation */}
          <div
            className=" gap-y-4 flex flex-col flex-1"
          >
            {/* Logo */}
            <div
              className=""
            >
              <Image width={imageSize} height={imageSize} src="/black_logo_vibes.png" alt="logo" />
            </div>
            {/* Navigation */}
            <div
              className=""
            >
              <nav className="flex flex-col gap-y-10">
                <ul role="list" className="flex flex-col ">
                  <li
                  >
                    <ul role="list" className="space-y-1 ">
                      {navItems.map((item, index) => (
                        <li key={item.name}>
                          <div
                          onClick={() => handleNavigation({index})}
                            className={classNames(
                              item.current
                                ? 'bg-gray-100 text-black'
                                : 'text-gray-700 hover:text-black hover:bg-gray-100',
                              'cursor-default group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium items-center'
                            )}
                          >
                            <item.icon
                              className={classNames(
                                item.current ? 'text-black' : 'text-gray-700 group-hover:text-black',
                                'h-5 w-5 shrink-0'
                              )}
                              aria-hidden="true"
                            />
                            {item.name}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </li>                
                </ul>
              </nav>
            </div>
          </div>
        </div>

        {/* Profile Menu */}
        <Menu as="div" className="hidden lg:flex lg:flex-col relative inline-block text-left">
          <div>
              <Menu.Button className="w-full">
                  <div className="-mx-4 mt-auto hidden z-5 lg:flex lg:flex-col">
                    <a
                      href="#"
                      className="flex items-center gap-x-3 px-4 py-3 text-sm font-medium leading-6 text-gray-600 hover:bg-gray-100"
                    >
                      <div
                        className="flex items-center justify-center h-9 w-9 rounded-full bg-gradient-to-b from-cyan-500 to-blue-500"
                      >
                        {/* <UserIcon className="stroke-white h-5 w-5" aria-hidden="true" /> */}
                        <p
                          className="text-white font-medium text-md"
                        >
                          {`${userProfile ? userProfile.firstname[0] : ""}`}
                        </p>
                      </div>
                      <span className="sr-only">Your profile</span>
                      <span className="hover:text-gray-900" aria-hidden="true">{`${userProfile ? userProfile.firstname : ""} ${userProfile ? userProfile.lastname: ""}`}</span>
                    </a>
                  </div>
              </Menu.Button>
            </div>

            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="bottom-full text-medium mb-2 absolute right-0 z-5 w-56 origin-top-right divide-y divide-gray-200 border-gray-200 rounded-md border focus:outline-none">
                <div className="px-4 py-3 gap-x-1 ">
                  <p className="cursor-default truncate text-sm font-medium text-gray-700">{user ? user.email : ""}</p>
                </div> 
                <div className="py-1">
                    <Menu.Item>
                      <button
                          onClick={() => {handleSignout()}}
                          className='hover:bg-gray-100 block w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:text-gray-900'
                        >
                          Sign out
                        </button>
                    </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

        {/* <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-sm sm:px-6 lg:hidden">
          <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6" aria-hidden="true" />
          </button>
          <div className="flex-1 text-lg font-semibold leading-6 text-gray-900">{pageName}</div>
          <a href="#">
            <span className="sr-only">Your profile</span>
            <Image alt="" className="rounded-full bg-gray-100" width={8} height={8} src=""/> 
          </a>
        </div> */}

      </div>
      
      {/* Application */}
      <div
        className={`lg:ml-0.5 flex-1 flex flex-col border border-gray-300 rounded-md bg-white overflow-hidden`}
      >
        <div
          className="lg:px-12 flex flex-row gap-x-5 cursor-default select-none py-8 px-5 rounded-t-md"
          style={{ 
            backgroundImage: "url('/background.jpg')",
            backgroundSize: 'cover',
            backgroundPosition: 'bottom',
            backgroundRepeat: 'no-repeat'
          }}
        >
          <button type="button" className="-m-2.5 p-2.5 text-gray-700 lg:hidden" onClick={() => setSidebarOpen(true)}>
            <span className="sr-only">Open sidebar</span>
            <Bars3Icon className="h-6 w-6 stroke-white stroke-2" aria-hidden="true" />
          </button>
          <p
            className="cursor-default font-semibold text-white text-3xl"
          >
            {navItems[pageIndex] ? navItems[pageIndex].name : "Restricted Page"}
          </p>
        </div>
        {children}
      </div>
    </div>
  )
}
