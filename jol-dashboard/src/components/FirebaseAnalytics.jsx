"use client";

import { useEffect } from "react";
import { initAnalytics } from "@/lib/firebase";

// Renders nothing — its only job is to boot Firebase Analytics in the browser
// once the app has mounted. Drop it anywhere inside the client tree (it lives
// in the root layout so page views are tracked everywhere).
export default function FirebaseAnalytics() {
  useEffect(() => {
    initAnalytics();
  }, []);

  return null;
}
