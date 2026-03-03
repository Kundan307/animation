"use client";

import { motion, useSpring } from "framer-motion";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Lenis from "lenis";

export default function Home() {
  const containerRef = useRef<HTMLElement>(null);

  // We will manually track the X translation using a Framer Motion spring for smoothness
  // Default values to prevent layout flash, will be updated in useEffect
  const x = useSpring(0, { stiffness: 100, damping: 20, mass: 0.2 });
  const [maxScroll, setMaxScroll] = useState(0);
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  useEffect(() => {
    // Wait until the SVG has loaded and provided its aspect ratio
    if (!aspectRatio) return;

    const calculateMaxScroll = () => {
      // The SVG is strictly bounded by height (object-contain to 100vh).
      // So its true physical width on screen is the window height * natural aspect ratio.
      const screenHeight = window.innerHeight;
      const screenWidth = window.innerWidth;

      const absoluteImageWidth = screenHeight * aspectRatio;

      // The maximum we can scroll left is the total image width minus the one screen width we are already looking at.
      setMaxScroll(Math.max(0, absoluteImageWidth - screenWidth));
    };

    calculateMaxScroll();
    window.addEventListener("resize", calculateMaxScroll);
    return () => window.removeEventListener("resize", calculateMaxScroll);
  }, [aspectRatio]);

  useEffect(() => {
    if (maxScroll === 0) return;

    // Initialize Lenis exactly as recommended by their docs for this specific esoteric use case
    // We use infinite scroll internally, but we map its virtual value to our X translation
    const lenis = new Lenis({
      wrapper: containerRef.current || window, // If we don't have a wrapper, use window
      content: document.querySelector('.scroll-content') as HTMLElement || undefined,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'horizontal',
      gestureOrientation: 'both', // Translates vertical mouse wheel down to horizontal scroll right
      wheelMultiplier: 1.5,
      smoothWheel: true,
      infinite: false,
    });

    // Lenis emits a 'scroll' event cleanly every time it calculates a new position
    lenis.on('scroll', (e: any) => {
      // e.scroll is the pure virtual horizontal scroll position calculated by Lenis
      // We bound it to our maxScroll just in case
      let newX = -e.scroll;
      newX = Math.max(-maxScroll, Math.min(0, newX));
      x.set(newX);
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, [x, maxScroll]);

  return (
    // The main container is locked to exactly the screen size. Zero native scrolling.
    <main ref={containerRef} className="fixed inset-0 overflow-hidden bg-[#E4DACE] text-neutral-900 selection:bg-blue-500/30 font-sans">

      <motion.div
        style={{
          x,
          // Dynamically set the physical width of the track to exactly match the image's bounding box
          width: aspectRatio ? `calc(100vh * ${aspectRatio})` : '200vw'
        }}
        className="scroll-content flex h-screen will-change-transform relative"
      >
        {/* Combined Slide */}
        <div className="absolute inset-0 h-full w-full pointer-events-none">
          <Image
            src="/slide1and2.svg"
            alt="Combined Slide 1 and 2"
            fill
            className="object-contain object-left mix-blend-multiply opacity-100"
            priority
            unoptimized
            onLoad={(e) => {
              const { naturalWidth, naturalHeight } = e.currentTarget as HTMLImageElement;
              setAspectRatio(naturalWidth / naturalHeight);
            }}
          />
        </div>
      </motion.div>
    </main>
  );
}
