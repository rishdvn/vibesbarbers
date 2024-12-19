import { Appointment } from '@/utils/schemas/Appointment';
import React, { useEffect, useState } from 'react';
import { auth } from '@/src/index.ts'
import { Form } from '@/utils/schemas/Form';
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth';

interface PhoneNumberProps {
  user: { phoneNumber: string } | null;
  appDetails: Form;
  handleAppDetails: (e: React.ChangeEvent<HTMLInputElement>) => void;
  signUserOut: () => void;
}

declare global {
    interface Window {
      recaptchaVerifier: RecaptchaVerifier;
    }
  }

const PhoneNumber: React.FC<PhoneNumberProps> = ({
  user,
  appDetails,
  handleAppDetails,
  signUserOut,
}) => {
    
    const [otp, setOtp] = useState('');
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const [otpSent, setOtpSent] = useState(false);
    const [verified, setVerified] = useState(false);
    

    
    useEffect(() => {
        // Only initialize if it doesn't exist
        if (!window.recaptchaVerifier && !user) {
            try {
                const verifier = new RecaptchaVerifier(
                    auth,
                    'recaptcha-container',
                    {
                        size: 'invisible',
                        callback: () => {
                            // Callback is optional for invisible recaptcha
                        }
                    }
                );
                window.recaptchaVerifier = verifier;
            } catch (error) {
                console.error('Error initializing reCAPTCHA:', error);
            }
        }

        // Cleanup function
        return () => {
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                    delete window.recaptchaVerifier;
                } catch (error) {
                    console.error('Error clearing reCAPTCHA:', error);
                }
            }
        };
    }, []);

    useEffect(() => {
        if (user?.phoneNumber && !appDetails.telNo) {
            handleAppDetails({
                target: { value:  user.phoneNumber.replace(/^(\+61|0)/, ''), name: 'telNo' }
            } as React.ChangeEvent<HTMLInputElement>);
        }
    }, [user?.phoneNumber]);

    const handleSendOtp = async (e) => {
        try {
            if (!window.recaptchaVerifier) {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    'size': 'normal',
                    'callback': (response) => {
                        console.log(response);
                    },
                    'expired-callback': () => {
                        console.log('expired');
                    }
                });
            }
            const formattedPhoneNumber = `+61${appDetails.telNo.replace(/\D/g, '')}`;
            const confirmationResult = await signInWithPhoneNumber(auth, formattedPhoneNumber, window.recaptchaVerifier);
            setConfirmationResult(confirmationResult);
            setOtpSent(true);
            alert('OTP has been sent');
        } catch (error) {
            console.error('Error sending OTP:', error);
            // Reset reCAPTCHA on error
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            }
        }
    };
    

    const handleOTPSubmit = async (e: any) => {
        confirmationResult.confirm(otp).then((result) => {
            const user = result.user;
            setVerified(true);
        }).catch((error: any) => {
            console.error(error)
        })
    }

    const handleNumberChange = () => {
        setOtpSent(false);
        setVerified(false);
        signUserOut();
    }

    
    const handleOTPChange = (e) => {
        setOtp(e.target.value);
    }


  return (
    <div className="grid grid-cols-1 gap-1 space-y-0">
      <label className="block font-semibold leading-6 text-gray-100 sm:mt-1.5">
        <div className='flex flex-row gap-x-1'>
          <span className='text-red-500'>6.</span>
          PHONE NUMBER
          <span className='font-medium'>(Do not include 0 or +61. E.g., 4xx xxx xxx)</span>
        </div>
      </label>
      {user ? (
        <div className='flex flex-row justify-between py-2 text-gray-100'>
          <div>{user.phoneNumber}</div>
          <div
            className='text-blue-600 hover:text-blue-700 font-medium cursor-pointer'
            onClick={handleNumberChange}
          >
            Change number
          </div>
        </div>
      ) : null}
      {user ? null : (
        <div className='flex flex-col gap-y-2'>
          <div className="flex gap-2 text-gray-100 items-center">
            +61
            <input
              type="tel"
              value={appDetails.telNo}
              onChange={handleAppDetails}
              name="telNo"
              id="telNo"
              placeholder="Phone Number"
              className="block w-full rounded-md border-0 p-1 text-gray-100 bg-gray-800 ring-1 ring-inset ring-gray-700 placeholder:text-gray-500 focus:ring-1 focus:ring-inset focus:ring-green-700 sm:leading-6"
            />
            {otpSent ? null : (
              <button
                onClick={handleSendOtp}
                className="bg-green-700 h-full w-1/4 flex items-center justify-center text-gray-100 px-4 rounded-md hover:bg-green-800 disabled:opacity-50 disabled:bg-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed transition-all duration-300"
                disabled={!appDetails.telNo || appDetails.telNo.length !== 9}
              >
                Send OTP
              </button>
            )}
          </div>
        </div>
      )}
      {!user && !otpSent && (
        <div id="recaptcha-container" className="mt-2" />
      )}
      {otpSent && !verified ? (
        <div className='flex flex-row gap-x-1'>
          <input
            type='text'
            value={otp}
            onChange={handleOTPChange}
            placeholder="Enter OTP"
            className="block w-full rounded-md border-0 p-1 text-gray-100 bg-gray-800 ring-1 ring-inset ring-gray-700 placeholder:text-gray-500 focus:ring-1 focus:ring-inset focus:ring-green-700 sm:leading-6"
          />
          <div
            onClick={handleOTPSubmit}
            className="bg-green-700 text-gray-100 px-4 rounded-md hover:bg-green-800 disabled:opacity-50 disabled:bg-gray-600 disabled:text-gray-300 disabled:cursor-not-allowed"
            disabled={!otp || otp.length !== 6}
          >
            Submit OTP
          </div>
        </div>
      ) : null}
      {verified && (
        <div className='text-green-600 font-semibold'>
          Phone number verified
        </div>
      )}
      <div className='text-gray-400 font-medium'>
        This is only for verification purposes. The barber will contact you on this number if they are sick. You will not be sent any marketing SMS, and this number will not be shared.
      </div>
      {!user && (
        <>
          {appDetails.telNo.length !== 9 && appDetails.telNo.length !== 0 && (
            <div className='text-red-600 font-medium'>
              Number must be 9 digits
            </div>
          )}
          {!/^\d+$/.test(appDetails.telNo) && appDetails.telNo.length !== 0 && (
            <div className='text-red-600 font-medium'>
              Number must contain only numbers
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default PhoneNumber;
