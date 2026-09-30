import { t } from "@/shared/i18n/ru";

/**
 * Doherty threshold (docs/UX_LAWS.md, UX-24): shown at once while a page loads, in the shape of
 * a real page (title, lede, rows), so navigation reacts immediately and nothing jumps afterwards.
 */
export function PageSkeleton({ rows = 6 }: { rows?: number }) {
  const bar = "animate-pulse rounded-control bg-subtle motion-reduce:animate-none";
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">{t.status.loading}</span>
      <div aria-hidden="true">
        <header className="mb-8 max-w-3xl">
          <div className={`${bar} mb-3 h-4 w-40`} />
          <div className={`${bar} h-10 w-2/3 sm:h-12`} />
          <div className={`${bar} mt-4 h-4 w-full max-w-[62ch]`} />
          <div className={`${bar} mt-2 h-4 w-1/2 max-w-[40ch]`} />
        </header>
        <div className="flex flex-col gap-2 rounded-panel border border-line bg-surface p-4">
          {Array.from({ length: rows }, (_, i) => (
            <div key={i} className="flex items-center gap-3 py-1.5">
              <div className={`${bar} h-5 w-16 shrink-0`} />
              <div className={`${bar} h-4`} style={{ width: `${55 + ((i * 17) % 35)}%` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
