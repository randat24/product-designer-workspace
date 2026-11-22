"use client";

import { ChevronUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { button, sg } from "./signal/ui";

const pad = (n: number) => String(n).padStart(2, "0");

export type CaseDockCta = { href: string; label: string; track: Record<string, string> };

/**
 * Phone case dock (signal.css, .sg-case-dock): once the contents row above the chapters is scrolled past, a bar at
 * the bottom keeps the chapter being read («03 / 08», opens the contents) and «Обговорити проєкт» under the thumb,
 * beside «Вгору». It steps aside when the closing call to action ([data-case-end]) is on screen. The chapter number
 * and aria-current are written by CaseContentsSpy. Disclosure pattern as ContactMenu: Esc and a click outside close it.
 */
export function CaseDock({ label, sections, cta }: { label: string; sections: { id: string; title: string }[]; cta: CaseDockCta }) {
  const [shown, setShown] = useState(false);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const id = useId();

  // A scroll check, not an IntersectionObserver: a jump to a chapter takes the contents row from below the screen
  // to above it without ever crossing it, and an observer then never fires. React skips the render when the
  // value is unchanged, so the page does not re-render while it scrolls.
  useEffect(() => {
    const nav = document.getElementById("case-contents");
    const end = document.querySelector("[data-case-end]");
    if (!nav) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const past = nav.getBoundingClientRect().bottom < 0;
      const atEnd = !!end && end.getBoundingClientRect().top < window.innerHeight;
      setShown(past && !atEnd);
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => { window.removeEventListener("scroll", onScroll); window.removeEventListener("resize", onScroll); cancelAnimationFrame(frame); };
  }, []);

  useEffect(() => { if (!shown) setOpen(false); }, [shown]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") { setOpen(false); toggle.current?.focus(); } };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    // As ContactMenu, focus moves into the list: onto the chapter being read, which also scrolls a long list to it.
    const list = root.current?.querySelector("nav");
    (list?.querySelector<HTMLElement>("a[aria-current]") ?? list?.querySelector<HTMLElement>("a"))?.focus();
    return () => { document.removeEventListener("pointerdown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div ref={root} className="sg-case-dock" data-shown={shown ? "" : undefined} inert={!shown} aria-hidden={!shown}>
      <nav id={id} hidden={!open} aria-label={label} data-case-contents="" className={sg.menu}>
        <ol>
          {sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} onClick={() => setOpen(false)} className={sg.menuItem}><span>{pad(i + 1)}</span>{s.title}</a>
            </li>
          ))}
        </ol>
      </nav>
      <button ref={toggle} type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}
        className={button({ variant: "secondary" }, "sg-case-dock__toggle")}>
        <span className="sr-only">{label} </span>
        <span data-case-current="">{`${pad(1)} / ${pad(sections.length)}`}</span>
        <ChevronUp aria-hidden className={cn("size-4 transition-transform duration-(--duration-fast)", open && "rotate-180")} />
      </button>
      <Link href={cta.href} className={button({ variant: "primary" }, "sg-case-dock__cta")} {...cta.track}>
        {cta.label}
      </Link>
    </div>
  );
}
