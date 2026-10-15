"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { track } from "./analytics/track";
import { button } from "./signal/ui";
import type { GalleryItem } from "./content";
import { SIZES, responsive } from "@/site/img";

type Labels = {
  pages: string; pagesLead: string; phone: string; open: string; close: string; prev: string; next: string; zoomIn: string; zoomOut: string;
};

const counter = (template: string, n: number, total: number) => template.replace("{n}", String(n)).replace("{total}", String(total));

/**
 * Project pages to browse when there is no live site (or it is a concept): a grid of thumbnails
 * and a full-screen viewer on the native <dialog> (Esc closes, arrows or a swipe flip, focus stays inside).
 * On a phone held upright the viewer is edge to edge and opens a wide page at the full screen height, to pan
 * sideways and read; a tap shows the whole page and back. Phone screens fill the height anyway and do not zoom.
 * Phone screens (device: "mobile") get their own, narrower grid under the desktop pages; the viewer flips through all.
 */
export function CaseGallery({ items, labels, caseSlug }: { items: GalleryItem[]; labels: Labels; caseSlug: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const touch = useRef<{ x: number; y: number; atStart: boolean; atEnd: boolean } | null>(null);
  const [index, setIndex] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  // Desktop pages first, then the phone screens: the viewer's order matches the order on the page.
  const ordered = [...items.filter((it) => it.device !== "mobile"), ...items.filter((it) => it.device === "mobile")];
  const total = ordered.length;
  const item = ordered[index];
  const phoneFrom = ordered.findIndex((it) => it.device === "mobile");
  const canZoom = (it: GalleryItem | undefined) => !!it && it.device !== "mobile" && it.width > it.height;
  // Upright phone: a wide page fitted to the width is a strip a quarter of the screen high, so it opens zoomed.
  const zoomFirst = (it: GalleryItem | undefined) =>
    canZoom(it) && window.matchMedia("(max-width: 39.9375rem) and (orientation: portrait)").matches;

  const openAt = (i: number) => {
    setIndex(i);
    setZoomed(zoomFirst(ordered[i]));
    dialog.current?.showModal();
    track("case_gallery_open", { case_slug: caseSlug, page: i + 1 });
  };
  const go = useCallback((delta: number) => {
    const next = (index + delta + total) % total;
    setZoomed(zoomFirst(ordered[next]));
    setIndex(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `ordered` follows `items`
  }, [index, total, items]);

  // A horizontal swipe flips pages. A zoomed page pans first: the swipe flips only from its edge.
  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    const el = stage.current;
    if (e.touches.length !== 1 || !t || !el) return void (touch.current = null);
    const atStart = !zoomed || el.scrollLeft <= 1;
    const atEnd = !zoomed || el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
    touch.current = { x: t.clientX, y: t.clientY, atStart, atEnd };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    const start = touch.current;
    const t = e.changedTouches[0];
    touch.current = null;
    if (!start || !t || total < 2) return;
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    if (Math.abs(dx) <= 48 || Math.abs(dx) <= Math.abs(dy) * 1.5) return;
    if (dx < 0 && start.atEnd) go(1);
    if (dx > 0 && start.atStart) go(-1);
  };

  // Zooming in starts at the left edge of the page, where reading starts.
  useEffect(() => {
    if (zoomed) stage.current?.scrollTo({ left: 0, top: 0 });
  }, [zoomed, index]);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    const onKey = (e: KeyboardEvent) => {
      if (!el.open) return;
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    el.addEventListener("keydown", onKey);
    return () => el.removeEventListener("keydown", onKey);
  }, [go]);

  if (!item) return null;

  return (
    <>
      <p className="mb-5 max-w-[42.5rem] text-fg-secondary">{labels.pagesLead}</p>
      <Thumbs items={ordered.slice(0, phoneFrom < 0 ? total : phoneFrom)} offset={0} total={total} labels={labels} onOpen={openAt}
        className="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4" />
      {phoneFrom >= 0 && (
        <>
          <h3 className="mt-10 mb-4 text-[1.125rem] font-semibold">{labels.phone}</h3>
          <Thumbs items={ordered.slice(phoneFrom)} offset={phoneFrom} total={total} labels={labels} onOpen={openAt}
            className="grid-cols-2 sm:grid-cols-4 lg:grid-cols-6" />
        </>
      )}

      {/* Clicking outside the page closes the viewer for mouse users; the keyboard has Esc (native <dialog>). */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <dialog
        ref={dialog}
        aria-label={labels.pages}
        onClose={() => setZoomed(false)}
        className="m-0 h-dvh max-h-none w-screen max-w-none bg-black p-0 text-white backdrop:bg-black sm:bg-transparent sm:backdrop:bg-black/90"
        onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
      >
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div
          className="sg-viewer flex h-full flex-col items-center gap-2 sm:gap-4 sm:p-4"
          onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
        >
          <div className="sg-viewer-bar flex w-full max-w-[112.5rem] items-center justify-between gap-3 px-4 pt-2 text-[0.875rem] sm:px-0 sm:pt-0">
            <span aria-live="polite" className="min-w-0 truncate">{counter(labels.open, index + 1, total)}{item.caption ? ` · ${item.caption}` : ""}</span>
            <button type="button" onClick={() => dialog.current?.close()} className={button({ variant: "on-dark", size: "sm" }, "shrink-0")}>
              {labels.close} ✕
            </button>
          </div>
          <div className="flex min-h-0 w-full max-w-[112.5rem] flex-1 items-center gap-3">
            <span className="hidden sm:contents">
              <NavButton label={labels.prev} onClick={() => go(-1)} hidden={total < 2}><ChevronLeft aria-hidden className="size-6" strokeWidth={1.75} /></NavButton>
            </span>
            <div
              ref={stage}
              className={cn("flex h-full min-w-0 flex-1", zoomed ? "overflow-auto overscroll-contain" : "items-center justify-center")}
              onTouchStart={onTouchStart}
              onTouchEnd={onTouchEnd}
            >
              {/* Tapping the page switches between "whole page" and "page height fills the screen" (pan to read). */}
              <button
                type="button"
                disabled={!canZoom(item)}
                onClick={() => setZoomed((z) => !z)}
                aria-pressed={canZoom(item) ? zoomed : undefined}
                aria-label={canZoom(item) ? `${zoomed ? labels.zoomOut : labels.zoomIn}: ${item.alt}` : undefined}
                className={cn("shrink-0", zoomed ? "h-full cursor-zoom-out" : "flex h-full w-full items-center justify-center cursor-zoom-in disabled:cursor-default")}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- full-size project page */}
                <img
                  src={item.src}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  className={cn(
                    "rounded-[0.25rem]",
                    zoomed
                      ? "h-full w-auto max-w-none"
                      : cn("max-h-full w-auto object-contain", item.device === "mobile" ? "max-w-full sm:max-w-[26.25rem]" : "max-w-full"),
                  )}
                />
              </button>
            </div>
            <span className="hidden sm:contents">
              <NavButton label={labels.next} onClick={() => go(1)} hidden={total < 2}><ChevronRight aria-hidden className="size-6" strokeWidth={1.75} /></NavButton>
            </span>
          </div>
          {/* A phone has no room beside the page: the arrows sit under it, where the thumb is. */}
          <div className="sg-viewer-bar flex w-full items-center justify-between gap-3 px-4 pb-2 sm:hidden">
            <NavButton label={labels.prev} onClick={() => go(-1)} hidden={total < 2}><ChevronLeft aria-hidden className="size-6" strokeWidth={1.75} /></NavButton>
            <span aria-hidden className="text-center text-[0.8125rem] text-white/70">{canZoom(item) ? (zoomed ? labels.zoomOut : labels.zoomIn) : null}</span>
            <NavButton label={labels.next} onClick={() => go(1)} hidden={total < 2}><ChevronRight aria-hidden className="size-6" strokeWidth={1.75} /></NavButton>
          </div>
        </div>
      </dialog>
    </>
  );
}

