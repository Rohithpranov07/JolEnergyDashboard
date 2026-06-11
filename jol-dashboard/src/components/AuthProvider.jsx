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
  // Loading until Firebase reports the initial auth state, so guards don't
  // bounce a signed-in user to /login before the SDK rehydrates. If auth isn't
  // configured (null), there's nothing to wait for — start un-loaded.
  const [loading, setLoading] = useState(Boolean(auth));

  useEffect(() => {
    // `auth` is null when Firebase isn't configured (missing env vars); there's
    // nothing to subscribe to, and `loading` already starts false in that case.
    if (!auth) return;
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const ensureAuth = () => {
    if (!auth) {
      throw new Error(
        "Firebase Auth isn't configured — set the NEXT_PUBLIC_FIREBASE_* env vars.",
      );
    }
    return auth;
  };

  const value = {
    user,
    loading,
    signUp: (email, password) =>
      createUserWithEmailAndPassword(ensureAuth(), email, password),
    signIn: (email, password) =>
      signInWithEmailAndPassword(ensureAuth(), email, password),
    signInWithGoogle: () => signInWithPopup(ensureAuth(), googleProvider),
    signOutUser: () => signOut(ensureAuth()),
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
