"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Truck from "@/components/Truck";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const containerRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const truckRef = useRef<HTMLDivElement>(null);

  // final-sketch.svg natural dimensions: viewBox="0 0 2240.09 601.49"
  const baseAspect = 2240.09 / 601.49;

  // SVG ground rect: y=559.96, height=43.23
  // Distance from bottom of SVG to TOP of ground rect = 601.49 - 559.96 = 41.53 SVG units
  // The brown horizontal line sits at y=559.96 with stroke-width 3
  // Beige area below line = 41.53 / 601.49 of viewport height
  const beigeRatio = 40.03 / 601.49; // Nudged back down slightly (from 40.53) for final perfection
  const lineRatio = 3 / 601.49;      // ~0.5% - exactly matches SVG stroke width

  // CSS values for the road elements
  const beigeHeight = `${beigeRatio * 100}vh`;
  const horizontalLineHeight = `${lineRatio * 100}vh`;
  const verticalLineThickness = `2px`;
  const verticalLineBottom = `${(beigeRatio + lineRatio) * 100}vh`;

  // Truck SVG viewBox: 0 0 1161.62 601.49
  // Truck width is 70vw. Aspect ratio = 601.49/1161.62 = 0.5178
  // Truck rendered height = 70vw * 0.5178 = 36.25vw
  // Wheels bottom-most point in truck SVG ≈ y=533 (radius 60 circles centered ~y=485)
  // Empty space below wheels = 601.49 - 533 = 68.49 SVG units
  // As fraction of truck height: 68.49/601.49 = 0.1139
  // Empty space rendered = 36.25vw * 0.1139 = ~4.13vw
  // Truck bottom = beigeHeight - emptySpaceBelowWheels
  const truckEmptyBelow = 85 * (601.49 / 1161.62) * (68.07 / 601.49); // Empty space below wheels (y=533.42)
  // Align wheels on TOP of line (at 43.03 units from bottom: 40.03 + 3.0)
  const truckBottom = `calc(43.03 / 601.49 * 100vh - ${truckEmptyBelow}vw)`;

  // Initialize smooth scrolling with Lenis
  useEffect(() => {
    const lenis = new Lenis({
      wrapper: containerRef.current || window,
      content: document.querySelector('.scroll-content') as HTMLElement || undefined,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'horizontal',
      gestureOrientation: 'both',
      wheelMultiplier: 1.5,
      smoothWheel: true,
      infinite: false,
    });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
    };
  }, []);

  useGSAP(() => {
    if (!trackRef.current || !containerRef.current || !truckRef.current) return;

    const trackWidth = trackRef.current.scrollWidth;
    const scrollDistance = trackWidth - window.innerWidth;

    // The sketch width in pixels = viewport height * aspect ratio
    const sketchWidth = window.innerHeight * baseAspect;

    // Truck stop position: a small gap after the separator (sketch + separator + gap)
    const truckStopX = sketchWidth + 24 + 120;

    // Truck start position: offscreen far right
    const truckStartX = sketchWidth + 24 + window.innerWidth + 400;

    // Set truck initially offscreen to the right and fade in
    gsap.set(truckRef.current, { x: truckStartX, autoAlpha: 1 });

    // Main scroll-driven timeline
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        pin: true,
        scrub: 1,
        start: "top top",
        end: () => `+=${scrollDistance}`,
        invalidateOnRefresh: true,
      }
    });

    // 1. Slide the entire track to the left (the core horizontal scroll)
    tl.to(trackRef.current, {
      x: -scrollDistance,
      ease: "none",
      duration: 1
    }, 0);

    // 2. Drive the truck from right to its stopping point
    // Timeline: starts at 20% scroll, reaches stop at 60% scroll
    // After 60%, the truck stays put (sticky) for future illustrations
    tl.to(truckRef.current, {
      x: truckStopX,
      ease: "power2.out",
      duration: 0.4
    }, 0.2);

    // 3. Spin all the wheels while the truck is driving
    // Reverting to GSAP rotation as per user preference
    const wheels = truckRef.current.querySelectorAll('.wheel');
    if (wheels.length > 0) {
      tl.to(wheels, {
        rotation: -2880, // Double rotation for more visible effect
        ease: "none",
        duration: 0.4,
      }, 0.2);
    }

  }, { scope: containerRef });

  return (
    <main className="overflow-hidden bg-[#e4dace] text-neutral-900 font-sans" ref={containerRef}>
      <div
        ref={trackRef}
        className="scroll-content flex h-screen will-change-transform relative w-max"
      >
        {/* Component 1: The initial sketch illustration */}
        <div
          className="relative h-full flex-shrink-0"
          style={{ width: `calc(100vh * ${baseAspect})` }}
        >
          <Image
            src="/final-sketch.svg"
            alt="Final Sketch"
            fill
            className="object-contain object-left"
            priority
            unoptimized
          />
        </div>

        {/* Component 2: Two Vertical Separator Lines */}
        <div className="relative h-full flex-shrink-0 w-[24px] z-20" style={{ transform: "translateX(-2px)" }}>
          <div className="absolute top-0 bg-[#623111]" style={{ width: verticalLineThickness, bottom: verticalLineBottom, left: 0 }} />
          <div className="absolute top-0 bg-[#623111]" style={{ width: verticalLineThickness, bottom: verticalLineBottom, right: 0 }} />
          {/* Bridge the road line across the separator gap */}
          <div className="absolute w-[28px] bg-[#623111] -left-[2px]" style={{ bottom: beigeHeight, height: horizontalLineHeight }} />
        </div>

        {/* Component 3: Extended Road (long enough for scrolling + future content) */}
        <div className="relative h-full w-[300vw] flex-shrink-0 z-10" style={{ transform: "translateX(-4px)" }}>
          <div className="absolute w-full bg-[#623111]" style={{ bottom: beigeHeight, height: horizontalLineHeight }} />
          <div className="absolute w-full bottom-0 bg-[#e4dace]" style={{ height: beigeHeight }} />
        </div>

        {/* Component 4: The Animated Truck */}
        {/* Starts offscreen right, GSAP drives it to stop position */}
        {/* Size: 70vw for a large, prominent truck as requested */}
        <div
          ref={truckRef}
          className="truck-wrapper absolute w-[85vw] z-30 pointer-events-none"
          style={{ bottom: truckBottom, left: 0, opacity: 0 }}
        >
          <Truck className="w-full h-auto" />
        </div>
      </div>
    </main>
  );
}
