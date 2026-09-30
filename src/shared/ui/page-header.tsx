import type { ReactNode } from "react";

/** Page title in the notebook style: condensed uppercase title, lede, optional progress on the right. */
export function PageHeader({ eyebrow, title, lede, progress, stat, children }: {
  eyebrow?: ReactNode;
  title: string;
  lede?: ReactNode;
  /** 0–100; shown as a large percentage like the notebook's stage progress. */
  progress?: { value: number; caption: string };
  /** A big number instead of a percentage (e.g. frequency). */
  stat?: { value: number | string; caption: string };
  children?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0 max-w-3xl">
        {eyebrow && <p className="mb-2 text-meta font-semibold text-fg-secondary">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {lede && <div className="mt-3 max-w-[62ch] text-fg-secondary">{lede}</div>}
        {children}
      </div>
      {stat && (
        <p className="text-right">
          <span className="display-num block text-[44px] leading-none tabular-nums">{stat.value}</span>
          <span className="text-caption font-medium text-fg-secondary">{stat.caption}</span>
        </p>
      )}
      {progress && (
        <p className="text-right">
          <span className="display-num block text-[44px] leading-none tabular-nums">{Math.round(progress.value)}%</span>
          <span className="text-caption font-medium text-fg-secondary">{progress.caption}</span>
        </p>
      )}
    </header>
  );
}
