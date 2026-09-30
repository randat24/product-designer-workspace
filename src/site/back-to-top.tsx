"use client";

import { ArrowUpIcon } from "./social-icons";

/** Scrolls to the top; instant when the visitor prefers reduced motion. */
export function BackToTop({ label }: { label: string }) {
  return (
    <button
      type="button"
      onClick={() => {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
      }}
      className="inline-flex h-10 items-center gap-2 rounded-full border-[1.5px] border-current px-4 text-[14px] font-semibold transition-opacity hover:opacity-70"
    >
      <ArrowUpIcon className="h-4 w-4" />
      {label}
    </button>
  );
}
