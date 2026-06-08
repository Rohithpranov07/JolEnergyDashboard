"use client";

import React from "react";
import { motion, useInView } from "framer-motion";

interface TimelineContentProps {
  as?: string;
  className?: string;
  animationNum: number;
  customVariants: any;
  timelineRef: React.RefObject<HTMLElement | null>;
  children?: React.ReactNode;
}

export function TimelineContent({
  as = "div",
  className,
  animationNum,
  customVariants,
  timelineRef,
  children,
}: TimelineContentProps) {
  // Check if the parent container is in the viewport
  const isInView = useInView(timelineRef, { once: true, amount: 0.1 });

  // Dynamically resolve the motion tag
  const MotionComponent = (motion as any)[as] || motion.div;

  return (
    <MotionComponent
      custom={animationNum}
      variants={customVariants}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </MotionComponent>
  );
}
