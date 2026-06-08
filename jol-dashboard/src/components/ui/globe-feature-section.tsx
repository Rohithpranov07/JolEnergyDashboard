"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import createGlobe, { COBEOptions } from "cobe";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef } from "react";

const GLOBE_CONFIG: Omit<COBEOptions, "width" | "height"> = {
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.25,
  dark: 1,
  diffuse: 1.2,
  mapSamples: 16000,
  mapBrightness: 6,
  baseColor: [0.23, 0.36, 0.6],
  markerColor: [245 / 255, 158 / 255, 11 / 255],
  glowColor: [0.4, 0.55, 0.85],
  markers: [
    { location: [13.0827, 80.2707], size: 0.08 },  // Chennai
    { location: [12.9716, 77.5946], size: 0.08 },  // Bengaluru
    { location: [17.385, 78.4867], size: 0.07 },   // Hyderabad
    { location: [11.0168, 76.9558], size: 0.05 },  // Coimbatore
    { location: [9.9252, 78.1198], size: 0.04 },   // Madurai
    { location: [19.076, 72.8777], size: 0.06 },   // Mumbai
    { location: [28.7041, 77.1025], size: 0.07 },  // Delhi
    { location: [22.5726, 88.3639], size: 0.05 },  // Kolkata
    { location: [23.0225, 72.5714], size: 0.05 },  // Ahmedabad
    { location: [18.5204, 73.8567], size: 0.05 },  // Pune
  ],
};

function Globe({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef<number | null>(null);
  const pointerMovement = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let phi = 0;
    let width = 0;
    let r = 0; // drag rotation offset
    let frame = 0;

    const onResize = () => {
      width = canvas.offsetWidth;
    };
    window.addEventListener("resize", onResize);
    onResize();

    // cobe v2 renders a single frame on init; we drive animation via update().
    const globe = createGlobe(canvas, {
      ...GLOBE_CONFIG,
      width: width * 2,
      height: width * 2,
    });

    const render = () => {
      if (pointerInteracting.current === null) phi += 0.005;
      r = pointerMovement.current / 200;
      globe.update({
        phi: phi + r,
        width: width * 2,
        height: width * 2,
      });
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    // fade in once the first real frame is drawn
    requestAnimationFrame(() => {
      canvas.style.opacity = "1";
    });

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
      globe.destroy();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "aspect-square h-full w-full opacity-0 transition-opacity duration-700",
        className,
      )}
      onPointerDown={(e) => {
        pointerInteracting.current = e.clientX - pointerMovement.current;
        if (canvasRef.current) canvasRef.current.style.cursor = "grabbing";
      }}
      onPointerUp={() => {
        pointerInteracting.current = null;
        if (canvasRef.current) canvasRef.current.style.cursor = "grab";
      }}
      onPointerOut={() => {
        pointerInteracting.current = null;
        if (canvasRef.current) canvasRef.current.style.cursor = "grab";
      }}
      onMouseMove={(e) => {
        if (pointerInteracting.current !== null) {
          pointerMovement.current = e.clientX - pointerInteracting.current;
        }
      }}
      style={{ cursor: "grab" }}
    />
  );
}

export default function GlobeFeatureSection() {
  return (
    <section className="relative w-full overflow-hidden rounded-3xl bg-muted border border-gray-200 dark:border-gray-800 shadow-md px-6 py-12 md:px-16 md:py-16">
      <div className="flex flex-col items-center justify-between gap-8 md:flex-row">
        {/* Text */}
        <div className="z-10 max-w-lg text-left">
          <p className="mb-3 text-xs font-bold uppercase tracking-widest text-amber-500">
            Collection Network
          </p>
          <h2 className="text-3xl font-semibold text-gray-900 dark:text-white leading-snug">
            Recover more.{" "}
            <span className="text-primary">Recycle smarter.</span>{" "}
            <span className="text-gray-500 dark:text-gray-400">
              Jol Energy&apos;s grassroots collection network spans 11 cities
              across South India — turning end-of-life batteries into critical
              metal feedstock.
            </span>
          </h2>
          <Button className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition hover:opacity-80">
            Explore network <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        {/* Globe — explicit square box so canvas.offsetWidth is non-zero at init */}
        <div className="relative aspect-square w-70 shrink-0 md:w-85">
          <Globe />
        </div>
      </div>
    </section>
  );
}
