"use client";

import { createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "firebase/auth";
import { createContext, useContext, useEffect, useState } from "react";

import { auth, db } from '../index.ts'
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { usePathname, useRouter } from "next/navigation.js";


const UserContext = createContext({});

export const AuthContextProvider = ({ children }: { children: React.ReactNode}) => {
  const router = useRouter();
  const pathName = usePathname();
  // 1. SIGN UP AND SIGN OUT STATES
  // Create a new user
  const createUser = (email, password) => {
      return createUserWithEmailAndPassword(auth, email, password)
  }
  
  // Sign a user out
  const signUserOut = () => {
      signOut(auth).then(() => {
          console.log('User signed out')
        }).catch((error) => {
          console.log(error.errorMessage)
        });
  }
   
  // 2. GET USER PROFILE DATA
  const [user, setUser] = useState(null);

  // Listen for user state changes
  useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
              setUser(user);
          } else {
              setUser(null)
              if (pathName !== '/login' && pathName !== '/signup' && pathName !== '/booking') {
                router.push('/')
              }
          }
      });
  
      // Cleanup subscription on unmount
      return () => unsubscribe();
  },[])

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
        }
      })();
    }
  }, [user]);
  
  return (
      <UserContext.Provider value={{createUser,user,signUserOut,userProfile,userDocId}}>
          {children}
      </UserContext.Provider>
  )
}

export const useUserAuth = () => {
    return useContext(UserContext)
}