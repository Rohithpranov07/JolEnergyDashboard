"use client";

import { createContext, useContext, useEffect, useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { auth } from "@/lib/firebase";

const AuthContext = createContext(null);

// One provider instance for the whole app. Enable Google in the Firebase
// console (Authentication → Sign-in method) for the popup to succeed.
const googleProvider = new GoogleAuthProvider();

/**
 * Subscribes to Firebase auth state once and shares the current user +
 * auth actions with the whole client tree. Mounted in the root layout.
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // `loading` is true until Firebase reports the initial auth state, so guards
  // don't bounce a signed-in user to /login before the SDK has rehydrated.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    user,
    loading,
    signUp: (email, password) =>
      createUserWithEmailAndPassword(auth, email, password),
    signIn: (email, password) =>
      signInWithEmailAndPassword(auth, email, password),
    signInWithGoogle: () => signInWithPopup(auth, googleProvider),
    signOutUser: () => signOut(auth),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (ctx === null) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
