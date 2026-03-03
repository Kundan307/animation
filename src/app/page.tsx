"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";

gsap.registerPlugin(ScrollTrigger);

export default function Home() {
  const containerRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const [aspectRatio, setAspectRatio] = useState<number | null>(null);

  // Initialize smooth scrolling with Lenis
  useEffect(() => {
    const lenis = new Lenis({
      wrapper: containerRef.current || window,
      content: document.querySelector('.scroll-content') as HTMLElement || undefined,
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'horizontal',
      gestureOrientation: 'both', // Translates vertical mouse wheel to horizontal scrolling
      wheelMultiplier: 1.5,
      smoothWheel: true,
      infinite: false,
    });

    // Sync Lenis with GSAP ScrollTrigger!
    lenis.on('scroll', ScrollTrigger.update);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    return () => {
      lenis.destroy();
      gsap.ticker.remove(lenis.raf);
    };
  }, []);

  // Set up the GSAP ScrollTrigger horizontal animation
  useGSAP(() => {
    if (!aspectRatio || !trackRef.current) return;

    // Calculate how far we need to slide the track to reach the end of the SVG
    // Total width of the track minus the width of the screen viewport
    const trackWidth = trackRef.current.scrollWidth;
    const scrollDistance = trackWidth - window.innerWidth;

    // The animation: slide the track perfectly to the left
    gsap.to(trackRef.current, {
      x: -scrollDistance,
      ease: "none",
      scrollTrigger: {
        trigger: containerRef.current,
        pin: true,
        scrub: 1, // Smooth dragging effect
        start: "top top",
        end: () => `+=${scrollDistance}`, // The user has to scroll vertically the exact distance the track moves horizontally
        invalidateOnRefresh: true, // Recalculate if the window is resized
        // markers: true // Un-comment to see exactly where the ScrollTrigger starts and ends!
      }
    });

  }, { dependencies: [aspectRatio], scope: containerRef });

  return (
    // The main container is pinned by ScrollTrigger. We must NOT use 'fixed' or 'inset-0' 
    // because ScrollTrigger literally inserts whitespace below this container to create the 
    // vertical scrolling distance needed to power the scrub!
    <main ref={containerRef} className="bg-[#E4DACE] text-neutral-900 selection:bg-blue-500/30 font-sans h-screen overflow-hidden">

      <div
        ref={trackRef}
        style={{
          // Dynamically set the physical width of the track to exactly match the image's bounding box
          width: aspectRatio ? `calc(100vh * ${aspectRatio})` : '200vw'
        }}
        className="scroll-content flex h-screen will-change-transform relative"
      >
        {/* Combined Slide */}
        <div className="absolute inset-0 h-full w-full pointer-events-none py-10 md:py-24">
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
      </div>
    </main>
  );
}
