"use client";

import { useEffect, useRef } from "react";
import { HERO_RINGS } from "./hero-rings";

/**
 * The hero drawing, alive: the mesh breathes (a slow turn), the three orange rings draw themselves in and a signal
 * runs along each of them, and a dot orbits the circle. CSS only (transform, stroke offset), paused while the drawing
 * is off screen and off entirely under reduced motion (src/site/signal/signal.css, «hero motion»).
 */
export function HeroArt({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([e]) => el.toggleAttribute("data-paused", !e!.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className="sg-hero-art" aria-hidden="true">
      <span className="sg-art-orbit" />
      <div className="sg-art-figure">
        <div className="sg-art-mesh" />
        <svg className="sg-art-signal" viewBox="0 0 700 650" fill="none">
          {HERO_RINGS.map((d, i) => <path key={`r${i}`} className="sg-ring" d={d} pathLength={1000} />)}
          {HERO_RINGS.map((d, i) => <path key={`p${i}`} className="sg-pulse" d={d} pathLength={1000} />)}
        </svg>
      </div>
      {children}
    </div>
  );
}
