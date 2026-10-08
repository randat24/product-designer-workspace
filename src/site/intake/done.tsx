"use client";

import { CheckCircle2, FileDown, Share2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { button, sg } from "../signal/ui";
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


  return (
    <div className="flex flex-col gap-8">
      <div className="flex max-w-[680px] flex-col gap-4">
        <CheckCircle2 aria-hidden className="size-12 text-success" />
        <h1 ref={heading} tabIndex={-1} className="t-page outline-none">
          {t.title}
        </h1>
        <p className="text-[18px] leading-[1.55] text-fg-secondary">{t.lead}</p>
        {done.duplicate && <p className="text-[15px] text-fg-secondary">{t.duplicate}</p>}
      </div>

      <dl className="sg-panel grid max-w-[680px] gap-4 p-5 sm:grid-cols-3 sm:p-6">
        {[[t.code, done.code], [t.date, date], [t.project, done.projectName ?? t.noName]].map(([k, v]) => (
          <div key={k} className="flex flex-col gap-1">
            <dt className="sg-eyebrow text-fg-secondary">{k}</dt>
            <dd className="text-[17px] font-semibold">{v}</dd>
          </div>
        ))}
      </dl>

      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={download} disabled={busy !== null} aria-busy={busy === "download" || undefined}
            className={button({ variant: "primary" })}>
            {t.download}
            <FileDown aria-hidden className="size-4" />
          </button>
          {canShare && (
            <button type="button" onClick={share} disabled={busy !== null} aria-busy={busy === "share" || undefined}
              className={button({ variant: "secondary" })}>
              {t.share}
              <Share2 aria-hidden className="size-4" />
            </button>
          )}
        </div>
        <p className="text-[14px] text-fg-secondary">{t.tokenNote}</p>
        {failed && <p role="alert" className="text-[15px] font-semibold text-danger">{INTAKE[locale].failed.server}</p>}
      </div>

      <section aria-labelledby="next-h" className="flex max-w-[680px] flex-col gap-4 border-t border-line pt-6">
        <h2 id="next-h" className="text-[21px] font-semibold tracking-[-0.02em]">{t.nextTitle}</h2>
        <ol className="flex flex-col gap-3">
          {t.next.map((s, i) => (
            <li key={s} className="flex gap-3 text-[16px] leading-snug">
              <span className="w-7 shrink-0 pt-0.5 font-label text-[12px] text-accent-text">{String(i + 1).padStart(2, "0")}</span>
              <span className="pt-0.5">{s}</span>
            </li>
          ))}
        </ol>
      </section>

      <div className="flex flex-wrap gap-6">
        <Link href={`/${locale}`} className={sg.link}>{t.home}</Link>
        <button type="button" onClick={onNew} className={sg.link}>{INTAKE[locale].intro.start} ↺</button>
      </div>
    </div>
  );
}
