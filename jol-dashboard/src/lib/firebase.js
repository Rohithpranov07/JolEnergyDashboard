// Firebase initialization for Jol Energy.
//
// The web config comes from NEXT_PUBLIC_FIREBASE_* env vars (see .env.example).
// Firebase web keys aren't secrets — security is enforced by Firebase rules and
// authorized domains, not by hiding the key — but GitHub secret scanning flags
// any hardcoded `AIza…` Google API key, so we keep it out of source. These vars
// are inlined into the client bundle at build time, which is expected for a
// browser SDK.
//
// To use a Firebase product later, import the matching helper here and export
// a getter (e.g. `getFirestore(app)`, `getAuth(app)`), then consume it from a
// client component.

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Reuse the existing app instance across HMR reloads and repeated imports so we
// never call initializeApp twice.
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Auth instance — used by <AuthProvider> and any client component that needs
// the current user. Email/Password must be enabled in the Firebase console
// (Authentication → Sign-in method) for sign-up / sign-in to work.
//
// getAuth() throws `auth/invalid-api-key` when the config is missing — which
// happens during a build/prerender before the NEXT_PUBLIC_FIREBASE_* env vars
// are set (e.g. a first Vercel deploy). Guard it so the build never crashes;
// `auth` is null until the env vars are configured, and consumers handle that.
export const auth = (() => {
  try {
    return getAuth(app);
  } catch {
    return null;
  }
})();

// Analytics reads `window`, so it can only run in the browser — and only where
// the platform supports it (it's a no-op in unsupported environments / SSR).
// Call this from a client component's useEffect, never during render or SSR.
export async function initAnalytics() {
  if (typeof window === "undefined") return null;
  const { getAnalytics, isSupported } = await import("firebase/analytics");
  return (await isSupported()) ? getAnalytics(app) : null;
}
