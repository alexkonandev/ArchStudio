"use client";

import { useEffect, type RefObject } from "react";

/**
 * Expose la position du pointeur sur un élément via des variables CSS :
 *   --x / --y   : px relatifs à l'élément (halos, spotlight)
 *   --nx / --ny : -1 … 1 (parallaxe)
 * Désactivé sur tactile.
 */
export function usePointerVars<T extends HTMLElement>(ref: RefObject<T | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (!mq.matches) return;

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        el.style.setProperty("--x", `${x.toFixed(1)}px`);
        el.style.setProperty("--y", `${y.toFixed(1)}px`);
        el.style.setProperty("--nx", ((x / r.width) * 2 - 1).toFixed(3));
        el.style.setProperty("--ny", ((y / r.height) * 2 - 1).toFixed(3));
      });
    };
    el.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
    };
  }, [ref]);
}

/** Vrai tant que l'utilisateur n'a pas demandé à réduire les animations. */
export function motionAllowed(): boolean {
  return typeof window !== "undefined" && !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
