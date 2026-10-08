"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/cn";

const R = 22;
const C = 2 * Math.PI * R;

/**
 * Floating «Вгору»: follows the page (fixed, bottom right), shows up after the first screen and draws
 * how much of the page is read as a ring around the arrow (goal-gradient, docs/UX_LAWS.md UX-22).
 * Instant scroll when the visitor prefers reduced motion.
 */
export function BackToTop({ label }: { label: string }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0);
      setVisible(window.scrollY > window.innerHeight * 0.6);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(frame); };
  }, []);

  const pct = Math.round(progress * 100);
  const text = label.replace("{n}", String(pct));
  return (
    <button type="button" aria-label={text} title={text} tabIndex={visible ? 0 : -1} aria-hidden={!visible}
      onClick={() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }}
      className={cn(
        "fixed right-4 bottom-4 z-30 grid size-12 place-items-center rounded-[4px] bg-rail text-rail-fg shadow-lg transition-[opacity,transform] duration-200 sm:right-6 sm:bottom-6",
        visible ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}>
      <svg aria-hidden viewBox="0 0 56 56" className="absolute inset-0 size-full -rotate-90">
        <circle cx="28" cy="28" r={R} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="3" />
        <circle cx="28" cy="28" r={R} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - progress)} />
      </svg>
      <ArrowUp aria-hidden className="relative size-5" />
    </button>
  );
}
