"use client";

import React from 'react'
import { auth, db } from '../../../src/index.ts'
import { createUserWithEmailAndPassword} from "firebase/auth";
import { collection, addDoc } from "firebase/firestore"; 
import { useRouter } from 'next/navigation.js';
import { useUserAuth } from '@/src/context/AuthContext';

async function addUserToDB(user) {
  try {
    const docRef = await addDoc(collection(db, "users"), {
      email: user.email,
      uid: user.uid,
      approved: false
    });
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

export default function Signup({togglePage}:{togglePage: Function}) {
  const router = useRouter();
  const [userCredentials, setUserCredentials] = React.useState({})

  const [error, setError] = React.useState('');
  const { createUser } = useUserAuth();

  function handleUserCredentials(e) {
    return (
      setUserCredentials({ ...userCredentials, [e.target.name]: e.target.value })
    )
  }

  function handleSignup(e) {
    e.preventDefault();
    setError('')
    
    createUser(userCredentials.email, userCredentials.password).then((userCredential) => {
      // Signed up
      const user = userCredential.user;
      addUserToDB(user)
      router.push('/request')
      // ...
    })
    .catch((error) => {
      const errorCode = error.code;
      const errorMessage = error.message;
      setError(error.message)
      // ..
    });
  }

    return (
        <div className="absolute inset-0 z-10 flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
              SIGN UP
            </h2>
          </div>
  
          <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-[480px]">
            <div className="px-5">
              <form className="space-y-6" action="#" method="POST">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                    Email address
                  </label>
                  <div className="mt-2">
                    <input
                      onChange={(e) => handleUserCredentials(e)}
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="focus:outline-none block w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>
  
                <div>
                  <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                    Password
                  </label>
                  <div className="mt-2">
                    <input
                      onChange={(e) => handleUserCredentials(e)}
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      className="focus:outline-none block w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6"
                    />
                  </div>
                </div>
  
                <div className='flex flex-col gap-y-2'>
                  {
                    error && (
                      <div className='text-sm font-semibold text-red-600'>
                        {error}
                      </div>
                    )
                  }

                  <button
                    onClick={(e) => handleSignup(e)}
                    type="submit"
                    className="flex w-full justify-center rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                  >
                    Sign up
                  </button>
                </div>
              </form>
  
            </div>
  
            <div className="mt-10 text-center text-sm text-gray-500">
              Already a member?{' '}
              <div onClick={()=>togglePage()} className="cursor-pointer font-semibold leading-6 text-red-600 hover:text-red-500">
                Login here
              </div>
            </div>
          </div>
        </div>
    )
  }
  