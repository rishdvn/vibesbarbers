"use client";

import { db } from '@/src/index.ts'
import { useUserAuth } from "@/src/context/AuthContext";
import { useEffect, useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { routeModule } from 'next/dist/build/templates/app-page';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

function classNames(...classes) {
    return classes.filter(Boolean).join(' ')
}

const RequestPage = () => {    

    const router = useRouter();
  // load user + userProfile
  const { user, userProfile, userDocId } = useUserAuth();

  // save user credentials to publish
  const [userCredentials, setUserCredentials] = useState({
    firstname: "",
    lastname: "",
    role: ""
  })

  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (userProfile) {
        setUserCredentials(userProfile)
    }
    if (userProfile && userProfile.role && userProfile.firstname && userProfile.lastname) {
        setSubmitted(true)
    } else {
        setSubmitted(false)
    }
  },[userProfile])

    // manage if can submit
  const [allowSubmit, setAllowSubmit] = useState(false)

  useEffect(() => {
    if (userCredentials.firstname && userCredentials.lastname && userCredentials.role) {
        setAllowSubmit(true)
    } else {
        setAllowSubmit(false)
    }
  },[userCredentials])

  // submission action
    async function handleSubmit(e) {
        e.preventDefault(); 
        const userRef = doc(db, "users", userDocId)
        await updateDoc(userRef, userCredentials)
        setSubmitted(true)
    }

  // 1. User is renavigated to calendar (WORKING)
  if (userProfile && userProfile.approved) {
    router.push("/calendar");
  }
 
  if (userProfile && !userProfile.approved) {
    return (
        <div
            className='flex flex-col w-full h-full items-center bg-gray-100 text-sm font-normal'
        >
            {/* CONTENT CONTAINER */}
            <div className='mt-5 sm:mt-28 flex flex-col w-full max-w-screen-md gap-y-8 rounded-lg bg-white p-3'>
                {/* HEADING + DESC */}
                <div
                    className='flex flex-col gap-y-2'
                >
                    <h1 className='text-3xl font-semibold'>
                        {submitted ? "Access Requested" : "Request Access"}
                    </h1>
                    <div className='text-md font-medium'>
                        {submitted ? "Ask Admin to approve you." : "Request access to use the portal."}
                    </div>
                </div>
    
                <form className='flex flex-col gap-y-4'>
                    <div className='flex flex-col items-center gap-y-2'>
                        <div className='flex w-full font-medium'>
                            FIRST NAME
                        </div>
                        <input
                            type='text'
                            name='firstname'
                            disabled={submitted}
                            className='w-full rounded-lg border border-gray-200 p-1 text-xs'
                            required
                            onChange={(e) => {setUserCredentials(prev => ({...prev, firstname: e.target.value}))}}
                            value={userCredentials.firstname}
                        />
                    </div>
    
                    <div className='flex flex-col items-center gap-y-2'>
                        <div className='flex w-full font-medium'>
                            LAST NAME
                        </div>
                        <input
                            type='text'
                            name='lastname'
                            className='w-full rounded-lg border border-gray-200 p-1 text-xs'
                            required
                            onChange={(e) => {setUserCredentials(prev => ({...prev, lastname: e.target.value}))}}
                            value={userCredentials.lastname}
                            disabled={submitted}
                        />
                    </div>
    
                    <div className='flex flex-col items-center gap-y-2'>
                        <div className='flex w-full font-medium'>
                            ROLE
                        </div>
                        <select 
                            name='role' 
                            className='w-full rounded-lg border border-gray-200 pl-1 pr-2 p-1 text-xs' 
                            required
                            onChange={(e) => {setUserCredentials(prev => ({...prev, role: e.target.value}))}}
                            value={userCredentials.role}
                            disabled={submitted}
                        >
                            <option value=""></option>
                            <option value="Admin">Admin</option>
                            <option value="Barber">Barber</option>
                            <option value="Receptionist">Receptionist</option>
                        </select>
                    </div>
    
                    <div className='flex flex-col items-center gap-y-2'>
                        <div className='flex w-full font-medium'>
                            EMAIL
                        </div>
                        <input
                            type='email'
                            className='w-full rounded-lg border border-gray-200 p-1 text-xs'
                            disabled
                            value={userProfile ? userProfile.email : "Email loading..."}
                        />
                    </div>
    
                    <button
                        className={classNames(
                            "w-full font-medium rounded-lg p-1.5",
                            submitted ? "cursor-not-allowed bg-blue-800 text-white" : allowSubmit ? "bg-black hover:bg-gray-800 text-white cursor-pointer" : "bg-gray-300 text-gray-500 cursor-not-allowed"
                        )}
                        disabled={!allowSubmit || submitted}
                        onClick={handleSubmit}
                    >
                        {submitted ? "ACCESS REQUESTED" : "REQUEST ACCESS"}
                    </button>
                </form>
            </div>
        </div>
      )
  }
  
  return (
    <div
        className="bg-gray-100 flex items-center justify-center text-2xl min-h-screen font-semibold text-gray-900"
    >
        <Image width='60' height='60' src="/black_logo_vibes.png" alt="logo" />
    </div>
  )
}

export default RequestPage;