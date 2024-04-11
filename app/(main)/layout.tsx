"use client";

import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../../src/index.ts'
import { useRouter } from 'next/navigation';
import Sidebar from './_components/sidebar.tsx';
import Image from 'next/image.js';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { BackgroundGradientAnimation } from '../(marketing)/_components/background-gradient-animation.tsx';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, loading, error] = useAuthState(auth);

  if (loading) {
    return (
      <div
        className='flex items-center justify-center h-screen w-screen bg-gray-100'
      >
          <Image className="" width={60} height={60} src="/black_logo_vibes.png" alt="logo" />
      </div>
    )
  }

  return (
    <Sidebar>
        {children}
    </Sidebar>
  );
}