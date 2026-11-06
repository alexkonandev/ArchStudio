"use client";

import { useEffect, type ReactNode } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

/**
 * SmoothScrollProvider
 *
 * Drives a Lenis smooth-scroll instance from the GSAP ticker so that
 * ScrollTrigger and Lenis share a single rAF loop (no jitter, no desync).
 * - `lenis.raf()` is fed GSAP ticker time (seconds → ms).
 * - Every Lenis scroll event refreshes ScrollTrigger positions.
 * - The instance and the ticker callback are fully cleaned up on unmount,
 *   so React StrictMode double-mounting in dev is safe.
 * - Users who prefer reduced motion keep native scrolling.
 */
export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const lenis = new Lenis({
      lerp: 0.1,
      smoothWheel: true,
      // In-page anchors (#section) scroll smoothly too.
      anchors: true,
    });

    const onLenisScroll = () => ScrollTrigger.update();
    lenis.on("scroll", onLenisScroll);

    const tickerCallback = (time: number) => {
      lenis.raf(time * 1000);
    };
    gsap.ticker.add(tickerCallback);
    // Prevent GSAP from "catching up" after tab-switch pauses, which would
    // make Lenis jump-scroll.
    gsap.ticker.lagSmoothing(0);

    return () => {
      gsap.ticker.remove(tickerCallback);
      lenis.off("scroll", onLenisScroll);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}