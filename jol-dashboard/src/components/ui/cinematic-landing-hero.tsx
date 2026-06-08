"use client";

import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import Link from "next/link";
import DisplayCards from "@/components/ui/display-cards";
import Bucket from "@/components/ui/bucket";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const JOL_NAV_CARDS = [
  {
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="#60A5FA" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0l-4-4m4 4l-4 4M5 8l-3 3 3 3" />
      </svg>
    ),
    title: "Suppliers",
    description: "40 leads · 12 ton-plus tier",
    date: "Scrap inflow pipeline",
    titleClassName: "text-blue-400",
    href: "/dashboard?tab=suppliers",
    className:
      "[grid-area:stack] hover:-translate-y-6 before:absolute before:w-[100%] before:outline-1 before:rounded-lg before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-black/20 grayscale-[35%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  },
  {
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="#34D399" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Buyers",
    description: "20 buyers · 1,083 MT demand",
    date: "Offtake & revenue pipeline",
    titleClassName: "text-emerald-400",
    href: "/dashboard?tab=buyers",
    className:
      "[grid-area:stack] translate-x-9 translate-y-5 hover:-translate-y-1 before:absolute before:w-[100%] before:outline-1 before:rounded-lg before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-black/20 grayscale-[35%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  },
  {
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="#FBBF24" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    title: "Collection",
    description: "32 points · 3 hub cities",
    date: "Grassroots network map",
    titleClassName: "text-amber-400",
    href: "/dashboard?tab=collection",
    className:
      "[grid-area:stack] translate-x-[72px] translate-y-[18px] hover:translate-y-3 before:absolute before:w-[100%] before:outline-1 before:rounded-lg before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-black/20 grayscale-[35%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  },
  {
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="#A78BFA" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    title: "Market",
    description: "Co · Ni · Li — 30-day signals",
    date: "Metal price intelligence",
    titleClassName: "text-violet-400",
    href: "/dashboard?tab=market",
    className:
      "[grid-area:stack] translate-x-[108px] translate-y-[27px] hover:translate-y-[20px] before:absolute before:w-[100%] before:outline-1 before:rounded-lg before:outline-border before:h-[100%] before:content-[''] before:bg-blend-overlay before:bg-black/20 grayscale-[35%] hover:before:opacity-0 before:transition-opacity before:duration-700 hover:grayscale-0 before:left-0 before:top-0",
  },
  {
    icon: (
      <svg className="w-3.5 h-3.5" fill="none" stroke="#F87171" strokeWidth="2" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
      </svg>
    ),
    title: "AI Insights",
    description: "Claude · streaming chat",
    date: "Intelligent recommendations",
    titleClassName: "text-rose-400",
    href: "/dashboard?tab=ai",
    className:
      "[grid-area:stack] translate-x-[144px] translate-y-[36px] hover:translate-y-[28px]",
  },
];

const INJECTED_STYLES = `
  .gsap-reveal { visibility: hidden; }

  .film-grain {
      position: absolute; inset: 0; width: 100%; height: 100%;
      pointer-events: none; z-index: 50; opacity: 0.04; mix-blend-mode: overlay;
      contain: strict;
      will-change: auto;
      background: url('data:image/svg+xml;utf8,<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"><filter id="noiseFilter"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/></filter><rect width="100%" height="100%" filter="url(%23noiseFilter)"/></svg>');
  }

  .bg-grid-hero {
      background-size: 60px 60px;
      background-image:
          linear-gradient(to right, rgba(24,95,165,0.08) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(24,95,165,0.08) 1px, transparent 1px);
      mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
      -webkit-mask-image: radial-gradient(ellipse at center, black 0%, transparent 70%);
  }

  .text-3d-matte {
      color: #0F172A;
      text-shadow:
          0 10px 30px rgba(15,23,42,0.12),
          0 2px 4px rgba(15,23,42,0.06);
  }

  .text-silver-gradient {
      background: linear-gradient(180deg, #185FA5 0%, #0A3D6B 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      transform: translateZ(0);
      filter:
          drop-shadow(0px 8px 20px rgba(24,95,165,0.25))
          drop-shadow(0px 2px 4px rgba(24,95,165,0.15));
  }

  .text-card-silver-matte {
      background: linear-gradient(180deg, #FFFFFF 0%, #A1A1AA 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      transform: translateZ(0);
      filter:
          drop-shadow(0px 12px 24px rgba(0,0,0,0.8))
          drop-shadow(0px 4px 8px rgba(0,0,0,0.6));
  }

  .premium-depth-card {
      background: linear-gradient(145deg, #102A5C 0%, #060D1A 100%);
      box-shadow:
          0 40px 100px -20px rgba(0,0,0,0.9),
          0 20px 40px -20px rgba(0,0,0,0.8),
          inset 0 1px 2px rgba(255,255,255,0.15),
          inset 0 -2px 4px rgba(0,0,0,0.8);
      border: 1px solid rgba(255,255,255,0.04);
      position: relative;
  }

  .card-sheen {
      position: absolute; inset: 0; border-radius: inherit; pointer-events: none; z-index: 50;
      background: radial-gradient(800px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), rgba(24,95,165,0.08) 0%, transparent 40%);
      mix-blend-mode: screen; transition: opacity 0.3s ease;
      contain: layout style;
      will-change: auto;
  }

  .iphone-bezel {
      background-color: #111;
      box-shadow:
          inset 0 0 0 2px #52525B,
          inset 0 0 0 7px #000,
          0 40px 80px -15px rgba(0,0,0,0.9),
          0 15px 25px -5px rgba(0,0,0,0.7);
      transform-style: preserve-3d;
  }

  .hardware-btn {
      background: linear-gradient(90deg, #404040 0%, #171717 100%);
      box-shadow:
          -2px 0 5px rgba(0,0,0,0.8),
          inset -1px 0 1px rgba(255,255,255,0.15),
          inset 1px 0 2px rgba(0,0,0,0.8);
      border-left: 1px solid rgba(255,255,255,0.05);
  }

  .screen-glare {
      background: linear-gradient(110deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0) 45%);
  }

  .widget-depth {
      background: linear-gradient(180deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%);
      box-shadow:
          0 10px 20px rgba(0,0,0,0.3),
          inset 0 1px 1px rgba(255,255,255,0.05),
          inset 0 -1px 1px rgba(0,0,0,0.5);
      border: 1px solid rgba(255,255,255,0.03);
  }

  .floating-ui-badge {
      background: linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.01) 100%);
      backdrop-filter: blur(24px);
      -webkit-backdrop-filter: blur(24px);
      box-shadow:
          0 0 0 1px rgba(255,255,255,0.1),
          0 25px 50px -12px rgba(0,0,0,0.8),
          inset 0 1px 1px rgba(255,255,255,0.2),
          inset 0 -1px 1px rgba(0,0,0,0.5);
      will-change: transform, opacity;
      transform: translateZ(0);
  }

  .btn-dashboard {
      background: linear-gradient(180deg, #185FA5 0%, #0E3D6E 100%);
      color: #FFFFFF;
      transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
      box-shadow: 0 0 0 1px rgba(255,255,255,0.12), 0 2px 4px rgba(0,0,0,0.4), 0 16px 32px -4px rgba(24,95,165,0.5), inset 0 1px 1px rgba(255,255,255,0.2), inset 0 -3px 6px rgba(0,0,0,0.4);
  }
  .btn-dashboard:hover {
      transform: translateY(-3px);
      background: linear-gradient(180deg, #2270BB 0%, #185FA5 100%);
      box-shadow: 0 0 0 1px rgba(255,255,255,0.15), 0 8px 16px -2px rgba(0,0,0,0.3), 0 24px 48px -6px rgba(24,95,165,0.7), inset 0 1px 1px rgba(255,255,255,0.25), inset 0 -3px 6px rgba(0,0,0,0.4);
  }
  .btn-dashboard:active {
      transform: translateY(1px);
      background: #0E3D6E;
      box-shadow: 0 0 0 1px rgba(255,255,255,0.08), inset 0 3px 8px rgba(0,0,0,0.6);
  }

  .btn-outline-light {
      background: linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%);
      color: #FFFFFF;
      transition: all 0.4s cubic-bezier(0.25, 1, 0.5, 1);
      box-shadow: 0 0 0 1px rgba(255,255,255,0.15), 0 2px 4px rgba(0,0,0,0.3), inset 0 1px 1px rgba(255,255,255,0.1);
  }
  .btn-outline-light:hover {
      transform: translateY(-2px);
      background: linear-gradient(180deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%);
      box-shadow: 0 0 0 1px rgba(255,255,255,0.25), 0 8px 16px rgba(0,0,0,0.4), inset 0 1px 1px rgba(255,255,255,0.15);
  }

  .progress-ring {
      transform: rotate(-90deg);
      transform-origin: center;
      stroke-dasharray: 402;
      stroke-dashoffset: 402;
      stroke-linecap: round;
  }

  .kpi-bar {
      transform-origin: left;
      transform: scaleX(0);
  }
`;

export interface JolHeroProps extends React.HTMLAttributes<HTMLDivElement> {
  dashboardHref?: string;
}

export function CinematicHero({
  dashboardHref = "/dashboard",
  className,
  ...props
}: JolHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mainCardRef = useRef<HTMLDivElement>(null);
  const mockupRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (window.scrollY > window.innerHeight * 2) return;
      cancelAnimationFrame(requestRef.current);
      requestRef.current = requestAnimationFrame(() => {
        if (mainCardRef.current && mockupRef.current) {
          const rect = mainCardRef.current.getBoundingClientRect();
          const mouseX = e.clientX - rect.left;
          const mouseY = e.clientY - rect.top;
          mainCardRef.current.style.setProperty("--mouse-x", `${mouseX}px`);
          mainCardRef.current.style.setProperty("--mouse-y", `${mouseY}px`);
          const xVal = (e.clientX / window.innerWidth - 0.5) * 2;
          const yVal = (e.clientY / window.innerHeight - 0.5) * 2;
          gsap.to(mockupRef.current, {
            rotationY: xVal * 10,
            rotationX: -yVal * 10,
            ease: "power3.out",
            duration: 1.2,
          });
        }
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      cancelAnimationFrame(requestRef.current);
    };
  }, []);

  useEffect(() => {
    const isMobile = window.innerWidth < 768;

    const ctx = gsap.context(() => {
      gsap.set(".text-track", { autoAlpha: 0, y: 60, scale: 0.85, rotationX: -20, willChange: "transform, opacity" });
      gsap.set(".text-days", { autoAlpha: 1, clipPath: "inset(0 100% 0 0)" });
      gsap.set(".main-card", { y: window.innerHeight + 200, autoAlpha: 1 });
      gsap.set([".card-left-text", ".card-right-text", ".mockup-scroll-wrapper", ".floating-badge", ".phone-widget", ".card-nav-cards"], { autoAlpha: 0 });

      const introTl = gsap.timeline({ delay: 0.3 });
      introTl
        .to(".text-track", { duration: 1.8, autoAlpha: 1, y: 0, scale: 1, rotationX: 0, ease: "expo.out" })
        .to(".text-days", { duration: 1.4, clipPath: "inset(0 0% 0 0)", ease: "power4.inOut" }, "-=1.0");

      const scrollTl = gsap.timeline({
        scrollTrigger: {
          trigger: containerRef.current,
          start: "top top",
          end: "+=2000",
          pin: true,
          scrub: 2.0,
          anticipatePin: 1,
          fastScrollEnd: true,
          preventOverlaps: true,
        },
      });

      scrollTl
        .to([".hero-text-wrapper", ".bg-grid-hero"], { scale: 1.15, opacity: 0, force3D: true, ease: "power2.inOut", duration: 2 }, 0)
        .to(".main-card", { y: 0, force3D: true, ease: "power3.inOut", duration: 2 }, 0)
        .to(".main-card", { scale: 1.18, borderRadius: "0px", force3D: true, ease: "power3.inOut", duration: 1.5 })
        .fromTo(".mockup-scroll-wrapper",
          { y: 300, z: -500, rotationX: 50, rotationY: -30, autoAlpha: 0, scale: 0.6 },
          { y: 0, z: 0, rotationX: 0, rotationY: 0, autoAlpha: 1, scale: 1, force3D: true, ease: "expo.out", duration: 2.5 }, "-=0.8"
        )
        .fromTo(".phone-widget", { y: 40, autoAlpha: 0, scale: 0.95 }, { y: 0, autoAlpha: 1, scale: 1, force3D: true, stagger: 0.15, ease: "back.out(1.2)", duration: 1.5 }, "-=1.5")
        .to(".progress-ring", { strokeDashoffset: 80, duration: 2, ease: "power3.inOut" }, "-=1.2")
        .to(".counter-val", { innerHTML: 87, snap: { innerHTML: 1 }, duration: 2, ease: "expo.out" }, "-=2.0")
        .fromTo(".kpi-bar", { scaleX: 0 }, { scaleX: 1, force3D: true, stagger: 0.2, ease: "power3.out", duration: 1.2 }, "-=1.5")
        .fromTo(".floating-badge", { y: 100, autoAlpha: 0, scale: 0.7, rotationZ: -10 }, { y: 0, autoAlpha: 1, scale: 1, rotationZ: 0, force3D: true, ease: "back.out(1.5)", duration: 1.5, stagger: 0.2 }, "-=2.0")
        .fromTo(".card-left-text", { x: -50, autoAlpha: 0 }, { x: 0, autoAlpha: 1, force3D: true, ease: "power4.out", duration: 1.5 }, "-=1.5")
        .fromTo(".card-right-text", { x: 50, autoAlpha: 0, scale: 0.8 }, { x: 0, autoAlpha: 1, scale: 1, force3D: true, ease: "expo.out", duration: 1.5 }, "<")
        .fromTo(".card-nav-cards", { y: 60, autoAlpha: 0 }, { y: 0, autoAlpha: 1, force3D: true, ease: "expo.out", duration: 1.5 }, "-=1.0")
        .to({}, { duration: 2.5 })
        .to([".mockup-scroll-wrapper", ".floating-badge", ".card-left-text", ".card-right-text", ".card-nav-cards"], {
          scale: 0.9, y: -40, z: -200, autoAlpha: 0, force3D: true, ease: "power3.in", duration: 1.2, stagger: 0.05,
        })
        .to(".main-card", { y: -window.innerHeight - 300, force3D: true, ease: "power3.in", duration: 1.5 });

    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-screen h-screen overflow-hidden flex items-center justify-center bg-white text-slate-900 font-sans antialiased",
        className
      )}
      style={{ perspective: "1500px" }}
      {...props}
    >
      <style dangerouslySetInnerHTML={{ __html: INJECTED_STYLES }} />
      <div className="film-grain" aria-hidden="true" />
      <div className="bg-grid-hero absolute inset-0 z-0 pointer-events-none opacity-60" aria-hidden="true" />

      {/* Hero text layer */}
      <div className="hero-text-wrapper absolute z-10 flex flex-col items-center justify-center text-center w-screen px-4 will-change-transform">
        <p className="text-track gsap-reveal text-xs md:text-sm font-semibold tracking-[0.25em] uppercase text-blue-600 mb-4">
          Jol Energy · Business Intelligence
        </p>
        <h1 className="text-track gsap-reveal text-3d-matte text-5xl md:text-7xl lg:text-[6rem] font-bold tracking-tight mb-2">
          Recycle smarter,
        </h1>
        <h1 className="text-days gsap-reveal text-silver-gradient text-5xl md:text-7xl lg:text-[6rem] font-extrabold tracking-tighter">
          decide faster.
        </h1>
      </div>



      {/* Foreground card layer */}
      <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none" style={{ perspective: "1500px" }}>
        <div
          ref={mainCardRef}
          className="main-card premium-depth-card relative overflow-hidden gsap-reveal flex items-center justify-center pointer-events-auto w-[92vw] md:w-[85vw] h-[92vh] md:h-[85vh] rounded-[32px] md:rounded-[40px]"
        >
          <div className="card-sheen" aria-hidden="true" />

          <div className="relative w-full h-full max-w-7xl mx-auto px-4 lg:px-12 flex flex-col justify-evenly lg:grid lg:grid-cols-3 items-center lg:gap-x-8 z-10 py-6 lg:py-4">

            {/* Brand name — top on mobile, right on desktop */}
            <div className="card-right-text gsap-reveal order-1 lg:order-3 flex flex-col items-center lg:items-end justify-center z-20 w-full">
              <div className="text-right">
                <h2 className="text-5xl md:text-[5rem] lg:text-[7rem] font-black uppercase tracking-tighter text-card-silver-matte leading-none">
                  Jol
                </h2>
                <h2 className="text-5xl md:text-[5rem] lg:text-[7rem] font-black uppercase tracking-tighter leading-none"
                  style={{ WebkitTextStroke: "1px rgba(255,255,255,0.3)", color: "transparent" }}>
                  Energy
                </h2>
              </div>

              {/* Small animated "pipeline funnel" below the brand — chips drop into the bucket */}
              <div
                className="hidden lg:block mt-35 pointer-events-none"
                aria-hidden="true"
                style={{
                  // keep chips/funnel legible on the always-dark hero card,
                  // regardless of the visitor's OS light/dark preference
                  ["--color-card" as string]: "#ffffff",
                  ["--color-foreground" as string]: "#111827",
                  ["--color-muted-foreground" as string]: "#5B6472",
                  ["--color-border" as string]: "rgba(17,24,39,0.10)",
                }}
              >
                <div className="relative" style={{ width: 300, height: 178 }}>
                  <div
                    className="absolute right-0 top-0 origin-top-right"
                    style={{ width: 655, transform: "scale(0.46)" }}
                  >
                    <Bucket />
                  </div>
                </div>
              </div>
            </div>

            {/* Center — dashboard mockup */}
            <div className="mockup-scroll-wrapper order-2 lg:order-2 relative w-full h-[380px] lg:h-[600px] flex items-center justify-center z-10" style={{ perspective: "1000px" }}>
              <div className="relative w-full h-full flex items-center justify-center transform scale-[0.65] md:scale-85 lg:scale-100">
                <div
                  ref={mockupRef}
                  className="relative w-[280px] h-[580px] rounded-[3rem] iphone-bezel flex flex-col will-change-transform"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {/* Physical buttons */}
                  <div className="absolute top-[120px] -left-[3px] w-[3px] h-[25px] hardware-btn rounded-l-md z-0" aria-hidden="true" />
                  <div className="absolute top-[160px] -left-[3px] w-[3px] h-[45px] hardware-btn rounded-l-md z-0" aria-hidden="true" />
                  <div className="absolute top-[220px] -left-[3px] w-[3px] h-[45px] hardware-btn rounded-l-md z-0" aria-hidden="true" />
                  <div className="absolute top-[170px] -right-[3px] w-[3px] h-[70px] hardware-btn rounded-r-md z-0" style={{ transform: "scaleX(-1)" }} aria-hidden="true" />

                  {/* Screen */}
                  <div className="absolute inset-[7px] bg-[#050914] rounded-[2.5rem] overflow-hidden text-white z-10" style={{ boxShadow: "inset 0 0 15px rgba(0,0,0,1)" }}>
                    <div className="absolute inset-0 screen-glare z-40 pointer-events-none" aria-hidden="true" />

                    {/* Dynamic Island */}
                    <div className="absolute top-[5px] left-1/2 -translate-x-1/2 w-[100px] h-[28px] bg-black rounded-full z-50 flex items-center justify-end px-3" style={{ boxShadow: "inset 0 -1px 2px rgba(255,255,255,0.1)" }}>
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" style={{ boxShadow: "0 0 8px rgba(34,197,94,0.8)" }} />
                    </div>

                    {/* App content */}
                    <div className="relative w-full h-full pt-12 px-4 pb-6 flex flex-col gap-3">
                      {/* Header */}
                      <div className="phone-widget flex justify-between items-center">
                        <div>
                          <span className="text-[9px] text-neutral-400 uppercase tracking-widest font-bold block mb-0.5">Dashboard</span>
                          <span className="text-base font-bold tracking-tight text-white">Health Score</span>
                        </div>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border border-white/10" style={{ background: "rgba(255,255,255,0.05)" }}>JE</div>
                      </div>

                      {/* Ring gauge */}
                      <div className="phone-widget relative w-36 h-36 mx-auto flex items-center justify-center" style={{ filter: "drop-shadow(0 15px 25px rgba(0,0,0,0.8))" }}>
                        <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
                          <circle cx="72" cy="72" r="56" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="10" />
                          <circle className="progress-ring" cx="72" cy="72" r="56" fill="none" stroke="#185FA5" strokeWidth="10" />
                        </svg>
                        <div className="text-center z-10 flex flex-col items-center">
                          <span className="counter-val text-3xl font-extrabold tracking-tighter text-white">0</span>
                          <span className="text-[7px] text-blue-200/50 uppercase tracking-[0.1em] font-bold mt-0.5">Health</span>
                        </div>
                      </div>

                      {/* KPI bars */}
                      <div className="phone-widget widget-depth rounded-xl p-3 space-y-2.5">
                        {[
                          { label: "Suppliers", pct: 0.72, color: "#185FA5" },
                          { label: "Buyers", pct: 0.58, color: "#0A7864" },
                          { label: "Collection", pct: 0.85, color: "#B45309" },
                        ].map((item) => (
                          <div key={item.label}>
                            <div className="flex justify-between mb-1">
                              <span className="text-[9px] text-neutral-400 font-medium">{item.label}</span>
                              <span className="text-[9px] text-white font-bold">{Math.round(item.pct * 100)}%</span>
                            </div>
                            <div className="h-1.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
                              <div
                                className="kpi-bar h-full rounded-full"
                                style={{ width: `${item.pct * 100}%`, background: item.color }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Alert widget */}
                      <div className="phone-widget widget-depth rounded-xl p-3 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center border border-amber-400/20 shrink-0" style={{ background: "rgba(180,83,9,0.15)" }}>
                          <svg className="w-4 h-4 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[9px] text-white font-semibold truncate">15 stale leads</div>
                          <div className="text-[8px] text-neutral-500">Needs follow-up</div>
                        </div>
                      </div>

                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[100px] h-[4px] rounded-full" style={{ background: "rgba(255,255,255,0.2)" }} />
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="floating-badge absolute flex top-6 lg:top-10 left-[-15px] lg:left-[-80px] floating-ui-badge rounded-xl lg:rounded-2xl p-3 lg:p-4 items-center gap-3 z-30">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center border border-blue-400/30" style={{ background: "linear-gradient(180deg, rgba(24,95,165,0.2) 0%, rgba(10,61,110,0.1) 100%)" }}>
                    <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white text-xs lg:text-sm font-bold tracking-tight">40 Suppliers</p>
                    <p className="text-blue-200/50 text-[10px] lg:text-xs font-medium">Pipeline active</p>
                  </div>
                </div>

                <div className="floating-badge absolute flex bottom-12 lg:bottom-16 right-[-15px] lg:right-[-80px] floating-ui-badge rounded-xl lg:rounded-2xl p-3 lg:p-4 items-center gap-3 z-30">
                  <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full flex items-center justify-center border border-teal-400/30" style={{ background: "linear-gradient(180deg, rgba(10,120,100,0.2) 0%, rgba(5,80,65,0.1) 100%)" }}>
                    <svg className="w-4 h-4 text-teal-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white text-xs lg:text-sm font-bold tracking-tight">AI Insights</p>
                    <p className="text-blue-200/50 text-[10px] lg:text-xs font-medium">Claude-powered</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Left text — bottom on mobile, left on desktop */}
            <div className="card-left-text gsap-reveal order-3 lg:order-1 flex flex-col justify-center text-center lg:text-left z-20 w-full px-4 lg:px-0">
              <h3 className="text-white text-2xl md:text-3xl lg:text-3xl font-bold mb-3 tracking-tight leading-tight">
                Intelligence for the circular economy.
              </h3>
              <p className="hidden md:block text-blue-100/60 text-sm font-normal leading-relaxed max-w-sm lg:max-w-none mb-5">
                <span className="text-white font-semibold">Jol Energy</span> brings together supplier inflows, buyer pipelines, geo-mapped collection networks, and live metal-market prices — all in one living dashboard driven by Claude AI.
              </p>
              <Link
                href={dashboardHref}
                className="btn-dashboard hidden md:inline-flex items-center gap-3 px-7 py-3 rounded-[1rem] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 focus:ring-offset-transparent self-start lg:self-start"
                aria-label="Open dashboard"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.5V19a1 1 0 001 1h5.5M3 13.5V5a1 1 0 011-1h5.5M3 13.5H9m0 0v6.5M9 13.5V4.5M14.5 4.5H20a1 1 0 011 1v5.5M14.5 4.5V10m5.5 0H14.5m0 0v9.5a1 1 0 001 1H20a1 1 0 001-1V10" />
                </svg>
                Open Dashboard
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
              </Link>

              <div className="hidden md:flex mt-5 items-center gap-2 text-[11px] font-medium text-blue-200/70 bg-[#185FA5]/10 w-max px-3 py-1.5 rounded-full border border-blue-400/20 backdrop-blur-sm self-start lg:self-start tracking-wide">
                <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Auth & other features in development
              </div>
            </div>

            {/* Nav cards — absolute at bottom-left so they're never clipped by grid cell */}
            <div className="card-nav-cards gsap-reveal absolute bottom-20 left-10 hidden lg:block z-30">
              <DisplayCards cards={JOL_NAV_CARDS} />
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
