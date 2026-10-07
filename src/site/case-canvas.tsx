"use client";

import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/shared/lib/cn";
import { FEDO_CURSOR } from "@/shared/ui/fedo-mark";
import { PROCESS_STAGES, type CaseProcess } from "./case-process";

export type CanvasCase = {
  slug: string;
  href: string;
  title: string;
  /** Shown under the frame, Figma-style: «01 · Title». */
  label: string;
  cover?: { src: string; width: number; height: number; alt: string };
  /** No cover: up to four screens from the case's gallery, side by side like phones on a board. */
  screens?: { src: string; width: number; height: number }[];
  sticker: string;
  blurred: boolean;
  process?: CaseProcess;
  /** What the guide cursor says at this frame. */
  say: string;
  track: Record<string, string>;
};

type Labels = {
  page: string; layers: string; legend: string; note: string; hint: string; region: string;
  zoomIn: string; zoomOut: string; fit: string; drag: string; show: string; open: string;
  stickies: string; noProcess: string; placeholder: string;
  stages: Record<keyof CaseProcess, string>;
  /** «45» + «записів у зошиті» per case, already counted. */
  records: Record<string, { n: number; rest: string }>;
};

const FW = 720, FH = 450, SW = 300, GAP = 32, PAD = 100, TOP = 120, ROW = 680;
const LEGEND = PROCESS_STAGES.filter((s, i, all) => all.findIndex((x) => x.color === s.color) === i);

/**
 * The home page as an open design file: every case is a frame on a canvas, with its workbook records stuck
 * beside it. Drag (or arrow keys) to move, Ctrl + wheel (or + / −) to zoom, a frame opens its case. While nobody
 * touches it, the FEDO cursor walks through the frames and says what each one holds. Desktop only; phones get the
 * card list.
 */
