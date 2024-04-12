"use client";

import { useUserAuth } from "@/src/context/AuthContext";
import { db } from "../../../src/index.ts";
import { collection, addDoc, getDocs, onSnapshot } from "firebase/firestore";
import { UserIcon } from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";
import TeamFlyOver from "./teamflyover.tsx";

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

  export default function Users() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
      onSnapshot(collection(db, "users"), (querySnapshot) => {
        const usersFetched = [];
        querySnapshot.forEach((doc) => {
          usersFetched.push(doc.data());
        });
        setUsers(usersFetched);
      })
    },[])

    const [selectedUser, setSelectedUser] = useState({});

    const {userProfile} = useUserAuth();

    const [ flyOverOpen, setFlyOverOpen]  = useState(false);


    const handleRowClick = (user) => {
      setSelectedUser(user);
      setFlyOverOpen(true);
    }

    return (
      <>
      <TeamFlyOver flyOverOpen={flyOverOpen} setFlyOverOpen={setFlyOverOpen} user={selectedUser}/>
      <div className="h-full overflow-y-auto pt-10 px-4 sm:px-6 lg:px-12">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h1 className="text-2xl font-semibold leading-6 text-gray-900">Team members</h1>
          </div>
        </div>
        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-300 text-xs">
                <thead>
                  <tr>
                    <th scope="col" className="px-3 py-3.5 text-left font-semibold text-gray-900 sm:pl-0">
                      Name
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left font-semibold text-gray-900">
                      Email
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left font-semibold text-gray-900 sm:pr-0">
                      Role
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left font-semibold text-gray-900 sm:pr-0">
                      Portal approval status
                    </th>
                  </tr>
                </thead>
                <tbody className="text-xs divide-y divide-gray-200 bg-white">
                  {users.map((user) => (
                    <tr 
                      onClick={() => handleRowClick(user)}
                      className="cursor-pointer hover:bg-gray-50"
                      key={user.email}
                    >
                      {/* User picture and Name */}
                      <td className="whitespace-nowrap py-3 pl-4 sm:pl-0">
                        <div className="flex items-center">
                          <div
                            className="flex items-center justify-center h-16 w-16 rounded-full bg-gradient-to-b from-cyan-500 to-blue-500"
                          >
                            <p
                              className="text-white font-medium text-2xl"
                            >
                              {`${user && user.firstname ? user.firstname[0] : ""}`}
                            </p>
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">{`${user ? user.firstname + " " + user.lastname : ""}`}</div>
                          </div>
                        </div>
                      </td>
                      {/* User email */}
                      <td className="whitespace-nowrap px-3 py-5 ">
                        <div className="text-gray-900">{`${user ? user.email : ""}`}</div> 
                      </td>
                      {/* User approval status */}
                      <td className="whitespace-nowrap px-3 py-5 ">
                        <div className="text-gray-900">{`${user ? user.role : ""}`}</div> 
                      </td>
                      {/* User approval status */}
                      <td className="whitespace-nowrap px-3 py-5 ">
                        <span className={classNames(
                          user.approved ? "bg-green-50 text-green-700 ring-green-600/20" : "bg-orange-50 text-orange-700 ring-orange-600/20",
                          "inline-flex items-center rounded-md  px-2 py-1 font-medium ring-1 ring-inset"
                        )}
                        >
                          {user.approved ? "Approved" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      </>
    )
  }