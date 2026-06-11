"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  sendPasswordResetEmail,
} from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";

// Friendly copy for the Firebase auth error codes we expect.
const ERROR_COPY: Record<string, string> = {
  "auth/invalid-email": "That email address looks invalid.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/user-not-found": "No account found with that email.",
  "auth/wrong-password": "Incorrect password.",
  "auth/invalid-credential": "Incorrect email or password.",
  "auth/email-already-in-use": "An account already exists with that email.",
  "auth/weak-password": "Password should be at least 6 characters.",
  "auth/too-many-requests": "Too many attempts — try again in a moment.",
  "auth/network-request-failed": "Network error. Check your connection.",
  "auth/operation-not-allowed":
    "This sign-in method isn't enabled yet. Turn it on in the Firebase console.",
  "auth/configuration-not-found":
    "Firebase Auth isn't configured yet — enable the provider in the console.",
  "auth/popup-blocked":
    "Popup blocked — allow popups for this site and try again.",
  "auth/account-exists-with-different-credential":
    "An account already exists with this email using a different sign-in method.",
  "auth/unauthorized-domain":
    "This domain isn't authorized for sign-in in the Firebase console.",
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.04 12.26c0-.86-.08-1.69-.22-2.49H12v4.71h6.19c-.27 1.44-1.08 2.66-2.3 3.48v2.89h3.72c2.18-2.01 3.43-4.97 3.43-8.59z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.1 0 5.7-1.03 7.6-2.79l-3.72-2.89c-1.03.69-2.35 1.1-3.88 1.1-2.98 0-5.5-2.01-6.4-4.72H1.76v2.98C3.65 21.42 7.55 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.6 14.7A7.2 7.2 0 0 1 5.22 12c0-.94.16-1.85.38-2.7V6.32H1.76A12 12 0 0 0 .48 12c0 1.94.46 3.77 1.28 5.39l3.84-2.69z"
      />
      <path
        fill="#EA4335"
        d="M12 4.77c1.68 0 3.19.58 4.38 1.71l3.29-3.29C17.7 1.19 15.1 0 12 0 7.55 0 3.65 2.58 1.76 6.32l3.84 2.98C6.5 6.58 9.02 4.77 12 4.77z"
      />
    </svg>
  );
}

const nextDest = () =>
  (typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("next")) ||
  "/dashboard";

interface PupilProps {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
  forceLookX?: number;
  forceLookY?: number;
}

const Pupil = ({
  size = 12,
  maxDistance = 5,
  pupilColor = "black",
  forceLookX,
  forceLookY,
}: PupilProps) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const pupilRef = useRef<HTMLDivElement>(null);

  // Compute the look offset inside the mousemove handler (refs may be read in
  // event handlers, never during render).
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!pupilRef.current) return;
      const pupil = pupilRef.current.getBoundingClientRect();
      const deltaX = e.clientX - (pupil.left + pupil.width / 2);
      const deltaY = e.clientY - (pupil.top + pupil.height / 2);
      const distance = Math.min(
        Math.sqrt(deltaX ** 2 + deltaY ** 2),
        maxDistance,
      );
      const angle = Math.atan2(deltaY, deltaX);
      setOffset({ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [maxDistance]);

  // A forced look direction overrides mouse tracking.
  const pupilPosition =
    forceLookX !== undefined && forceLookY !== undefined
      ? { x: forceLookX, y: forceLookY }
      : offset;

  return (
    <div
      ref={pupilRef}
      className="rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
        transition: "transform 0.1s ease-out",
      }}
    />
  );
};

interface EyeBallProps {
  size?: number;
  pupilSize?: number;
  maxDistance?: number;
  eyeColor?: string;
  pupilColor?: string;
  isBlinking?: boolean;
  forceLookX?: number;
  forceLookY?: number;
}

