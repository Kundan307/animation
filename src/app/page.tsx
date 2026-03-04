"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Truck from "@/components/Truck";
import Wood from "@/components/Wood";
import LeftPicker from "@/components/LeftPicker";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const containerRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const truckRef = useRef<HTMLDivElement>(null);
  const woodRef = useRef<HTMLDivElement>(null);
  const leftPickerRef = useRef<HTMLDivElement>(null);

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
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      wheelMultiplier: 1.5,
      smoothWheel: true,
      infinite: false,
    });

    // Translate horizontal trackpad swipes into vertical scrolls for GSAP
    const handleWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
        window.scrollBy({ top: e.deltaX, behavior: 'auto' });
      }
    };
    window.addEventListener('wheel', handleWheel, { passive: false });

    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
    };
  }, []);

  useGSAP(() => {
    if (!trackRef.current || !containerRef.current || !truckRef.current || !woodRef.current || !leftPickerRef.current) return;

    const trackWidth = trackRef.current.scrollWidth;
    const scrollDistance = trackWidth - window.innerWidth;

    // The sketch width in pixels = viewport height * aspect ratio
    const sketchWidth = window.innerHeight * baseAspect;


    // Since the pickers (65vw) are smaller than the truck (85vw), their internal empty space at the bottom is smaller.
    // The container's bottom pushes them into the ground by the truck's amount. We must lift the pickers.
    const truckEmptyBelowScreen = 85 * (601.49 / 1161.62) * (68.07 / 601.49) * (window.innerWidth / 100);
    const pickerEmptyBelowScreen = 65 * (601.49 / 1161.62) * (68.07 / 601.49) * (window.innerWidth / 100);
    const pickerLiftY = -(truckEmptyBelowScreen - pickerEmptyBelowScreen);

    // Initial setup
    gsap.set([truckRef.current, woodRef.current, leftPickerRef.current], { autoAlpha: 1 });
    gsap.set(leftPickerRef.current, { y: pickerLiftY });

    const tl = gsap.timeline();

    // WE MAP GSAP DURATION DIRECTLY TO SCROLL PIXELS!
    const W = window.innerWidth;

    // Exactly aligns the `.animation_wrapper` block's left edge to the screen's left edge
    const S_WRAPPER_ALIGNED_LEFT = sketchWidth + W * 0.03;

    // Phase 1: Camera pans normally until the wrapper perfectly fills the screen
    tl.to(trackRef.current, {
      x: -S_WRAPPER_ALIGNED_LEFT,
      ease: "none",
      duration: S_WRAPPER_ALIGNED_LEFT
    }, 0);

    // ==========================================
    // PHASE 2: SEQUENCE PAUSE (Camera is frozen)
    // ==========================================
    const S_SEQ_START = S_WRAPPER_ALIGNED_LEFT;

    // 1. Truck drives in from the right edge of screen and parks HALF-WAY OFF SCREEN
    // User: "camera point on the unloading time should be 30-50% of the back part of the truck"
    const DUR_DRIVE = W * 1.2;
    const S_TRUCK_START = S_SEQ_START - W * 0.5; // start driving during camera pan so truck is visible when separator passes
    const TRUCK_STOP_X = -W * 0.15; // truck parks with cab just off left screen edge
    const TRUCK_START_X = W * 1.2; // Drives in from +1.2 screens

    tl.fromTo(truckRef.current, { x: TRUCK_START_X }, {
      x: TRUCK_STOP_X,
      ease: "power2.out",
      duration: DUR_DRIVE
    }, S_TRUCK_START);

    tl.fromTo(gsap.utils.toArray('.wheel', truckRef.current),
      { "--wheel-rot": "0deg" },
      {
        "--wheel-rot": "-1152deg", // 1.6W distance -> 1.6 * 720
        ease: "power2.out",
        duration: DUR_DRIVE
      },
      S_TRUCK_START
    );

    // Wood travels with the truck initially (inside truck bed)
    gsap.set(woodRef.current, { x: TRUCK_START_X, y: -W * 0.03, rotation: 0 });
    tl.to(woodRef.current, {
      x: TRUCK_STOP_X,
      ease: "power2.out",
      duration: DUR_DRIVE
    }, S_TRUCK_START);

    // ==========================================
    // PHASE 2: WOOD UNLOAD
    // ==========================================
    const DUR_UNLOAD = W * 0.7;
    const S_UNLOAD_START = S_TRUCK_START + DUR_DRIVE + W * 0.2;
    const WOOD_SLIDE_X = TRUCK_STOP_X + W * 0.28;

    // Phase 2a: wood slides diagonally out of truck bed at -14°
    tl.to(woodRef.current, {
      x: WOOD_SLIDE_X,
      rotation: -14,
      transformOrigin: "left center",
      ease: "power1.inOut",
      duration: DUR_UNLOAD * 0.55
    }, S_UNLOAD_START);

    // Phase 2b: wood levels out and drops slightly
    tl.to(woodRef.current, {
      rotation: 0,
      y: W * 0.05,
      ease: "power2.out",
      duration: DUR_UNLOAD * 0.45
    }, S_UNLOAD_START + DUR_UNLOAD * 0.55);

    // ==========================================
    // Left Picker drives in
    // ==========================================
    const DUR_LEFT_DRIVE = W * 0.85;
    const S_LEFT_START = S_UNLOAD_START + DUR_UNLOAD * 0.3;
    const LEFT_PICKER_CATCH_X = WOOD_SLIDE_X + W * 0.55; // good gap from truck
    const LEFT_PICKER_START_X = LEFT_PICKER_CATCH_X + W * 1.2;

    tl.fromTo(leftPickerRef.current, { x: LEFT_PICKER_START_X }, {
      x: LEFT_PICKER_CATCH_X,
      ease: "power2.out",
      duration: DUR_LEFT_DRIVE
    }, S_LEFT_START);

    tl.fromTo(gsap.utils.toArray('.wheel', leftPickerRef.current),
      { "--wheel-rot": "0deg" },
      { "--wheel-rot": "-720deg", ease: "power2.out", duration: DUR_LEFT_DRIVE },
      S_LEFT_START
    );

    // ==========================================
    // PHASE 3: 3D FLIP (picker turns to face right)
    // ==========================================
    const S_FLIP_START = S_LEFT_START + DUR_LEFT_DRIVE + W * 0.1;
    const DUR_FLIP = W * 0.35;

    tl.to(leftPickerRef.current, {
      rotateY: 90,
      ease: "power1.in",
      duration: DUR_FLIP * 0.5
    }, S_FLIP_START);
    tl.to(leftPickerRef.current, {
      rotateY: 0,
      scaleX: -1,
      ease: "power1.out",
      duration: DUR_FLIP * 0.5
    }, S_FLIP_START + DUR_FLIP * 0.5);

    // ==========================================
    // PHASE 4: DRIVE OFF RIGHT + CAMERA
    // ==========================================
    const S_DRIVE_OFF = S_FLIP_START + DUR_FLIP + W * 0.15;
    const DUR_DRIVE_OFF = W * 1.6;
    const MOVE_DELTA = W * 2.0;
    const LEFT_PICKER_EXIT_X = LEFT_PICKER_CATCH_X + MOVE_DELTA;
    const WOOD_EXIT_X = WOOD_SLIDE_X + W * 0.05 + MOVE_DELTA;

    tl.to(leftPickerRef.current, {
      x: LEFT_PICKER_EXIT_X,
      ease: "power1.inOut",
      duration: DUR_DRIVE_OFF
    }, S_DRIVE_OFF);

    // After scaleX:-1 flip, negative CSS rotation = visually clockwise = physically correct
    const exitRotDelta = (MOVE_DELTA / W) * 720;
    tl.fromTo(gsap.utils.toArray('.wheel', leftPickerRef.current),
      { "--wheel-rot": "-720deg" },
      { "--wheel-rot": `${-720 - exitRotDelta}deg`, ease: "power1.inOut", duration: DUR_DRIVE_OFF },
      S_DRIVE_OFF
    );

    tl.to(woodRef.current, {
      x: WOOD_EXIT_X,
      y: W * 0.05,
      ease: "power1.inOut",
      duration: DUR_DRIVE_OFF
    }, S_DRIVE_OFF);

    // Camera follows the picker to the right
    tl.to(trackRef.current, {
      x: -scrollDistance,
      ease: "power1.inOut",
      duration: DUR_DRIVE_OFF
    }, S_DRIVE_OFF);

    // Update the ScrollTrigger
    ScrollTrigger.create({
      id: 'mainScroll',
      animation: tl,
      trigger: containerRef.current,
      pin: true,
      scrub: 1,
      end: () => `+=${tl.duration()}`,
      invalidateOnRefresh: true,
    });

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

        {/* Component 4: The Animated Elements (Truck, Wood, Pickers) */}
        {/* Placed absolutely at sketchWidth + 10vw so it NEVER overlaps the sketch, creating a comfortable gap! */}
        <div
          className="absolute z-30 pointer-events-none"
          style={{ bottom: truckBottom, left: `calc(100vh * ${baseAspect} + 3vw)` }}
        >
          {/* Truck */}
          <div ref={truckRef} className="absolute w-[85vw] bottom-0 origin-bottom z-30">
            <Truck className="w-full h-auto" />
          </div>

          {/* Wood */}
          {/* Matches truck size initially, starting exact same place */}
          <div ref={woodRef} className="absolute w-[85vw] bottom-0 origin-bottom z-20">
            <Wood className="w-full h-auto" />
          </div>

          {/* Left Picker — perspective enables 3D rotateY flip */}
          <div ref={leftPickerRef} className="absolute w-[65vw] bottom-0 origin-bottom z-10" style={{ perspective: '800px', perspectiveOrigin: 'center bottom' }}>
            <LeftPicker className="w-full h-auto" />
          </div>

        </div>

      </div>
    </main>
  );
}
