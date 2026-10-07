"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FEDO_CURSOR, FEDO_F } from "@/shared/ui/fedo-mark";

/**
 * The cursor of the mark in place of the system one (mouse only). Over anything with `data-cursor` it names the
 * action («Відкрити кейс», «Тягніть»). Text fields keep the system text cursor.
 */
export function FedoCursor() {
  const el = useRef<HTMLDivElement>(null);
  const lbl = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!matchMedia("(pointer: fine)").matches) return;
    const root = document.documentElement, cur = el.current!, text = lbl.current!;
    root.classList.add("fedo-cursor");
    const typing = "input:not([type=checkbox]):not([type=radio]):not([type=button]):not([type=submit]), textarea, select, [contenteditable=true]";
    const move = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      cur.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      const t = e.target as Element | null;
      const field = t?.closest?.(typing);
      cur.classList.toggle("is-in", !field);
      const label = field ? "" : (t?.closest?.("[data-cursor]") as HTMLElement | null)?.dataset.cursor ?? "";
      if (label !== text.textContent) { text.textContent = label; cur.classList.toggle("has-label", !!label); }
    };
    const out = (e: MouseEvent) => { if (!e.relatedTarget) cur.classList.remove("is-in"); };
    const down = () => cur.classList.add("is-press");
    const up = () => cur.classList.remove("is-press");
    addEventListener("pointermove", move);
    document.addEventListener("mouseout", out);
    addEventListener("pointerdown", down);
    addEventListener("pointerup", up);
    return () => {
      root.classList.remove("fedo-cursor");
      removeEventListener("pointermove", move);
      document.removeEventListener("mouseout", out);
      removeEventListener("pointerdown", down);
      removeEventListener("pointerup", up);
    };
  }, []);
  return (
    <div ref={el} aria-hidden className="fedo-cur">
      <svg viewBox="192 192 96 96"><path d={FEDO_CURSOR} /></svg>
      <span ref={lbl} />
    </div>
  );
}

/**
 * «Розмітка»: the page's own specs over it — a 12-column grid and, on every heading and named block, the type
 * (face, weight, size / line height) or the size read from the rendered page. The button or the R key toggles it.
 */
export function SpecsToggle({ label, hint }: { label: string; hint: string }) {
  const [on, setOn] = useState(false);
  const [boxes, setBoxes] = useState<{ x: number; y: number; w: number; h: number; tag: string }[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || e.repeat) return;
      if (!["r", "к"].includes(e.key.toLowerCase())) return;
      if ((e.target as Element).closest("input, textarea, select, [contenteditable=true]")) return;
      setOn((v) => !v);
    };
    addEventListener("keydown", key);
    return () => removeEventListener("keydown", key);
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("fedo-specs", on);
    if (!on) { setBoxes([]); return; }
    const fam = (s: string) => s.split(",")[0]!.replace(/["']/g, "").trim();
    const px = (v: string) => Math.round(parseFloat(v) * 10) / 10;
    const draw = () => {
      const list = [...document.querySelectorAll<HTMLElement>("main h1, main h2, main h3, [data-spec]")].flatMap((el) => {
        if (el.closest(".fedo-canvas") || !el.getClientRects().length) return [];
        const r = el.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) return [];
        const cs = getComputedStyle(el);
        const name = el.dataset.spec;
        const tag = !name || name === "text"
          ? `${fam(cs.fontFamily)} ${cs.fontWeight} · ${px(cs.fontSize)}/${cs.lineHeight === "normal" ? "auto" : px(cs.lineHeight)}`
          : `${name} · ${Math.round(r.width)}×${Math.round(r.height)}`;
        return [{ x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height, tag }];
      });
      setBoxes(list);
    };
    draw();
    let t = 0;
    const later = () => { window.clearTimeout(t); t = window.setTimeout(draw, 120); };
    const ro = new ResizeObserver(later);
    ro.observe(document.body);
    return () => { ro.disconnect(); window.clearTimeout(t); };
  }, [on]);

  return (
    <>
      <button type="button" onClick={() => setOn((v) => !v)} aria-pressed={on} title={hint} data-cursor={hint}
        className="hit hidden h-9 w-9 shrink-0 items-center justify-center rounded-full border-[1.5px] border-line text-fg transition-colors hover:border-fg aria-pressed:border-fg aria-pressed:bg-fg aria-pressed:text-canvas sm:flex">
        <svg viewBox="0 0 24 24" aria-hidden className="size-4 fill-none stroke-current stroke-2 [stroke-linecap:round] [stroke-linejoin:round]"><path d="M3 17 17 3l4 4L7 21z" /><path d="m7 13 2 2M10 10l2 2M13 7l2 2" /></svg>
        <span className="sr-only">{label}</span>
      </button>
      {mounted && on && createPortal(
        <div aria-hidden>
          <div className="pointer-events-none fixed inset-0 z-[39]">
            <div className="mx-auto grid h-full w-full max-w-[1120px] grid-cols-4 gap-4 px-4 sm:grid-cols-12 sm:gap-6 sm:px-8">
              {Array.from({ length: 12 }, (_, i) => <i key={i} className={`bg-[rgba(229,62,62,0.07)] ${i >= 4 ? "hidden sm:block" : ""}`} />)}
            </div>
          </div>
          <div className="pointer-events-none absolute left-0 top-0 z-40 w-full">
            {boxes.map((b, i) => (
              <div key={i} className="absolute outline-1 -outline-offset-1 outline-dashed outline-[var(--entity-design)]" style={{ left: b.x, top: b.y, width: b.w, height: b.h }}>
                <span className="absolute bottom-full left-[-1px] max-w-[92vw] truncate rounded-t-[3px] bg-[var(--entity-design)] px-1.5 font-label text-[10.5px] leading-[1.6] text-canvas">{b.tag}</span>
              </div>
            ))}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

/** Before paint: the intro plays once a session, never under reduced motion or for automated browsers. */
export const INTRO_SCRIPT = `try{var r=document.documentElement;if(!sessionStorage.getItem("fedo-intro")&&!navigator.webdriver&&!matchMedia("(prefers-reduced-motion: reduce)").matches){sessionStorage.setItem("fedo-intro","1");r.classList.add("fedo-intro");var e=function(){r.classList.remove("fedo-intro")};setTimeout(e,2300);addEventListener("keydown",e,{once:true});addEventListener("pointerdown",e,{once:true})}}catch(x){}`;

/** The intro: the F draws itself, the cursor flies into the notch and clicks, the view dives into the site. */
export function FedoIntro() {
  return (
    <div aria-hidden className="fedo-intro-layer">
      <svg viewBox="0 0 392 392">
        <g transform="translate(28 0)">
          <path className="i-f" pathLength={1} d={FEDO_F} />
          <circle className="i-r" cx="200" cy="200" r="34" />
          <path className="i-c" d={FEDO_CURSOR} />
        </g>
      </svg>
    </div>
  );
}
