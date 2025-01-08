"use client";

import React, { useEffect, useState } from 'react'
import { db, auth } from '../../../src/index.ts'
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth';
import { addDoc, collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp"

async function addUserToDB(user) {
  try {
    const docRef = await addDoc(collection(db, "users"), {
      uid: user.uid,
      approved: false
    });
    console.log("Document written with ID: ", docRef.id);
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

export default function SmsLogin() {
  const router = useRouter();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('phone');
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
      'size': 'invisible'
    });
  }, []);

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const formattedPhoneNumber = '+61' + phoneNumber.replace(/\D/g, '');
      const confirmation = await signInWithPhoneNumber(
        auth, 
        formattedPhoneNumber,
        window.recaptchaVerifier
      );
      setConfirmationResult(confirmation);
      setStep('otp');
    } catch (error) {
      console.error('Error sending OTP:', error);
      setError('Failed to send OTP. Please try again.');
    }
  };

  const handleVerifyOTP = async () => {
    setError('');
    try {
      const result = await confirmationResult.confirm(otp);
      const user = result.user;
      const q = query(collection(db, "users"), where("uid", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        await addUserToDB(user);
      }
      
      router.push('/bookings');
    } catch (error) {
      console.error('Error verifying OTP:', error);
      setError('Invalid OTP. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-md p-4 text-white">
      <h1 className="text-4xl font-light text-center mb-12">LOGIN</h1>
      
      {error && <p className="text-red-500 text-center mb-4">{error}</p>}
      
      {step === 'phone' ? (
        <form onSubmit={handleSendOTP} className="space-y-6">
          <div>
            <p className="text-sm mb-4 text-center">ENTER PHONE NUMBER</p>
            <div className="flex items-center justify-center space-x-2">
              <span className="text-lg">+61</span>
              <InputOTP 
                maxLength={9}
                value={phoneNumber}
                onChange={setPhoneNumber}
                className="w-full"
                autoFocus
                inputMode='numeric'
              >
                <InputOTPGroup>
                  <InputOTPSlot index={0} />
                  <InputOTPSlot index={1} />
                  <InputOTPSlot index={2} />
                  <InputOTPSlot index={3} />
                  <InputOTPSlot index={4} />
                  <InputOTPSlot index={5} />
                  <InputOTPSlot index={6} />
                  <InputOTPSlot index={7} />
                  <InputOTPSlot index={8} />
                </InputOTPGroup>
              </InputOTP>
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            SEND OTP
          </button>
        </form>
      ) : (
        <div className="space-y-6">
          <div>
            <p className="text-sm mb-4 text-center">ENTER OTP CODE</p>
            <div className="flex items-center justify-center space-x-2">
            <InputOTP
              value={otp}
              onChange={setOtp}
              maxLength={6}
              className="w-full"
              pattern="[0-9]*"
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            </div>
          </div>
          <button
            onClick={handleVerifyOTP}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-colors"
          >
            VERIFY
          </button>
        </div>
      )}
      
      <div id="recaptcha-container"></div>
    </div>
  );
}