export function CaseCanvas({ cases, labels }: { cases: CanvasCase[]; labels: Labels }) {
  const vpRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const hasStrips = cases.some((c) => c.process);
  const blockW = FW + (hasStrips ? GAP + SW : 0);
  const colStep = blockW + 110;
  const pos = useMemo(() => cases.map((_, i) => [PAD + (i % 2) * colStep, TOP + Math.floor(i / 2) * ROW] as const), [cases, colStep]);
  const W = PAD * 2 + (cases.length > 1 ? colStep : 0) + blockW;
  const H = TOP + (Math.ceil(cases.length / 2) - 1) * ROW + FH + 110;

  useEffect(() => {
    const vp = vpRef.current, world = worldRef.current;
    if (!vp || !world) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const guideEl = vp.querySelector<HTMLElement>("[data-guide]")!;
    const sayEl = vp.querySelector<HTMLElement>("[data-say]")!;
    const zoomEl = vp.querySelector<HTMLElement>("[data-zoom]")!;
    let V = { x: 0, y: 0, s: 0.4 }, raf = 0, moved = false, alive = true;

    const apply = () => {
      world.style.transform = `translate(${V.x}px, ${V.y}px) scale(${V.s})`;
      world.style.setProperty("--s", V.s.toFixed(4));
      vp.style.backgroundSize = `${24 * V.s}px ${24 * V.s}px`;
      vp.style.backgroundPosition = `${V.x}px ${V.y}px`;
      zoomEl.textContent = `${Math.round(V.s * 100)}%`;
      guide.sync();
    };
    const go = (t: typeof V, anim: boolean) => {
      cancelAnimationFrame(raf);
      if (!anim || reduce) { V = { ...t }; apply(); return; }
      const from = { ...V }, t0 = performance.now();
      const step = (now: number) => {
        const k = Math.min(1, (now - t0) / 560), e = 1 - Math.pow(1 - k, 3);
        V = { x: from.x + (t.x - from.x) * e, y: from.y + (t.y - from.y) * e, s: from.s + (t.s - from.s) * e };
        apply();
        if (k < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
    };
    const fitRect = (r: { x: number; y: number; w: number; h: number }, anim: boolean, max = 1) => {
      const w = vp.clientWidth, h = vp.clientHeight;
      if (!w || !h) return;
      const s = Math.max(0.12, Math.min(w / r.w, h / r.h, max));
      go({ s, x: (w - r.w * s) / 2 - r.x * s, y: (h - r.h * s) / 2 - r.y * s }, anim);
    };
    const fitAll = (anim: boolean) => { moved = false; fitRect({ x: 40, y: -30, w: W - 80, h: H + 30 }, anim); };
    const flyTo = (i: number) => {
      moved = true;
      const [x, y] = pos[i]!;
      fitRect({ x: x - 40, y: y - 70, w: blockW + 80, h: FH + 150 }, true, 1.1);
    };
    const zoomAt = (px: number, py: number, ns: number) => {
      ns = Math.max(0.12, Math.min(2.5, ns));
      V = { x: px - (px - V.x) * (ns / V.s), y: py - (py - V.y) * (ns / V.s), s: ns };
      moved = true;
      apply();
    };
    const zoomCenter = (f: number) => zoomAt(vp.clientWidth / 2, vp.clientHeight / 2, V.s * f);

    /* The guide: FEDO's cursor goes frame to frame while the canvas is left alone. */
    const steps = cases.flatMap((c, i) => {
      const [x, y] = pos[i]!;
      const frame = { i, at: { x: x + FW * 0.62, y: y + FH * 0.56 }, say: c.say, select: true };
      return i === cases.findIndex((k) => k.process)
        ? [frame, { i, at: { x: x + FW + GAP + 150, y: y + 120 }, say: labels.stickies, select: false }]
        : [frame];
    });
    const guide = (() => {
      let n = 0, timer = 0, idle = 0, point: { x: number; y: number } | null = null, walking = false;
      const place = () => {
        if (!point) return;
        guideEl.style.setProperty("--gx", `${V.x + point.x * V.s}px`);
        guideEl.style.setProperty("--gy", `${V.y + point.y * V.s}px`);
      };
      const clear = () => world.querySelectorAll(".is-guided").forEach((f) => f.classList.remove("is-guided"));
      const allowed = () => alive && !reduce && vp.offsetParent !== null && !document.hidden && steps.length > 0;
      const next = () => {
        window.clearTimeout(timer);
        if (!allowed()) return;
        const st = steps[n % steps.length]!;
        n += 1;
        point = st.at;
        const sx = V.x + point.x * V.s, sy = V.y + point.y * V.s;
        if (sx < 30 || sy < 30 || sx > vp.clientWidth - 60 || sy > vp.clientHeight - 60) fitAll(true);
        guideEl.classList.remove("is-saying");
        clear();
        walking = true;
        guideEl.classList.add("is-walking");
        timer = window.setTimeout(() => {
          place();
          timer = window.setTimeout(() => {
            walking = false;
            guideEl.classList.remove("is-walking");
            if (!allowed()) return;
            sayEl.textContent = st.say;
            guideEl.classList.add("is-saying");
            if (st.select) world.querySelector(`[data-frame="${st.i}"]`)?.classList.add("is-guided");
            timer = window.setTimeout(next, 3400);
          }, 1200);
        }, 600);
      };
      return {
        sync() { if (!walking) place(); },
        start() { if (reduce) return; point = { x: W / 2, y: H / 2 }; place(); guideEl.hidden = false; timer = window.setTimeout(next, 1200); },
        stop() { window.clearTimeout(timer); window.clearTimeout(idle); clear(); },
        pause() {
          window.clearTimeout(timer); window.clearTimeout(idle);
          guideEl.classList.remove("is-saying"); clear();
          idle = window.setTimeout(next, 8000);
        },
      };
    })();

    /* Drag to pan; a drag never opens a frame. */
    let drag: { id: number; x: number; y: number; vx: number; vy: number; moved: boolean } | null = null;
    let dragged = false;
    const down = (e: PointerEvent) => {
      if (e.button !== 0 || (e.target as Element).closest("[data-controls]")) return;
      drag = { id: e.pointerId, x: e.clientX, y: e.clientY, vx: V.x, vy: V.y, moved: false };
      guide.pause();
    };
    const move = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.id) return;
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 4) { drag.moved = true; vp.setPointerCapture(e.pointerId); vp.classList.add("is-dragging"); }
      if (drag.moved) { cancelAnimationFrame(raf); V.x = drag.vx + dx; V.y = drag.vy + dy; moved = true; apply(); }
    };
    const up = () => {
      if (!drag) return;
      if (drag.moved) { dragged = true; window.setTimeout(() => { dragged = false; }, 0); }
      drag = null;
      vp.classList.remove("is-dragging");
    };
    const wheel = (e: WheelEvent) => {
      const r = vp.getBoundingClientRect();
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        zoomAt(e.clientX - r.left, e.clientY - r.top, V.s * Math.exp(-e.deltaY * 0.0018));
        guide.pause();
      } else if (e.shiftKey || Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        // Sideways scroll moves the canvas; plain vertical scroll stays with the page.
        e.preventDefault();
        cancelAnimationFrame(raf);
        V.x -= e.shiftKey ? e.deltaY : e.deltaX;
        if (!e.shiftKey) V.y -= e.deltaY;
        moved = true;
        apply();
        guide.pause();
      }
    };
    const key = (e: KeyboardEvent) => {
      if (e.target !== vp) return;
      const step = 80;
      if (e.key.startsWith("Arrow")) {
        e.preventDefault();
        cancelAnimationFrame(raf);
        if (e.key === "ArrowLeft") V.x += step;
        if (e.key === "ArrowRight") V.x -= step;
        if (e.key === "ArrowUp") V.y += step;
        if (e.key === "ArrowDown") V.y -= step;
        moved = true; apply(); guide.pause();
      } else if (e.key === "+" || e.key === "=") { e.preventDefault(); zoomCenter(1.25); }
      else if (e.key === "-") { e.preventDefault(); zoomCenter(0.8); }
      else if (e.key === "0") { e.preventDefault(); fitAll(true); }
    };
    const click = (e: MouseEvent) => {
      const t = e.target as Element;
      const frame = t.closest<HTMLAnchorElement>("[data-frame]");
      if (frame) {
        if (dragged) { e.preventDefault(); return; }
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        guide.pause();
        flyTo(Number(frame.dataset.frame));
        const href = frame.getAttribute("href")!;
        window.setTimeout(() => router.push(href), reduce ? 0 : 450);
        return;
      }
      const layer = t.closest<HTMLElement>("[data-fly]");
      if (layer) { guide.pause(); flyTo(Number(layer.dataset.fly)); return; }
      const z = t.closest<HTMLElement>("[data-z]")?.dataset.z;
      if (z === "in") zoomCenter(1.25);
      if (z === "out") zoomCenter(0.8);
      if (z === "fit") fitAll(true);
    };
    const focus = (e: FocusEvent) => {
      const f = (e.target as Element).closest<HTMLElement>("[data-frame]");
      if (f && f.matches(":focus-visible")) flyTo(Number(f.dataset.frame));
    };
    const root = vp.parentElement!;
    vp.addEventListener("pointerdown", down);
    vp.addEventListener("pointermove", move);
    vp.addEventListener("pointerup", up);
    vp.addEventListener("pointercancel", up);
    vp.addEventListener("wheel", wheel, { passive: false });
    vp.addEventListener("keydown", key);
    root.addEventListener("click", click);
    vp.addEventListener("focusin", focus);
    const ro = new ResizeObserver(() => { if (!moved) fitAll(false); else apply(); });
    ro.observe(vp);
    guide.start();
    return () => {
      alive = false;
      guide.stop();
      cancelAnimationFrame(raf);
      ro.disconnect();
      vp.removeEventListener("pointerdown", down);
      vp.removeEventListener("pointermove", move);
      vp.removeEventListener("pointerup", up);
      vp.removeEventListener("pointercancel", up);
      vp.removeEventListener("wheel", wheel);
      vp.removeEventListener("keydown", key);
      root.removeEventListener("click", click);
      vp.removeEventListener("focusin", focus);
    };
  }, [cases, labels.stickies, pos, blockW, W, H, router]);

  return (
    <div className="grid h-[clamp(480px,68vh,720px)] overflow-hidden rounded-[20px] border border-line bg-surface lg:grid-cols-[220px_minmax(0,1fr)]" data-spec="Полотно">
      <aside aria-label={labels.layers} className="hidden min-w-0 flex-col gap-3 border-r border-line px-2.5 py-3.5 lg:flex" data-controls>
        <p className="px-2 font-label text-[11px] uppercase tracking-[0.04em] text-fg-secondary">{labels.page}</p>
        <ul className="grid gap-0.5">
          {cases.map((c, i) => (
            <li key={c.slug}>
              <button type="button" data-fly={i} data-cursor={labels.show}
                className="grid w-full grid-cols-[14px_minmax(0,1fr)_auto] items-center gap-2 rounded-[8px] px-2 py-1.5 text-left text-[13px] font-semibold hover:bg-subtle">
                <svg viewBox="0 0 16 16" aria-hidden className="size-3.5 fill-none stroke-fg-secondary stroke-[1.6]"><path d="M4 1v14M12 1v14M1 4h14M1 12h14" /></svg>
                <span className="truncate">{c.title}</span>
                {c.process && <span className="font-label text-[11px] font-normal text-fg-secondary">{labels.records[c.slug]?.n}</span>}
              </button>
            </li>
          ))}
        </ul>
        {hasStrips && (
          <ul aria-label={labels.legend} className="mx-2 grid gap-1.5 text-[12px] text-fg-secondary">
            {LEGEND.map((s) => (
              <li key={s.key} className="flex items-center gap-2"><i aria-hidden className="size-[9px] rounded-[2px]" style={{ background: s.color }} />{labels.stages[s.key]}</li>
            ))}
          </ul>
        )}
        {hasStrips && <p className="mx-2 mt-auto text-[12px] leading-[1.45] text-fg-secondary">{labels.note}</p>}
      </aside>

      {/* Focusable like a scrollable region: the arrow keys and +/− move the canvas. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- keyboard panning of the canvas */}
      <div ref={vpRef} tabIndex={0} role="region" aria-label={labels.region} data-cursor={labels.drag}
        className="fedo-canvas relative cursor-grab touch-none select-none overflow-hidden bg-canvas [&.is-dragging]:cursor-grabbing">
        <div ref={worldRef} className="absolute left-0 top-0 origin-top-left [--s:0.4]" style={{ width: W, height: H }}>
          {cases.map((c, i) => {
            const [x, y] = pos[i]!;
            return (
              <article key={c.slug} className="absolute flex items-start gap-8" style={{ left: x, top: y }}>
                <div className="relative">
                  <p className="absolute bottom-full left-0 mb-[calc(7px/var(--s))] whitespace-nowrap font-label text-[calc(12px/var(--s))] leading-[1.2] text-fg-secondary">{c.label}</p>
                  <a href={c.href} data-frame={i} data-cursor={labels.open} aria-label={`${labels.open}: ${c.title}`} {...c.track}
                    className="fedo-frame relative block bg-surface shadow-[0_1px_0_var(--line),0_18px_40px_rgba(21,26,51,0.1)]"
                    style={{ width: FW, height: FH, background: c.cover ? undefined : c.screens?.length ? "var(--subtle)" : c.sticker }}>
                    {c.cover ? (
                      // eslint-disable-next-line @next/next/no-img-element -- case cover with known size, drawn inside a scaled canvas
                      <img src={c.cover.src} alt="" width={c.cover.width} height={c.cover.height} draggable={false} decoding="async"
                        className={cn("pointer-events-none size-full select-none object-cover", c.blurred && "blur-xl")} />
                    ) : c.screens?.length ? (
                      <span className={cn("flex size-full items-center justify-center gap-2 px-1", c.blurred && "blur-xl")}>
                        {c.screens.map((sc, k) => (
                          // eslint-disable-next-line @next/next/no-img-element -- gallery screen with known size, drawn inside a scaled canvas
                          <img key={k} src={sc.src} alt="" width={sc.width} height={sc.height} draggable={false} decoding="async"
                            className="pointer-events-none h-[372px] w-auto min-w-0 select-none rounded-[16px] object-cover shadow-[0_0_0_1px_var(--line),0_8px_20px_rgba(21,26,51,0.1)]" />
                        ))}
                      </span>
                    ) : (
                      <span className="grid size-full place-items-center font-label text-[18px] text-on-sticky">{labels.placeholder}</span>
                    )}
                    <span aria-hidden className="fedo-handles"><i /><i /><i /><i /></span>
                    {c.cover && <span aria-hidden className="fedo-dim">{c.cover.width} × {c.cover.height}</span>}
                  </a>
                </div>
                {hasStrips && (
                  <div className="grid w-[300px] gap-2.5">
                    {c.process ? (
                      <>
                        <p className="text-[15px] text-fg-secondary"><b className="mr-1.5 font-display text-[34px] font-semibold leading-none text-fg">{labels.records[c.slug]?.n}</b>{labels.records[c.slug]?.rest}</p>
                        <dl className="grid gap-[7px]">
                          {PROCESS_STAGES.map((s, si) => {
                            const n = c.process![s.key];
                            return (
                              <div key={s.key} className="grid grid-cols-[112px_minmax(0,1fr)_22px] items-center gap-2 text-[13px]">
                                <dt className="text-fg-secondary">{labels.stages[s.key]}</dt>
                                <dd className="contents">
                                  <span className="flex min-h-4 flex-wrap gap-1">
                                    {n === 0 ? <i className="h-0.5 w-3.5 self-center bg-line" /> : Array.from({ length: Math.min(n, 30) }, (_, k) => (
                                      <i key={k} title={`${labels.stages[s.key]}: ${k + 1} / ${n}`} className="size-3.5 rounded-[2px] shadow-[0_1px_1px_rgba(0,0,0,0.15)]"
                                        style={{ background: s.color, transform: `rotate(${(((si * 7 + k * 13) % 11) - 5) * 1.1}deg)` }} />
                                    ))}
                                  </span>
                                  <span className="text-right font-label text-[12px]">{n}</span>
                                </dd>
                              </div>
                            );
                          })}
                        </dl>
                      </>
                    ) : (
                      <p className="max-w-[26ch] text-[15px] leading-[1.45] text-fg-secondary">{labels.noProcess}</p>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>

        <div data-guide hidden aria-hidden className="fedo-guide pointer-events-none absolute left-0 top-0 z-[3]">
          <svg viewBox="192 192 96 96" className="size-6 -translate-x-px -translate-y-px fill-[#f6a94f] stroke-[#1b1b2a] stroke-[5]"><path d={FEDO_CURSOR} /></svg>
          <span className="absolute left-[18px] top-5 rounded-[6px] bg-[#f6a94f] px-2 font-label text-[11px] font-semibold leading-[1.6] tracking-[0.06em] text-[#1b1b2a]">FEDO</span>
          <span data-say className="fedo-say absolute left-[18px] top-[46px] w-max max-w-[250px] rounded-[4px_12px_12px_12px] border border-line bg-surface px-3 py-2 text-[13px] font-semibold leading-[1.4] shadow-[0_8px_20px_rgba(21,26,51,0.12)]" />
        </div>

        <div data-controls className="absolute bottom-3 left-3 flex items-center gap-0.5 rounded-[10px] border border-line bg-surface p-[3px]">
          <button type="button" data-z="out" aria-label={labels.zoomOut} className="h-[30px] min-w-[30px] rounded-[7px] px-2 font-bold hover:bg-subtle">−</button>
          <output data-zoom className="min-w-11 text-center font-label text-[12px]">40%</output>
          <button type="button" data-z="in" aria-label={labels.zoomIn} className="h-[30px] min-w-[30px] rounded-[7px] px-2 font-bold hover:bg-subtle">+</button>
          <button type="button" data-z="fit" className="h-[30px] rounded-[7px] px-2 text-[13px] font-bold hover:bg-subtle">{labels.fit}</button>
        </div>
        <p className="absolute right-3 top-3 rounded-[8px] border border-line bg-surface px-2.5 py-1 font-label text-[11px] uppercase tracking-[0.04em] text-fg-secondary">{labels.hint}</p>
      </div>
    </div>
  );
}
