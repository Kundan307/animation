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
import { WalkingCart } from "@/components/WalkingCart";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const containerRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const truckRef = useRef<HTMLDivElement>(null);
  const woodRef = useRef<HTMLDivElement>(null);
  const leftPickerRef = useRef<HTMLDivElement>(null);
  const gluingTextRef = useRef<HTMLDivElement>(null);
  const walkingCartRef = useRef<HTMLDivElement>(null);
  const walkingWoodRef = useRef<HTMLDivElement>(null);

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

    // Calculate full scroll distance based on all track sections
    const trackWidth = trackRef.current.scrollWidth;
    const scrollDistance = Math.max(0, trackWidth - window.innerWidth);

    // The sketch width in pixels = viewport height * aspect ratio
    const sketchWidth = window.innerHeight * baseAspect;


    // Since the pickers (65vw) are smaller than the truck (85vw), their internal empty space at the bottom is smaller.
    // The container's bottom pushes them into the ground by the truck's amount. We must lift the pickers.
    const truckEmptyBelowScreen = 85 * (601.49 / 1161.62) * (68.07 / 601.49) * (window.innerWidth / 100);
    const pickerEmptyBelowScreen = 65 * (601.49 / 1161.62) * (68.07 / 601.49) * (window.innerWidth / 100);
    const pickerLiftY = -(truckEmptyBelowScreen - pickerEmptyBelowScreen);

    // Initial setup
    gsap.set([truckRef.current, leftPickerRef.current], { autoAlpha: 1 });
    gsap.set(woodRef.current, { autoAlpha: 0 }); // guarantee wood is initially invisible before timeline takes over
    gsap.set(leftPickerRef.current, { y: pickerLiftY });

    const tl = gsap.timeline();

    // WE MAP GSAP DURATION DIRECTLY TO SCROLL PIXELS!
    const W = window.innerWidth;

    // Exactly aligns the `.animation_wrapper` block's left edge to the screen's left edge
    const S_WRAPPER_ALIGNED_LEFT = sketchWidth + W * 0.15;

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

    // 1. Truck drives in — parks so only ~50% of screen is truck
    const DUR_DRIVE = W * 1.2;
    const S_TRUCK_START = S_SEQ_START - W * 0.5;
    const TRUCK_STOP_X = -W * 0.35; // 50vw of 85vw truck visible = ~right half
    const TRUCK_START_X = W * 1.2;

    tl.fromTo(truckRef.current, { x: TRUCK_START_X }, {
      x: TRUCK_STOP_X,
      ease: "power2.out",
      duration: DUR_DRIVE
    }, S_TRUCK_START);

    tl.fromTo(gsap.utils.toArray('.wheel', truckRef.current),
      { "--wheel-rot": "0deg" },
      { "--wheel-rot": "-1152deg", ease: "power2.out", duration: DUR_DRIVE },
      S_TRUCK_START
    );

    // ==========================================
    // SVG MEASUREMENTS
    // ==========================================
    const truckDivW = 0.85 * W;
    const pickerDivW = 0.65 * W;
    const woodDivW = 0.85 * W;

    const tailgatePx = (1116.8 / 1161.62) * truckDivW;
    const forkTipPx = (163 / 1161.62) * pickerDivW;
    const truckTailgateWorld = TRUCK_STOP_X + tailgatePx;

    // ==========================================
    // FORK MATH — compute offsets before using them
    // ==========================================
    const plankPx = (490 / 1161.62) * woodDivW;
    const pickerDivH = pickerDivW * (601.49 / 1161.62);
    const woodDivH = woodDivW * (601.49 / 1161.62);
    const forkFromBottom = pickerDivH * (1 - 323 / 601.49) + Math.abs(pickerLiftY);
    const plankFromBottom = woodDivH * (1 - 318 / 601.49);
    const FORK_ALIGN_Y = -(forkFromBottom - plankFromBottom) - W * 0.03;

    const FORK_OFFSET_X = forkTipPx - plankPx - W * 0.08;  // wood shifted towards truck, half on forks
    const FORK_OFFSET_X_FLIPPED = (pickerDivW - forkTipPx) - plankPx - W * 0.04; // closer to lifter body

    // ==========================================
    // Lifter drives in — stops with clear gap from truck
    // ==========================================
    const DUR_LEFT_DRIVE = W * 0.85;
    const S_LEFT_START = S_TRUCK_START + DUR_DRIVE + W * 0.1;

    // More space between truck and lifter
    const LEFT_PICKER_CATCH_X = truckTailgateWorld - forkTipPx + W * 0.10;
    const LEFT_PICKER_START_X = truckTailgateWorld + W * 0.8;

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
    // Wood appears on fork top (no truck slide, smooth fade-in)
    // ==========================================

    // Explicitly hide wood and set its position at the very beginning of the timeline 
    // so scrolling backwards perfectly restores this invisible state.
    tl.set(woodRef.current, {
      autoAlpha: 0,
      x: LEFT_PICKER_CATCH_X + FORK_OFFSET_X,
      y: FORK_ALIGN_Y,
      rotation: 0
    }, 0);

    const S_WOOD_APPEAR = S_LEFT_START + DUR_LEFT_DRIVE;
    const DUR_WOOD_FADE = W * 0.2;

    // Fade wood in on the fork position
    tl.fromTo(woodRef.current,
      { autoAlpha: 0 },
      {
        autoAlpha: 1,
        ease: "power1.in",
        duration: DUR_WOOD_FADE
      },
      S_WOOD_APPEAR
    );

    const S_WOOD_DONE = S_WOOD_APPEAR + DUR_WOOD_FADE;

    // ==========================================
    // PHASE 3: 3D FLIP (picker turns to face right)
    // ==========================================
    const S_FLIP_START = S_WOOD_DONE + W * 0.1;
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
    const MOVE_DELTA = W * 1.0; // Reduced so camera outpaces it significantly
    const LEFT_PICKER_EXIT_X = LEFT_PICKER_CATCH_X + MOVE_DELTA;

    tl.to(leftPickerRef.current, {
      x: LEFT_PICKER_EXIT_X,
      ease: "power1.inOut",
      duration: DUR_DRIVE_OFF
    }, S_DRIVE_OFF);

    const exitRotDelta = (MOVE_DELTA / W) * 720;
    tl.fromTo(gsap.utils.toArray('.wheel', leftPickerRef.current),
      { "--wheel-rot": "-720deg" },
      { "--wheel-rot": `${-720 - exitRotDelta}deg`, ease: "power1.inOut", duration: DUR_DRIVE_OFF },
      S_DRIVE_OFF
    );

    // Camera goes far enough to show the next section fully
    const CAMERA_PHASE_4 = W * 1.5; // distance camera moves during drive-off
    tl.to(trackRef.current, {
      x: `-=${CAMERA_PHASE_4}`,
      ease: "power1.inOut",
      duration: DUR_DRIVE_OFF
    }, S_DRIVE_OFF);

    // ==========================================
    // PHASE 5: GLUING SECTION PENDING
    // ==========================================
    const S_GLUING_START = S_DRIVE_OFF + DUR_DRIVE_OFF;
    const DUR_GLUING = W * 1.0;

    // Just keep panning the camera through the gluing section
    tl.to(trackRef.current, {
      x: `-=${DUR_GLUING}`,
      ease: "none",
      duration: DUR_GLUING
    }, S_GLUING_START);

    // ==========================================
    // PHASE 6: WALKING CART 
    // ==========================================
    const S_WALKING_START = S_GLUING_START + DUR_GLUING;
    const DUR_WALKING = W * 2.5;

    // Pan camera into walking section
    tl.to(trackRef.current, {
      x: `-=${DUR_WALKING}`,
      ease: "none",
      duration: DUR_WALKING
    }, S_WALKING_START);

    // Animate cart moving slightly faster than camera so it walks across screen
    if (walkingCartRef.current) {
      tl.to(walkingCartRef.current, {
        x: W * 0.8, // Moves right relative to its container
        ease: "none",
        duration: DUR_WALKING
      }, S_WALKING_START);

      // User requested 3 steps "left right left" during the scroll, no "shaking" screen.
      // We set transform origin around hip joint for legs (based on SVG viewBox coordinates)
      gsap.set(['.leg-front', '.leg-back'], { transformOrigin: "595px 436px" });

      const legDuration = DUR_WALKING / 3;

      // Leg 1 (Front leg): Right-Left-Right
      tl.to('.leg-front', {
        rotation: 15, ease: "power1.inOut", duration: legDuration
      }, S_WALKING_START)
        .to('.leg-front', {
          rotation: -15, ease: "power1.inOut", duration: legDuration
        }, S_WALKING_START + legDuration)
        .to('.leg-front', {
          rotation: 0, ease: "power1.inOut", duration: legDuration
        }, S_WALKING_START + legDuration * 2);

      // Leg 2 (Back leg): Left-Right-Left (Offset pendulum)
      tl.to('.leg-back', {
        rotation: -15, ease: "power1.inOut", duration: legDuration
      }, S_WALKING_START)
        .to('.leg-back', {
          rotation: 15, ease: "power1.inOut", duration: legDuration
        }, S_WALKING_START + legDuration)
        .to('.leg-back', {
          rotation: 0, ease: "power1.inOut", duration: legDuration
        }, S_WALKING_START + legDuration * 2);
    }

    // Lock wood to forks for previous phases
    const tlDur = tl.duration();
    const woodSlideProgress = S_WOOD_APPEAR / tlDur;
    const flipDoneProgress = (S_FLIP_START + DUR_FLIP) / tlDur;

    ScrollTrigger.create({
      id: 'mainScroll',
      animation: tl,
      trigger: containerRef.current,
      pin: true,
      scrub: 1,
      end: () => `+=${Math.max(window.innerWidth, tl.duration())}`, // ensure enough scroll space
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        // Once wood appears, lock it to picker forks every frame
        if (self.progress >= woodSlideProgress && leftPickerRef.current && woodRef.current) {
          const px = gsap.getProperty(leftPickerRef.current, "x") as number;
          // Use correct offset based on whether picker has flipped
          const offset = self.progress >= flipDoneProgress ? FORK_OFFSET_X_FLIPPED : FORK_OFFSET_X;
          gsap.set(woodRef.current, {
            x: px + offset,
            y: FORK_ALIGN_Y,
            rotation: 0,
            autoAlpha: 1
          });
        }
      }
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
        {/* Adjusted width to 800vw to ensure it clearly covers everything behind the cart during the full scroll */}
        <div className="relative h-full w-[800vw] flex-shrink-0 z-10" style={{ transform: "translateX(-4px)" }}>
          <div className="absolute top-0 bg-[#e4dace] h-full" style={{ width: '800vw' }} />
          <div className="absolute bg-[#623111]" style={{ bottom: beigeHeight, height: horizontalLineHeight, width: '800vw' }} />
          <div className="absolute bottom-0 bg-[#e4dace]" style={{ height: beigeHeight, width: '800vw' }} />
        </div>

        {/* Component 4: The Animated Elements (Truck, Wood, Pickers) */}
        {/* Placed absolutely at sketchWidth + 10vw so it NEVER overlaps the sketch, creating a comfortable gap! */}
        <div
          className="absolute z-30 pointer-events-none"
          style={{ bottom: truckBottom, left: `calc(100vh * ${baseAspect} + 15vw)`, width: '300vw', height: '100vh', overflow: 'hidden' }}
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

        {/* Component 5: Gluing Section Placeholder */}
        <div
          className="absolute h-full flex flex-col justify-center items-center z-20 border-l-2 border-r-2 border-dashed border-[#623111]/30"
          style={{ left: `calc(100vh * ${baseAspect} + 130vw)`, width: '100vw' }}
        >
          <div ref={gluingTextRef} className="text-[#623111] text-4xl font-bold opacity-50 tracking-widest uppercase">
            GLUING ASSETS PENDING
          </div>
        </div>

        {/* Component 6: Walking Cart Section */}
        <div
          className="absolute h-full z-20 pointer-events-none"
          style={{ left: `calc(100vh * ${baseAspect} + 230vw)`, width: '150vw' }}
        >
          <div
            className="absolute z-30 flex items-end pointer-events-none"
            style={{ bottom: `calc(${truckBottom} + 3.5vw)`, left: '10vw' }}
            ref={walkingCartRef}
          >
            <div className="relative w-[70vw] origin-bottom">
              {/* Using the LeftPicker/Cart svg component here or actual item */}
              <WalkingCart id="walking-cart-svg" className="w-full h-auto relative z-20" />
            </div>

            {/* The wood resting perfectly flat inside the cart in front of the person */}
            <div
              ref={walkingWoodRef}
              className="absolute z-10 w-[85vw]"
              style={{
                bottom: '-17.3vw', // Mathematically aligned to the 564px fork line from 1161 viewBox
                left: '12vw',  // Mathematically set to perfectly align front tip of wood with front tip of rightmost forks
                transformOrigin: "center center",
                transform: 'rotate(0deg)', // Ensure it is perfectly horizontal
              }}
            >
              <Wood className="w-full h-auto" />
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
