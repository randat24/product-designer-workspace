"use client";

import { Eye } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { cn } from "@/shared/lib/cn";

const KEY = "adult-ok";

/**
 * A case made for an 18+ audience: its mockups stay blurred, and out of reach for the keyboard and screen readers,
 * until the visitor confirms their age. The answer lasts for the visit (sessionStorage), so the other 18+ cases
 * open without asking again. The title, summary and facts above stay visible: the visitor knows what they are opening.
 */
export function AdultGate({ labels, backHref, children }: {
  labels: { badge: string; title: string; body: string; confirm: string; back: string };
  backHref: string;
  children: React.ReactNode;
}) {
  const [ok, setOk] = useState(false);
  useEffect(() => {
    try { if (sessionStorage.getItem(KEY) === "1") setOk(true); } catch { /* storage blocked: ask every time */ }
  }, []);

  const confirm = () => {
    setOk(true);
    try { sessionStorage.setItem(KEY, "1"); } catch { /* ignore */ }
  };

  if (ok) return <>{children}</>;
  return (
    <div className="relative min-h-[540px] sm:min-h-[460px]">
      {/* Only a slice of the case is kept under the blur, so the page is not a long blurred scroll. */}
      <div inert aria-hidden className="pointer-events-none max-h-[560px] overflow-hidden blur-2xl select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-start justify-center px-4 pt-10 sm:pt-16">
        <section aria-labelledby="adult-h"
          className="flex w-full max-w-[520px] flex-col items-start gap-4 rounded-[18px] border-[1.5px] border-fg bg-surface p-6 shadow-[0_24px_60px_-20px_rgba(0,0,0,.35)] sm:p-8">
          <span className="grid size-14 place-items-center rounded-full bg-fg font-display text-[22px] font-bold text-canvas">
            {labels.badge}
          </span>
          <h2 id="adult-h" className="font-display text-[clamp(24px,3vw,30px)] font-bold uppercase leading-[1.1] tracking-[0.01em]">
            {labels.title}
          </h2>
          <p className="text-[16px] leading-[1.55] text-fg-secondary">{labels.body}</p>
          <div className="flex flex-wrap gap-3">
            <button type="button" onClick={confirm}
              className={cn(BTN, "border-accent bg-accent text-on-accent hover:bg-accent-hover")}>
              <Eye aria-hidden className="size-4" />
              {labels.confirm}
            </button>
            <Link href={backHref} className={cn(BTN, "border-fg text-fg hover:bg-subtle")}>{labels.back}</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

const BTN = "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] border-[1.5px] px-5 text-[15px] font-semibold transition-colors duration-[120ms]";
