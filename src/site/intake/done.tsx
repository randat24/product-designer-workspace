"use client";

import { CheckCircle2, FileDown, Share2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { track } from "../analytics/track";
import type { Locale } from "../content";
import { INTAKE } from "./content";
import type { DoneState } from "./draft";
import { briefFileName } from "@/domains/requests/file-name";

async function fetchBrief(token: string, locale: Locale): Promise<Blob | null> {
  try {
    const res = await fetch("/api/project-request/brief", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, locale }),
    });
    return res.ok ? await res.blob() : null;
  } catch {
    return null;
  }
}

export function Done({ locale, done, onNew }: { locale: Locale; done: DoneState; onNew: () => void }) {
  const t = INTAKE[locale].done;
  const heading = useRef<HTMLHeadingElement>(null);
  const [busy, setBusy] = useState<"download" | "share" | null>(null);
  const [failed, setFailed] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const fileName = briefFileName(done.projectName, done.code, done.submittedAt);
  const date = new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "en-GB", { day: "numeric", month: "long", year: "numeric" })
    .format(new Date(done.submittedAt));

  useEffect(() => {
    heading.current?.focus();
    setCanShare(typeof navigator !== "undefined" && typeof navigator.canShare === "function"
      && navigator.canShare({ files: [new File([""], "x.pdf", { type: "application/pdf" })] }));
  }, []);

  const download = async () => {
    setBusy("download");
    setFailed(false);
    const blob = await fetchBrief(done.token, locale);
    setBusy(null);
    if (!blob) return setFailed(true);
    const url = URL.createObjectURL(blob);
    const a = Object.assign(document.createElement("a"), { href: url, download: fileName });
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    track("project_brief_downloaded", { location: "confirmation" });
  };

  const share = async () => {
    setBusy("share");
    setFailed(false);
    const blob = await fetchBrief(done.token, locale);
    setBusy(null);
    if (!blob) return setFailed(true);
    try {
      await navigator.share({ files: [new File([blob], fileName, { type: "application/pdf" })], title: `${t.shareText} ${done.code}` });
      track("project_brief_downloaded", { location: "confirmation" });
    } catch {
      // The visitor closed the share sheet.
    }
  };

  const btn = "inline-flex h-12 items-center justify-center gap-2 rounded-[10px] border-[1.5px] px-5 text-[15px] font-semibold transition-colors duration-[120ms] disabled:cursor-progress disabled:opacity-80";

  return (
    <div className="flex flex-col gap-8">
      <div className="flex max-w-[680px] flex-col gap-4">
        <CheckCircle2 aria-hidden className="size-12 text-success" />
        <h1 ref={heading} tabIndex={-1} className="font-display text-[clamp(34px,6vw,56px)] font-bold uppercase leading-[1.1] outline-none">
          {t.title}
        </h1>
        <p className="text-[18px] leading-[1.55] text-fg-secondary">{t.lead}</p>
        {done.duplicate && <p className="text-[15px] text-fg-secondary">{t.duplicate}</p>}
      </div>

      <dl className="grid max-w-[680px] gap-4 rounded-[14px] border-[1.5px] border-fg bg-surface p-5 sm:grid-cols-3 sm:p-6">
        {[[t.code, done.code], [t.date, date], [t.project, done.projectName ?? t.noName]].map(([k, v]) => (
          <div key={k} className="flex flex-col gap-1">
            <dt className="text-[13px] font-semibold uppercase tracking-[0.08em] text-fg-secondary">{k}</dt>
            <dd className="text-[17px] font-semibold">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={download} disabled={busy !== null} aria-busy={busy === "download" || undefined}
            className={cn(btn, "border-accent bg-accent text-on-accent hover:bg-accent-hover")}>
            {t.download}
            <FileDown aria-hidden className="size-4" />
          </button>
          {canShare && (
            <button type="button" onClick={share} disabled={busy !== null} aria-busy={busy === "share" || undefined}
              className={cn(btn, "border-fg text-fg hover:bg-subtle")}>
              {t.share}
              <Share2 aria-hidden className="size-4" />
            </button>
          )}
        </div>
        <p className="text-[14px] text-fg-secondary">{t.tokenNote}</p>
        {failed && <p role="alert" className="text-[15px] font-semibold text-danger">{INTAKE[locale].failed.server}</p>}
      </div>

      <section aria-labelledby="next-h" className="flex max-w-[680px] flex-col gap-4 border-t-[1.5px] border-fg pt-6">
        <h2 id="next-h" className="font-display text-[24px] font-bold uppercase leading-[1.1]">{t.nextTitle}</h2>
        <ol className="flex flex-col gap-3">
          {t.next.map((s, i) => (
            <li key={s} className="flex gap-3 text-[16px] leading-snug">
              <span className="display-num grid size-7 shrink-0 place-items-center rounded-full bg-subtle text-[13px]">{i + 1}</span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-wrap gap-4 text-[15px] font-semibold">
        <Link href={`/${locale}`} className="underline underline-offset-4">{t.home}</Link>
        <button type="button" onClick={onNew} className="underline underline-offset-4">{INTAKE[locale].intro.start} ↺</button>
      </div>
    </div>
  );
}
