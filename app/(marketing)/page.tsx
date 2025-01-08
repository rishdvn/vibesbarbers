'use client';
import React from 'react';
// import { Facebook, Instagram } from 'lucide-react';
import {facebook} from 'react-icons-kit/icomoon/facebook'
import {instagram} from 'react-icons-kit/fa/instagram'
import Icon from 'react-icons-kit'; // Make sure to import the Icon component
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '@/src/index';
import { signOut } from 'firebase/auth';
import Link from 'next/link';

const BarberLanding = () => {
  const [user] = useAuthState(auth);

  return (
    <div className="min-h-screen max-w-screen-md mx-auto bg-black text-white ">
      {/* Navigation */}
      <nav className="p-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <img 
            src="/black_logo_vibes.png" 
            alt="Vibes Barbers Logo" 
            className="h-8 w-auto invert filter contrast-125 brightness-90"
          />
          <span className="text-xl font-bold">VIBES BARBERS</span>
        </div>
        
        <div className="flex items-center space-x-4"> 
          <Link
            href="https://www.facebook.com/p/Vibes-Barber-Salon-100063536052389/"
          >
            <Icon icon={facebook} size={24} />
          </Link>
          
          <Link
            href="https://www.instagram.com/vibesbarbersalon/?hl=en"
          >
            <Icon icon={instagram} size={24} />
          </Link>
          {user ? (
            <div className="flex items-center space-x-2">
              {/* {user.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt="Profile" 
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-gray-600 flex items-center justify-center">
                  {user.email?.[0]?.toUpperCase() || 'U'}
                </div>
              )} */}
              <button 
                onClick={() => signOut(auth)}
                className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200"
              >
                Logout
              </button>
            </div>
          ) : (
            <Link href="/login">
              <button className="bg-white text-black px-4 py-2 rounded hover:bg-gray-200">
                LOGIN
              </button>
            </Link>
          )}
        </div>
      </nav>

      {/* Main Content */}
      <div className="container mx-auto px-4 ">
        {/* Central */}
        <div className="flex flex-col min-h-[calc(100vh-4rem)]">
          <div className="flex-grow relative">
            
            {/* Background Image Placeholder */}
            <div className="w-full h-full bg-gray-800 rounded-lg overflow-hidden">
              <img
                src="/landing.png"
                alt="Barber shop atmosphere"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-black py-4">
            {/* Tagline and CTA */}
            <div className="text-center">
              <p className="text-xl mb-6">Where passion meets quality</p>
              <Link href={user ? "/make-booking" : "/login"}>
                <button className="bg-white text-black px-8 py-3 rounded-md font-bold hover:bg-gray-200 transition-colors">
                  BOOK NOW
                </button>
              </Link>
              {user && (
                <Link href="/bookings">
                  <button className="bg-white text-black px-8 py-3 rounded-md font-bold hover:bg-gray-200 transition-colors ml-4">
                    BOOKINGS
                  </button>
                </Link>
              )}
            </div>

            {/* Reviews */}
            <div className="flex justify-center items-center mt-8 space-x-2">
              {[...Array(5)].map((_, i) => (
                <svg key={i} className="w-6 h-6 text-yellow-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              ))}
              <span className="ml-2 text-gray-300">4.8/5 BY 183 REVIEWS</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarberLanding;