"use client";

import { useEffect } from "react";
import Lenis from "lenis";
import { ScrollTrigger } from "gsap/ScrollTrigger";

export default function SmoothScroll({ children }) {
  useEffect(() => {
    const lenis = new Lenis({
      lerp: 0.15, // Faster interpolation
      direction: "vertical", 
      gestureDirection: "vertical", 
      smooth: true,
      mouseMultiplier: 1,
      wheelMultiplier: 1.5, // Amplifies mouse wheel speed by 50%
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    });

    let tickerCallback = null;
    let gsapInstance = null;
    let isUnmounted = false;

    // Sync Lenis with GSAP's ticker to avoid jitter when using ScrollTrigger
    import("gsap").then((gsapModule) => {
      if (isUnmounted) return;
      gsapInstance = gsapModule.default || gsapModule;
      
      lenis.on("scroll", ScrollTrigger.update);
      
      tickerCallback = (time) => {
        lenis.raf(time * 1000);
      };
      
      gsapInstance.ticker.add(tickerCallback);
      gsapInstance.ticker.lagSmoothing(0);
    }).catch(() => {
      if (isUnmounted) return;
      // Fallback if GSAP isn't loaded on a page
      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }
      requestAnimationFrame(raf);
    });

    return () => {
      isUnmounted = true;
      if (gsapInstance && tickerCallback) {
        gsapInstance.ticker.remove(tickerCallback);
      }
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
