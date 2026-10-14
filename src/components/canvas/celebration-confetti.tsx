"use client";

import { useEffect, useRef } from "react";

/** How long the confetti burst lives (ms). */
const BURST_DURATION_MS = 2200;
/** Number of particles per burst. */
const PARTICLE_COUNT = 140;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  spin: number;
  shape: "rect" | "circle";
}

const PALETTE = [
  "#10b981",
  "#34d399",
  "#38bdf8",
  "#818cf8",
  "#fbbf24",
  "#f472b6",
  "#ffffff",
] as const;

function spawnParticles(width: number): Particle[] {
  const particles: Particle[] = [];
  for (let i = 0; i < PARTICLE_COUNT; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 3 + Math.random() * 7;
    particles.push({
      x: width / 2 + (Math.random() - 0.5) * 120,
      y: -20 - Math.random() * 40,
      vx: Math.cos(angle) * speed * 0.6,
      vy: 2 + Math.random() * 3,
      size: 5 + Math.random() * 6,
      color: PALETTE[Math.floor(Math.random() * PALETTE.length)],
      rotation: Math.random() * Math.PI * 2,
      spin: (Math.random() - 0.5) * 0.3,
      shape: Math.random() > 0.4 ? "rect" : "circle",
    });
  }
  return particles;
}

/**
 * Lightweight full-screen confetti burst (zero dependency).
 *
 * Rendered only while `active` is true; the parent removes it via `onDone`
 * after the burst completes. Respects `prefers-reduced-motion` by rendering
 * nothing. Canvas is pointer-transparent and sits above everything.
 */
export function CelebrationConfetti({
  active,
  onDone,
}: {
  active: boolean;
  onDone: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const doneRef = useRef(onDone);

  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    if (!active) return;
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      doneRef.current();
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas) {
      doneRef.current();
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      doneRef.current();
      return;
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx.scale(dpr, dpr);

    const particles = spawnParticles(width);
    const start = performance.now();
    let raf = 0;

    const tick = (now: number): void => {
      const elapsed = now - start;
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.vx *= 0.99;
        p.rotation += p.spin;
        const fade = elapsed > BURST_DURATION_MS - 600 ? 1 - (elapsed - (BURST_DURATION_MS - 600)) / 600 : 1;
        ctx.save();
        ctx.globalAlpha = Math.max(0, Math.min(1, fade));
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        if (p.shape === "rect") {
          ctx.fillRect(-p.size / 2, -p.size / 3, p.size, p.size * 0.66);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      }
      if (elapsed < BURST_DURATION_MS) {
        raf = requestAnimationFrame(tick);
      } else {
        doneRef.current();
      }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);

  if (!active) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[90] h-screen w-screen"
    />
  );
}