const EyeBall = ({
  size = 48,
  pupilSize = 16,
  maxDistance = 10,
  eyeColor = "white",
  pupilColor = "black",
  isBlinking = false,
  forceLookX,
  forceLookY,
}: EyeBallProps) => {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const eyeRef = useRef<HTMLDivElement>(null);

  // Compute the look offset inside the mousemove handler (refs may be read in
  // event handlers, never during render).
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!eyeRef.current) return;
      const eye = eyeRef.current.getBoundingClientRect();
      const deltaX = e.clientX - (eye.left + eye.width / 2);
      const deltaY = e.clientY - (eye.top + eye.height / 2);
      const distance = Math.min(
        Math.sqrt(deltaX ** 2 + deltaY ** 2),
        maxDistance,
      );
      const angle = Math.atan2(deltaY, deltaX);
      setOffset({ x: Math.cos(angle) * distance, y: Math.sin(angle) * distance });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [maxDistance]);

  // A forced look direction overrides mouse tracking.
  const pupilPosition =
    forceLookX !== undefined && forceLookY !== undefined
      ? { x: forceLookX, y: forceLookY }
      : offset;

  return (
    <div
      ref={eyeRef}
      className="rounded-full flex items-center justify-center transition-all duration-150"
      style={{
        width: `${size}px`,
        height: isBlinking ? "2px" : `${size}px`,
        backgroundColor: eyeColor,
        overflow: "hidden",
      }}
    >
      {!isBlinking && (
        <div
          className="rounded-full"
          style={{
            width: `${pupilSize}px`,
            height: `${pupilSize}px`,
            backgroundColor: pupilColor,
            transform: `translate(${pupilPosition.x}px, ${pupilPosition.y}px)`,
            transition: "transform 0.1s ease-out",
          }}
        />
      )}
    </div>
  );
};

