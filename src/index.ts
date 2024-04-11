import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCtoK17g8F0Tad-oRAP6QM2xMHemfmAkBI",
  authDomain: "bookings-d59d0.firebaseapp.com",
  projectId: "bookings-d59d0",
  storageBucket: "bookings-d59d0.appspot.com",
  messagingSenderId: "311927453150",
  appId: "1:311927453150:web:995df3a1beb606f055d94f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);