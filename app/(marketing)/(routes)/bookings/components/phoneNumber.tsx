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
    }, [auth]);
    
    const handleSendOtp = async (e) => {
        const formattedPhoneNumber = `+61${appDetails.telNo.replace(/\D/g, '')}`;
        signInWithPhoneNumber(auth, formattedPhoneNumber, window.recaptchaVerifier).then(
            (confirmationResult) => {
                console.log("Got here")
                setConfirmationResult(confirmationResult);
                setOtpSent(true);
                alert('OTP has been sent');
            }
        ).catch((error) => {
            console.error(error)
        })
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
      <label className="block font-semibold leading-6 text-gray-900 sm:mt-1.5">
        <div className='flex flex-row gap-x-1'>
          <span className='text-red-600'>6.</span>
          PHONE NUMBER
          <span className='font-medium'>(Do not include 0 or +61. E.g., 4xx xxx xxx)</span>
        </div>
      </label>
      {user ? (
        <div className='flex flex-row justify-between py-2'>
          <div>{user.phoneNumber}</div>
          <div
            className='text-blue-800 hover:text-blue-700 font-medium cursor-pointer'
            onClick={handleNumberChange}
          >
            Change number
          </div>
        </div>
      ) : null}
      {user ? null : (
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
        <div className='flex flex-row gap-x-1'>
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
        <div className='text-green-600 font-semibold'>
          Phone number verified
        </div>
      )}
      <div className='text-gray-600 font-medium'>
        This is only for verification purposes. The barber will contact you on this number if they are sick. You will not be sent any marketing SMS, and this number will not be shared.
      </div>
      {appDetails.telNo.length === 9 || appDetails.telNo.length === 0 ? "" : (
        <div className='text-red-600 font-medium'>
          Number must be 9 digits
        </div>
      )}
      {(/^\d+$/.test(appDetails.telNo) || appDetails.telNo.length === 0) ? "" : (
        <div className='text-red-600 font-medium'>
          Number must contain only numbers
        </div>
      )}
    </div>
  );
};

export default PhoneNumber;
