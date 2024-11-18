import { Menu } from "@headlessui/react";
import ChevronLeftIcon from "@heroicons/react/20/solid/ChevronLeftIcon";
import ChevronRightIcon from "@heroicons/react/20/solid/ChevronRightIcon";
import { addDays, format, isSameDay, startOfDay } from "date-fns";


function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
  }
  

export const Header: React.FC = ({selectedDay, setSelectedDay, setView, view}) => {
  const today = startOfDay(new Date());

  return (
    <header className="flex flex-col sticky top-0 z-30 bg-white">
        <div className="flex flex-none items-center justify-between border-b border-gray-200 px-6 py-4">

            <div
              className="flex flex-col"
            >
              <h1 className="text-base font-semibold leading-6 text-gray-900">
                {format(selectedDay, 'dd MMM, yyyy')}
              </h1>
              <div
                className="text-xs"
              >
                {format(selectedDay, 'iii')}
              </div>
            </div>

            <div className="flex items-center gap-x-2">
              <div>
                <Menu as="div" className="z-50 relative">
                  <Menu.Button as="div" className="select-none cursor-pointer rounded-md px-2 py-2 text-xs font-semibold border border-gray-300 text-black hover:text-gray-500 focus:relative hover:bg-gray-50">
                    {`${view} view`}
                  </Menu.Button>
                    <Menu.Items as="div" className="flex flex-col divide-y divide-gray-100 absolute mt-2 right-0 text-xs bg-white rounded-lg border border-gray-100">
                        <Menu.Item as="div" className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => setView("Individual")}>
                          Individual
                        </Menu.Item>
                        <Menu.Item as="div" className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => setView("Team")}>
                          Team
                        </Menu.Item>
                    </Menu.Items>
                </Menu>
              </div>
              <div className="relative flex items-center rounded-md bg-white  md:items-stretch">
                  <button
                    onClick={() => setSelectedDay(addDays(selectedDay, -1))}
                    type="button"
                    className="flex h-9 w-12 items-center justify-center rounded-l-md border-y border-l border-gray-300 pr-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pr-0 md:hover:bg-gray-50"
                  >
                    <span className="sr-only">Previous day</span>
                    <ChevronLeftIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => setSelectedDay(today)}
                    type="button"
                    className={classNames(
                      "hidden border-y border-gray-300 px-3.5 text-xs font-semibold text-gray-900 hover:bg-gray-50 focus:relative md:block",
                      isSameDay(selectedDay, today) ? 'bg-gray-100' : ''
                    )}
                  >
                    Today
                  </button>
                  <div
                    className="items-center hidden border-y border-gray-300 px-3.5 text-xs font-medium text-gray-900 focus:relative md:flex"
                  >
                    {format(selectedDay, 'dd MMM, yyyy')}
                  </div>
                  <span className="relative -mx-px h-9 w-px bg-gray-300 md:hidden" />
                  <button
                    onClick={() => setSelectedDay(addDays(selectedDay, 1))}
                    type="button"
                    className="flex h-9 w-12 items-center justify-center rounded-r-md border-y border-r border-gray-300 pl-1 text-gray-400 hover:text-gray-500 focus:relative md:w-9 md:pl-0 md:hover:bg-gray-50"
                  >
                    <span className="sr-only">Next day</span>
                    <ChevronRightIcon className="h-5 w-5" aria-hidden="true" />
                  </button>
              </div>
              <div className="flex items-center">                  
                  <Menu as="div" className="z-50 relative">
                    <Menu.Button as="div" className="select-none cursor-pointer rounded-md bg-black px-3 py-2 text-xs font-semibold text-white  hover:bg-gray-800">
                      Add event
                    </Menu.Button>
                      <Menu.Items as="div" className="flex flex-col divide-y divide-gray-100 absolute mt-2 right-0 text-xs bg-white rounded-lg border border-gray-100">
                          {/* <Menu.Item as="div" className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => setFlyOverOpen(true)}>
                            Add appointment
                          </Menu.Item>
                          <Menu.Item as="div" className="p-2 hover:bg-gray-100 cursor-pointer" onClick={() => setFlyOverOpenBreak(true)}>
                            Add break
                          </Menu.Item> */}
                      </Menu.Items>
                  </Menu>
              </div>
            </div>
            </div>
      </header>
      
  );
};
