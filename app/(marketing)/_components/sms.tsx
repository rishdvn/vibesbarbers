"use client";

import React, { useEffect, useState } from 'react'
import { db, auth } from '../../../src/index.ts'
import { sendPasswordResetEmail, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { useRouter } from 'next/navigation.js';
import { useUserAuth } from '@/src/context/AuthContext.tsx';
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { set } from 'date-fns';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ')
}

async function addUserToDB(user) {
  try {
    const docRef = await addDoc(collection(db, "users"), {
      email: "vibesbarbers@gmail.com",
      uid: user.uid,
      approved: false
    });
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

export default function SmsLogin() {

  const { user, signUserOut } = useUserAuth();

  // Create userProfile state
  const [userProfile, setUserProfile] = useState(null);
  const [userDocId, setUserDocId] = useState(null);

  // Get the user's document ID by their UID
  async function getDocIdByUid(uid) {
    const q = query(collection(db, "users"), where("uid", "==", uid));
    const querySnapshot = await getDocs(q); 
    let docId = null;
    querySnapshot.forEach((doc) => {
      // doc.data() is never undefined for query doc snapshots
      docId = doc.id;
    });
    setUserDocId(docId);
    return docId;
  }
  
  // Get user's profile data
  useEffect(() => {
    if (user && user.uid) {
      (async () => {
        // Get users docID for users Table
        const docId = await getDocIdByUid(user.uid);
          // Get the user's profile data, set to state
          if (docId) {
            const userDoc = doc(db, "users", docId);
            const userProfileData = await getDoc(userDoc);
            setUserProfile(userProfileData.data());
          } else {
            setUserProfile("no user profile")
          }
      })();
    }
  }, [user]);

  useEffect(() => {
    if (user && userProfile === "no user profile") {
      addUserToDB(user)
      setUserProfile({
        email: "vibesbarbers@gmail.com",
        uid: user.uid,
        approved: false
      })
    }
  },[userProfile])


  /////// 


    // initialize appDetials object
    const [appDetails, setAppDetails] = useState({
      service: "",
      barberUID: "",
      firstname: "",
      telNo: "",
      appDay: "",
      appStartTime: "",
      appEndTime: "",
      isExtra: false
    });

    function handleAppDetails(e) {
      setAppDetails(prev => ({...prev, [e.target.name]: e.target.value}))
    }

  const handleNumberChange = () => {
    setOtpSent(false);
    setVerified(false);
    setConfirmationResult(null);
    setUserProfile(null)
    setAppDetails(prev => ({...prev, "telNo": ""}))
    signUserOut();
  }

  
  const handleBarberCreation = () => {
    const user = userCredential.user;
    addUserToDB(user)
    router.push('/request')
  }

  auth.languageCode = 'en';

  const [otp, setOtp] = useState('');
  const [confirmationResult,setConfirmationResult] = useState(null);
  const [otpSent, setOtpSent] = useState(false);

  interface Window {
    recaptchaVerifier?: any;
}

  useEffect(() => {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'normal',
      'callback': (response) => {
        console.log(response)
      },
      'expired-callback': () => {
        console.log('expired')
      }
    });
  }, [auth])

    const handleOTPChange = (e) => {
      setOtp(e.target.value);
    }

    const handleSendOtp = async (e) => {
      const formattedPhoneNumber = `+61${appDetails.telNo.replace(/\D/g, '')}`;
      signInWithPhoneNumber(auth, formattedPhoneNumber, window.recaptchaVerifier).then(
        (confirmationResult) => {
          setConfirmationResult(confirmationResult);
          setOtpSent(true);
          alert('OTP has been sent');
        }
      ).catch((error) => {
        console.error(error)
      })
    };

    const [verified, setVerified] = useState(false)


    const handleOTPSubmit = async (e) => {
      confirmationResult.confirm(otp).then((result) => {
        // const user = result.user;
        setVerified(true);
      }).catch((error) => {
        console.error(error)
      })
    }


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

  const handleNavigate = () => {
    if (userProfile.approved === true) {
      router.push('/calendar')
    } else {
      router.push('/request')
    }
  }

    return (
        <div className="absolute inset-0 z-50 flex min-h-full flex-1 flex-col justify-center py-12 px-4">
          <div className="sm:mx-auto sm:w-full sm:max-w-md">
            <h2 className="text-center text-2xl font-bold leading-9 tracking-tight text-gray-900">
              LOGIN
            </h2>
          </div>
  
          <div className="mt-10 mx-auto w-full max-w-[480px] text-xs">
            <div className="grid grid-cols-1 gap-1 space-y-0">
              <label
                  className="block font-semibold leading-6 text-gray-900 sm:mt-1.5"
              >
                  PHONE NUMBER
              </label>
              { user ? (
                <div className='flex flex-row justify-between py-2'>
                  <div>
                    {user.phoneNumber}
                  </div>
                  <div
                    className='text-blue-800 hover:text-blue-700 font-medium cursor-pointer'
                    onClick={() => {handleNumberChange()}}
                  >
                    Change number
                  </div>
                </div>
              ) : (
                null
              )}
              { user ? null : (
                <div className='flex flex-col gap-y-2'>
                  <div className="col-span-1 flex items-center gap-x-1">
                      +61
                      <input
                        type="tel"
                        value={appDetails.telNo}
                        onChange={handleAppDetails}
                        name="telNo"
                        id="telNo"
                        className="block w-full rounded-md border-0 p-1 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-1 focus:ring-inset focus:ring-sky-600 sm: sm:leading-6"
                      />
                      {otpSent ? null : (
                        <div
                          onClick={handleSendOtp}
                          className="flex w-1/4 justify-center rounded-md bg-black p-2 text-md font-medium text-white hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 cursor-pointer"
                        >
                          Send OTP
                        </div>
                      )}
                  </div>
                </div>
              )}
              {!verified && !otpSent ? (
                <div id="recaptcha-container" />
              ) : null}
              {otpSent && !verified ? (
                <div
                  className='flex flex-row gap-x-1'
                >
                  <input
                    type='text'
                    value={otp}
                    onChange={handleOTPChange}
                    placeholder="Enter OTP"
                    className='block w-full rounded-lg border border-gray-200 px-1 py-2'
                  />
                  <div
                    onClick={handleOTPSubmit}
                    className="flex w-1/4 justify-center rounded-md bg-black p-2 text-md font-medium text-white hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600 cursor-pointer"
                  >
                    Submit OTP
                  </div>
                </div>
              ) : null}
              {verified && (
                <div
                  className='text-green-600 font-semibold'
                >
                  Phone number verified
                </div>
              )}
              {
                  appDetails.telNo.length === 9 || appDetails.telNo.length === 0 ? "" : (
                  <div
                      className='text-red-600 font-medium'
                  >
                      Number must be 9 digits
                  </div>
                  )
              }
              {
                  (/^\d+$/.test(appDetails.telNo) || appDetails.telNo.length === 0) ? "" : (
                  <div
                      className='text-red-600 font-medium'
                  >
                      Number must contian only numbers
                  </div>
                  )
              }
              {(userProfile === null  || userProfile === "no user profle") ? null : (
                <div 
                  className={classNames(
                      'flex justify-center font-medium p-2 rounded-lg bg-black hover:bg-gray-800 text-white cursor-pointer'                  )}
                  onClick={() => {handleNavigate()}}
                >
                  {userProfile.approved === true ? "Dashboard" : "Request Access"}
                </div>
              )}
            </div>
          </div>
        </div>
    )
  }
  