function LoginPage() {
  const router = useRouter();
  const { user, loading, signIn, signUp, signInWithGoogle } = useAuth();

  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [positions, setPositions] = useState({
    purple: { faceX: 0, faceY: 0, bodySkew: 0 },
    black: { faceX: 0, faceY: 0, bodySkew: 0 },
    yellow: { faceX: 0, faceY: 0, bodySkew: 0 },
    orange: { faceX: 0, faceY: 0, bodySkew: 0 },
  });
  const [isPurpleBlinking, setIsPurpleBlinking] = useState(false);
  const [isBlackBlinking, setIsBlackBlinking] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isLookingAtEachOther, setIsLookingAtEachOther] = useState(false);
  const [isPurplePeeking, setIsPurplePeeking] = useState(false);
  const purpleRef = useRef<HTMLDivElement>(null);
  const blackRef = useRef<HTMLDivElement>(null);
  const yellowRef = useRef<HTMLDivElement>(null);
  const orangeRef = useRef<HTMLDivElement>(null);

  const isSignup = mode === "signup";

  // Already signed in? Skip the form and go where they were headed.
  useEffect(() => {
    if (!loading && user) router.replace(nextDest());
  }, [loading, user, router]);

  // Recompute each character's lean/face offset from the cursor. All ref reads
  // happen inside the handler, so nothing touches a ref during render.
  useEffect(() => {
    const calc = (
      ref: React.RefObject<HTMLDivElement | null>,
      e: MouseEvent,
    ) => {
      if (!ref.current) return { faceX: 0, faceY: 0, bodySkew: 0 };
      const rect = ref.current.getBoundingClientRect();
      const deltaX = e.clientX - (rect.left + rect.width / 2);
      const deltaY = e.clientY - (rect.top + rect.height / 3);
      return {
        faceX: Math.max(-15, Math.min(15, deltaX / 20)),
        faceY: Math.max(-10, Math.min(10, deltaY / 30)),
        bodySkew: Math.max(-6, Math.min(6, -deltaX / 120)),
      };
    };

    const handleMouseMove = (e: MouseEvent) => {
      setPositions({
        purple: calc(purpleRef, e),
        black: calc(blackRef, e),
        yellow: calc(yellowRef, e),
        orange: calc(orangeRef, e),
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Blinking effect for purple character
  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000; // Random between 3-7 seconds

    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(() => {
        setIsPurpleBlinking(true);
        setTimeout(() => {
          setIsPurpleBlinking(false);
          scheduleBlink();
        }, 150); // Blink duration 150ms
      }, getRandomBlinkInterval());

      return blinkTimeout;
    };

    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  // Blinking effect for black character
  useEffect(() => {
    const getRandomBlinkInterval = () => Math.random() * 4000 + 3000; // Random between 3-7 seconds

    const scheduleBlink = () => {
      const blinkTimeout = setTimeout(() => {
        setIsBlackBlinking(true);
        setTimeout(() => {
          setIsBlackBlinking(false);
          scheduleBlink();
        }, 150); // Blink duration 150ms
      }, getRandomBlinkInterval());

      return blinkTimeout;
    };

    const timeout = scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  // Trigger the "look at each other" beat from the focus handler rather than an
  // effect (avoids a synchronous setState in an effect body).
  const lookTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleFieldFocus = () => {
    setIsTyping(true);
    setIsLookingAtEachOther(true);
    if (lookTimer.current) clearTimeout(lookTimer.current);
    lookTimer.current = setTimeout(() => setIsLookingAtEachOther(false), 800);
  };
  const handleFieldBlur = () => {
    setIsTyping(false);
    setIsLookingAtEachOther(false);
    if (lookTimer.current) clearTimeout(lookTimer.current);
  };
  useEffect(
    () => () => {
      if (lookTimer.current) clearTimeout(lookTimer.current);
    },
    [],
  );

  // Purple sneaky peeking while the password is typed and visible. All state
  // updates happen inside timers (never synchronously in the effect body), and
  // when the condition is false the peek value simply isn't read, so there's
  // nothing to reset.
  useEffect(() => {
    if (!(password.length > 0 && showPassword)) return;

    let active = true;
    let timer: ReturnType<typeof setTimeout>;

    const loop = () => {
      timer = setTimeout(
        () => {
          if (!active) return;
          setIsPurplePeeking(true);
          timer = setTimeout(() => {
            if (!active) return;
            setIsPurplePeeking(false);
            loop();
          }, 800); // Peek for 800ms
        },
        Math.random() * 3000 + 2000, // Random peek every 2-5 seconds
      );
    };

    loop();
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [password, showPassword]);

  const purplePos = positions.purple;
  const blackPos = positions.black;
  const yellowPos = positions.yellow;
  const orangePos = positions.orange;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setIsLoading(true);

    try {
      // "Remember for 30 days" → persist across browser restarts; otherwise the
      // session ends when the tab/window closes.
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence,
      );
      if (isSignup) await signUp(email, password);
      else await signIn(email, password);
      router.replace(nextDest());
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      setError(ERROR_COPY[code] || "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError("");
    setInfo("");
    setGoogleLoading(true);
    try {
      await setPersistence(
        auth,
        remember ? browserLocalPersistence : browserSessionPersistence,
      );
      await signInWithGoogle();
      router.replace(nextDest());
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      // Dismissing the popup isn't an error worth shouting about.
      if (
        code !== "auth/popup-closed-by-user" &&
        code !== "auth/cancelled-popup-request"
      ) {
        setError(ERROR_COPY[code] || "Google sign-in failed. Please try again.");
      }
      setGoogleLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setInfo("");
    if (!email) {
      setError("Enter your email above first, then tap “Forgot password”.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setInfo("Password reset email sent — check your inbox.");
    } catch (err) {
      const code = (err as { code?: string })?.code ?? "";
      setError(ERROR_COPY[code] || "Couldn't send a reset email.");
    }
  };

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Content Section */}
      <div className="relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-12 text-primary-foreground">
        <div className="relative z-20">
          <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
            <div className="size-8 rounded-lg bg-primary-foreground/10 backdrop-blur-sm flex items-center justify-center">
              <Sparkles className="size-4" />
            </div>
            <span>Jol Energy</span>
          </Link>
        </div>

        <div className="relative z-20 flex items-end justify-center h-[500px]">
          {/* Cartoon Characters */}
          <div className="relative" style={{ width: "550px", height: "400px" }}>
            {/* Purple tall rectangle character - Back layer */}
            <div
              ref={purpleRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: "70px",
                width: "180px",
                height:
                  isTyping || (password.length > 0 && !showPassword)
                    ? "440px"
                    : "400px",
                backgroundColor: "#6C3FF5",
                borderRadius: "10px 10px 0 0",
                zIndex: 1,
                transform:
                  password.length > 0 && showPassword
                    ? `skewX(0deg)`
                    : isTyping || (password.length > 0 && !showPassword)
                      ? `skewX(${(purplePos.bodySkew || 0) - 12}deg) translateX(40px)`
                      : `skewX(${purplePos.bodySkew || 0}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              {/* Eyes */}
              <div
                className="absolute flex gap-8 transition-all duration-700 ease-in-out"
                style={{
                  left:
                    password.length > 0 && showPassword
                      ? `${20}px`
                      : isLookingAtEachOther
                        ? `${55}px`
                        : `${45 + purplePos.faceX}px`,
                  top:
                    password.length > 0 && showPassword
                      ? `${35}px`
                      : isLookingAtEachOther
                        ? `${65}px`
                        : `${40 + purplePos.faceY}px`,
                }}
              >
                <EyeBall
                  size={18}
                  pupilSize={7}
                  maxDistance={5}
                  eyeColor="white"
                  pupilColor="#2D2D2D"
                  isBlinking={isPurpleBlinking}
                  forceLookX={
                    password.length > 0 && showPassword
                      ? isPurplePeeking
                        ? 4
                        : -4
                      : isLookingAtEachOther
                        ? 3
                        : undefined
                  }
                  forceLookY={
                    password.length > 0 && showPassword
                      ? isPurplePeeking
                        ? 5
                        : -4
                      : isLookingAtEachOther
                        ? 4
                        : undefined
                  }
                />
                <EyeBall
                  size={18}
                  pupilSize={7}
                  maxDistance={5}
                  eyeColor="white"
                  pupilColor="#2D2D2D"
                  isBlinking={isPurpleBlinking}
                  forceLookX={
                    password.length > 0 && showPassword
                      ? isPurplePeeking
                        ? 4
                        : -4
                      : isLookingAtEachOther
                        ? 3
                        : undefined
                  }
                  forceLookY={
                    password.length > 0 && showPassword
                      ? isPurplePeeking
                        ? 5
                        : -4
                      : isLookingAtEachOther
                        ? 4
                        : undefined
                  }
                />
              </div>
            </div>

            {/* Black tall rectangle character - Middle layer */}
            <div
              ref={blackRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: "240px",
                width: "120px",
                height: "310px",
                backgroundColor: "#2D2D2D",
                borderRadius: "8px 8px 0 0",
                zIndex: 2,
                transform:
                  password.length > 0 && showPassword
                    ? `skewX(0deg)`
                    : isLookingAtEachOther
                      ? `skewX(${(blackPos.bodySkew || 0) * 1.5 + 10}deg) translateX(20px)`
                      : isTyping || (password.length > 0 && !showPassword)
                        ? `skewX(${(blackPos.bodySkew || 0) * 1.5}deg)`
                        : `skewX(${blackPos.bodySkew || 0}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              {/* Eyes */}
              <div
                className="absolute flex gap-6 transition-all duration-700 ease-in-out"
                style={{
                  left:
                    password.length > 0 && showPassword
                      ? `${10}px`
                      : isLookingAtEachOther
                        ? `${32}px`
                        : `${26 + blackPos.faceX}px`,
                  top:
                    password.length > 0 && showPassword
                      ? `${28}px`
                      : isLookingAtEachOther
                        ? `${12}px`
                        : `${32 + blackPos.faceY}px`,
                }}
              >
                <EyeBall
                  size={16}
                  pupilSize={6}
                  maxDistance={4}
                  eyeColor="white"
                  pupilColor="#2D2D2D"
                  isBlinking={isBlackBlinking}
                  forceLookX={
                    password.length > 0 && showPassword
                      ? -4
                      : isLookingAtEachOther
                        ? 0
                        : undefined
                  }
                  forceLookY={
                    password.length > 0 && showPassword
                      ? -4
                      : isLookingAtEachOther
                        ? -4
                        : undefined
                  }
                />
                <EyeBall
                  size={16}
                  pupilSize={6}
                  maxDistance={4}
                  eyeColor="white"
                  pupilColor="#2D2D2D"
                  isBlinking={isBlackBlinking}
                  forceLookX={
                    password.length > 0 && showPassword
                      ? -4
                      : isLookingAtEachOther
                        ? 0
                        : undefined
                  }
                  forceLookY={
                    password.length > 0 && showPassword
                      ? -4
                      : isLookingAtEachOther
                        ? -4
                        : undefined
                  }
                />
              </div>
            </div>

            {/* Orange semi-circle character - Front left */}
            <div
              ref={orangeRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: "0px",
                width: "240px",
                height: "200px",
                zIndex: 3,
                backgroundColor: "#FF9B6B",
                borderRadius: "120px 120px 0 0",
                transform:
                  password.length > 0 && showPassword
                    ? `skewX(0deg)`
                    : `skewX(${orangePos.bodySkew || 0}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              {/* Eyes - just pupils, no white */}
              <div
                className="absolute flex gap-8 transition-all duration-200 ease-out"
                style={{
                  left:
                    password.length > 0 && showPassword
                      ? `${50}px`
                      : `${82 + (orangePos.faceX || 0)}px`,
                  top:
                    password.length > 0 && showPassword
                      ? `${85}px`
                      : `${90 + (orangePos.faceY || 0)}px`,
                }}
              >
                <Pupil
                  size={12}
                  maxDistance={5}
                  pupilColor="#2D2D2D"
                  forceLookX={password.length > 0 && showPassword ? -5 : undefined}
                  forceLookY={password.length > 0 && showPassword ? -4 : undefined}
                />
                <Pupil
                  size={12}
                  maxDistance={5}
                  pupilColor="#2D2D2D"
                  forceLookX={password.length > 0 && showPassword ? -5 : undefined}
                  forceLookY={password.length > 0 && showPassword ? -4 : undefined}
                />
              </div>
            </div>

            {/* Yellow tall rectangle character - Front right */}
            <div
              ref={yellowRef}
              className="absolute bottom-0 transition-all duration-700 ease-in-out"
              style={{
                left: "310px",
                width: "140px",
                height: "230px",
                backgroundColor: "#E8D754",
                borderRadius: "70px 70px 0 0",
                zIndex: 4,
                transform:
                  password.length > 0 && showPassword
                    ? `skewX(0deg)`
                    : `skewX(${yellowPos.bodySkew || 0}deg)`,
                transformOrigin: "bottom center",
              }}
            >
              {/* Eyes - just pupils, no white */}
              <div
                className="absolute flex gap-6 transition-all duration-200 ease-out"
                style={{
                  left:
                    password.length > 0 && showPassword
                      ? `${20}px`
                      : `${52 + (yellowPos.faceX || 0)}px`,
                  top:
                    password.length > 0 && showPassword
                      ? `${35}px`
                      : `${40 + (yellowPos.faceY || 0)}px`,
                }}
              >
                <Pupil
                  size={12}
                  maxDistance={5}
                  pupilColor="#2D2D2D"
                  forceLookX={password.length > 0 && showPassword ? -5 : undefined}
                  forceLookY={password.length > 0 && showPassword ? -4 : undefined}
                />
                <Pupil
                  size={12}
                  maxDistance={5}
                  pupilColor="#2D2D2D"
                  forceLookX={password.length > 0 && showPassword ? -5 : undefined}
                  forceLookY={password.length > 0 && showPassword ? -4 : undefined}
                />
              </div>
              {/* Horizontal line for mouth */}
              <div
                className="absolute w-20 h-[4px] bg-[#2D2D2D] rounded-full transition-all duration-200 ease-out"
                style={{
                  left:
                    password.length > 0 && showPassword
                      ? `${10}px`
                      : `${40 + (yellowPos.faceX || 0)}px`,
                  top:
                    password.length > 0 && showPassword
                      ? `${88}px`
                      : `${88 + (yellowPos.faceY || 0)}px`,
                }}
              />
            </div>
          </div>
        </div>

        <div className="relative z-20 flex items-center gap-8 text-sm text-primary-foreground/60">
          <a href="#" className="hover:text-primary-foreground transition-colors">
            Privacy Policy
          </a>
          <a href="#" className="hover:text-primary-foreground transition-colors">
            Terms of Service
          </a>
          <a href="#" className="hover:text-primary-foreground transition-colors">
            Contact
          </a>
        </div>

        {/* Decorative elements */}
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="absolute top-1/4 right-1/4 size-64 bg-primary-foreground/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 size-96 bg-primary-foreground/5 rounded-full blur-3xl" />
      </div>

      {/* Right Login Section */}
      <div className="flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-[420px]">
          {/* Mobile Logo */}
          <Link
            href="/"
            className="lg:hidden flex items-center justify-center gap-2 text-lg font-semibold mb-12"
          >
            <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Sparkles className="size-4 text-primary" />
            </div>
            <span>Jol Energy</span>
          </Link>

          {/* Header */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tight mb-2">
              {isSignup ? "Create your account" : "Welcome back!"}
            </h1>
            <p className="text-muted-foreground text-sm">
              {isSignup
                ? "Sign up to access the Jol Energy dashboard"
                : "Please enter your details"}
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="anna@gmail.com"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                onFocus={handleFieldFocus}
                onBlur={handleFieldBlur}
                required
                className="h-12 bg-background border-border/60 focus:border-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">
                Password
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  minLength={6}
                  autoComplete={isSignup ? "new-password" : "current-password"}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 pr-10 bg-background border-border/60 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="size-5" />
                  ) : (
                    <Eye className="size-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(v) => setRemember(Boolean(v))}
                />
                <Label
                  htmlFor="remember"
                  className="text-sm font-normal cursor-pointer"
                >
                  Remember for 30 days
                </Label>
              </div>
              {!isSignup && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Forgot password?
                </button>
              )}
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-500/10 border border-red-500/25 rounded-lg">
                {error}
              </div>
            )}

            {info && (
              <div className="p-3 text-sm text-emerald-700 bg-emerald-500/10 border border-emerald-500/25 rounded-lg">
                {info}
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base font-medium"
              size="lg"
              disabled={isLoading || googleLoading}
            >
              {isLoading
                ? isSignup
                  ? "Creating account…"
                  : "Signing in…"
                : isSignup
                  ? "Create account"
                  : "Log in"}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          {/* Google */}
          <Button
            type="button"
            variant="outline"
            onClick={handleGoogle}
            disabled={isLoading || googleLoading}
            className="w-full h-12 bg-background border-border/60 hover:bg-accent"
          >
            <GoogleIcon className="mr-2 size-5" />
            {googleLoading
              ? "Connecting…"
              : isSignup
                ? "Sign up with Google"
                : "Continue with Google"}
          </Button>

          {/* Sign Up / Sign In toggle */}
          <div className="text-center text-sm text-muted-foreground mt-8">
            {isSignup ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setError("");
                setInfo("");
                setMode(isSignup ? "signin" : "signup");
              }}
              className="text-foreground font-medium hover:underline"
            >
              {isSignup ? "Sign in" : "Sign Up"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
export const Component = LoginPage;
