"use client";

import { ArrowUp } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { button as buttonClass } from "./signal/ui";

/**
 * Floating «Вгору» (SIGNAL): a plain square with an arrow, bottom right, shown after the first screen. How much of
 * the page is read is a thin orange line along its bottom edge (goal-gradient, docs/UX_LAWS.md UX-22). Scrolling
 * writes the line and the label straight to the DOM, so the page never re-renders while it scrolls.
 * Instant scroll when the visitor prefers reduced motion.
 */
export function BackToTop({ label }: { label: string }) {
  const [visible, setVisible] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      const text = label.replace("{n}", String(Math.round(progress * 100)));
      if (bar.current) bar.current.style.transform = `scaleX(${progress})`;
      if (button.current && button.current.title !== text) {
        button.current.title = text;
        button.current.setAttribute("aria-label", text);
      }
      setVisible(window.scrollY > window.innerHeight * 0.6);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(frame); };
  }, [label]);

  const initial = label.replace("{n}", "0");
  return (
    <button ref={button} type="button" aria-label={initial} title={initial} tabIndex={visible ? 0 : -1} aria-hidden={!visible}
      onClick={() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }}
      className={cn(
        buttonClass({ variant: "secondary", icon: true }, "fixed right-4 bottom-4 z-30 overflow-hidden bg-surface transition-[opacity,transform,background-color] duration-200 hover:bg-subtle sm:right-6 sm:bottom-6"),
        visible ? "opacity-100" : "pointer-events-none translate-y-3 opacity-0",
      )}>
      <ArrowUp aria-hidden className="size-5" strokeWidth={1.75} />
      <span ref={bar} aria-hidden className="absolute inset-x-0 bottom-0 h-[2px] origin-left scale-x-0 bg-accent-text" />
    </button>
  );
}
