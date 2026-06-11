// Firebase initialization for Jol Energy.
//
// The web config below is safe to ship in client code — these are public
// project identifiers, not secrets. Access is gated by Firebase Security
// Rules, not by hiding this object.
// https://firebase.google.com/docs/projects/api-keys#api-keys-for-firebase-are-different
//
// To use a Firebase product later, import the matching helper here and export
// a getter (e.g. `getFirestore(app)`, `getAuth(app)`), then consume it from a
// client component.

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCKJb3OUxy7LO-D_MSSbWmeZfRTYZ-uOV0",
  authDomain: "jolenergydashboard.firebaseapp.com",
  projectId: "jolenergydashboard",
  storageBucket: "jolenergydashboard.firebasestorage.app",
  messagingSenderId: "568489772121",
  appId: "1:568489772121:web:3948867da6767f977e5d48",
  measurementId: "G-DRG8X6GJXH",
};

// Reuse the existing app instance across HMR reloads and repeated imports so we
// never call initializeApp twice.
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth instance — used by <AuthProvider> and any client component that needs
// the current user. Email/Password must be enabled in the Firebase console
// (Authentication → Sign-in method) for sign-up / sign-in to work.
export const auth = getAuth(app);

// Analytics reads `window`, so it can only run in the browser — and only where
// the platform supports it (it's a no-op in unsupported environments / SSR).
// Call this from a client component's useEffect, never during render or SSR.
export async function initAnalytics() {
  if (typeof window === "undefined") return null;
  const { getAnalytics, isSupported } = await import("firebase/analytics");
  return (await isSupported()) ? getAnalytics(app) : null;
}