function Thumbs({ items, offset, total, labels, onOpen, className }: {
  items: GalleryItem[]; offset: number; total: number; labels: Labels; onOpen: (i: number) => void; className: string;
}) {
  return (
    <ul className={cn("grid gap-4", className)}>
      {items.map((it, i) => (
        <li key={it.src}>
          <button
            type="button"
            onClick={() => onOpen(offset + i)}
            className="group flex w-full flex-col gap-2 text-left"
            aria-label={`${counter(labels.open, offset + i + 1, total)}: ${it.alt}`}
          >
            <span className="block overflow-hidden rounded-[0.5rem] border border-line bg-surface transition-transform duration-(--duration-base) group-hover:-translate-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element -- project pages of any origin, sizes known */}
              <img {...responsive(it.src, it.width, SIZES.thumb)} alt="" width={it.width} height={it.height} loading="lazy" decoding="async" className="h-auto w-full" />
            </span>
            {it.caption && <span className="text-[0.8125rem] font-semibold">{it.caption}</span>}
          </button>
        </li>
      ))}
    </ul>
  );
}

function NavButton({ label, onClick, hidden, children }: { label: string; onClick: () => void; hidden: boolean; children: React.ReactNode }) {
  if (hidden) return null;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={button({ variant: "on-dark", icon: true })}
    >
      {children}
    </button>
  );
}
