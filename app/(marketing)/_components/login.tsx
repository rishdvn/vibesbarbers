"use client";

import React, { useState } from 'react'
import { auth } from '../../../src/index.ts'
import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useRouter } from 'next/navigation.js';
import {Icon} from 'react-icons-kit';
import {eyeOff} from 'react-icons-kit/feather/eyeOff';
import {eye} from 'react-icons-kit/feather/eye'


export default function Login({togglePage}:{togglePage: Function}) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [userCredentials, setUserCredentials] = React.useState({})
  const [error, setError] = React.useState('');

  function handleUserCredentials(e) {
    return (
      setUserCredentials({...userCredentials, [e.target.name]: e.target.value})
    )
  }

  function handleLogin(e) {
    e.preventDefault();
    setError('')
    
    signInWithEmailAndPassword(auth, userCredentials.email, userCredentials.password)
    .then((userCredential) => {
      // Logged in
      const user = userCredential.user;
      console.log(user)
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

  function handlePasswordReset() {
    const email = prompt('Please enter your email address');
    sendPasswordResetEmail(auth, email);
    alert('Email sent. Check your inbox for reset instructions.')
  }

  function handleSignOut() {
    signOut(auth).then(() => {
        console.log('Signed out successfully.')
      }).catch((error) => {
        console.log(error.message)
      });
  }

    return (
        <div className="absolute inset-0 z-999 flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
              LOGIN
            </h2>
          </div>
  
          <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]">
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
                  <div className="gap-x-2 flex flex-row items-center mt-2">
                    <input
                      onChange={(e) => handleUserCredentials(e)}
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      required
                      className="focus:outline-none block w-full rounded-md border-0 p-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-red-600 sm:text-sm sm:leading-6"
                    />
                    <button
                      type="button" 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="flex items-cen ter text-sm leading-5"
                    >
                      
                      {showPassword ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
  
                <div className="flex items-center justify-end">
                  {/* <div className="flex items-center">
                    <input
                      id="remember-me"
                      name="remember-me"
                      type="checkbox"
                      className=" h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-600"
                    />
                    <label htmlFor="remember-me" className="ml-3 block text-sm leading-6 text-gray-900">
                      Remember me
                    </label>
                  </div> */}
  
                  <div 
                    onClick={() => handlePasswordReset()}
                    className="text-sm leading-6"
                  >
                    <a href="#" className="font-semibold text-gray-800 hover:text-gray-700">
                      Forgot password?
                    </a>
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
                    onClick={(e) => handleLogin(e)}
                    type="submit"
                    className="flex w-full justify-center rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                  >
                    Login
                  </button>
                </div>
              </form>
  
            </div>
  
            <div className="mt-10 text-center text-sm text-gray-500">
              Not a member?{' '}
              <div
                onClick={()=>togglePage()}
                className="cursor-pointer font-semibold leading-6 text-red-600 hover:text-red-500"
              >
                Sign up here
              </div>
            </div>  
          </div>
        </div>
    )
  }
  