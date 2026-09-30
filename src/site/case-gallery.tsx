"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { track } from "./analytics/track";
import type { GalleryItem } from "./content";

type Labels = { pages: string; pagesLead: string; open: string; close: string; prev: string; next: string };

const counter = (template: string, n: number, total: number) => template.replace("{n}", String(n)).replace("{total}", String(total));

/**
 * Project pages to browse when there is no live site (or it is a concept): a grid of thumbnails
 * and a full-screen viewer on the native <dialog> (Esc closes, arrows flip, focus stays inside).
 */
export function CaseGallery({ items, labels, caseSlug }: { items: GalleryItem[]; labels: Labels; caseSlug: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState(0);
  const total = items.length;
  const item = items[index];

  const openAt = (i: number) => {
    setIndex(i);
    dialog.current?.showModal();
    track("case_gallery_open", { case_slug: caseSlug, page: i + 1 });
  };
  const go = useCallback((delta: number) => setIndex((i) => (i + delta + total) % total), [total]);

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
      <p className="mb-5 max-w-[680px] text-fg-secondary">{labels.pagesLead}</p>
      <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((it, i) => (
          <li key={it.src}>
            <button
              type="button"
              onClick={() => openAt(i)}
              className="group flex w-full flex-col gap-2 text-left"
              aria-label={`${counter(labels.open, i + 1, total)}: ${it.alt}`}
            >
              <span className="block overflow-hidden rounded-[12px] border border-line bg-surface transition-transform duration-200 group-hover:-translate-y-1">
                {/* eslint-disable-next-line @next/next/no-img-element -- project pages of any origin, sizes known */}
                <img src={it.src} alt="" width={it.width} height={it.height} loading="lazy" decoding="async" className="h-auto w-full" />
              </span>
              {it.caption && <span className="text-[13px] font-semibold">{it.caption}</span>}
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialog}
        aria-label={labels.pages}
        className="m-auto h-full max-h-none w-full max-w-none bg-transparent p-0 backdrop:bg-black/85"
        onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}
      >
        <div className="flex h-full flex-col items-center justify-center gap-4 p-4 text-white" onClick={(e) => e.target === e.currentTarget && dialog.current?.close()}>
          <div className="flex w-full max-w-5xl items-center justify-between gap-4 text-[14px]">
            <span aria-live="polite">{counter(labels.open, index + 1, total)}{item.caption ? ` · ${item.caption}` : ""}</span>
            <button type="button" onClick={() => dialog.current?.close()} className="rounded-full border border-white/40 px-4 py-1.5 font-semibold hover:bg-white/10">
              {labels.close} ✕
            </button>
          </div>
          <div className="flex min-h-0 w-full max-w-5xl flex-1 items-center gap-3">
            <NavButton label={labels.prev} onClick={() => go(-1)} hidden={total < 2}>‹</NavButton>
            <div className="flex h-full min-w-0 flex-1 items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element -- full-size project page */}
              <img
                src={item.src}
                alt={item.alt}
                width={item.width}
                height={item.height}
                className={cn("max-h-full w-auto rounded-[10px] object-contain", item.device === "mobile" ? "max-w-[420px]" : "max-w-full")}
              />
            </div>
            <NavButton label={labels.next} onClick={() => go(1)} hidden={total < 2}>›</NavButton>
          </div>
        </div>
      </dialog>
    </>
  );
}

function NavButton({ label, onClick, hidden, children }: { label: string; onClick: () => void; hidden: boolean; children: React.ReactNode }) {
  if (hidden) return null;
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-white/40 text-[28px] leading-none hover:bg-white/10"
    >
      {children}
    </button>
  );
}
