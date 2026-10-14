import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { PROCESS_STAGES, type CaseProcess } from "./case-process";
import { dict, type Case, type Locale } from "./content";
import { button } from "./signal/ui";
import { SIZES, responsive } from "@/site/img";

export const container = "mx-auto w-full max-w-[1440px] px-5 sm:px-8 lg:px-12";

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("sg-eyebrow text-fg-secondary", className)}>
      {children}
    </p>
  );
}

type LinkButtonProps = {
  href: string;
  children: React.ReactNode;
  /** A 16 px Lucide icon after the label (buttons always carry one: docs/DESIGN-SYSTEM.md, Иконография). */
  icon?: React.ReactNode;
  download?: boolean;
  /** A plain link: the target is a static page, not a route of this app (client navigation would not find it). */
  native?: boolean;
  /** Analytics data attributes, from trackAttrs(). */
  track?: Record<string, string>;
};

function LinkButton({ href, children: label, icon, download, native, track, className }: LinkButtonProps & { className: string }) {
  const children = <>{label}{icon}</>;
  if (href.startsWith("/") && !download && !native)
    return (
      <Link href={href} className={className} {...track}>
        {children}
      </Link>
    );
  const external = href.startsWith("http");
  return (
    <a
      href={href}
      className={className}
      download={download || undefined}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...track}
    >
      {children}
    </a>
  );
}

export function PrimaryLink(props: LinkButtonProps) {
  return <LinkButton {...props} className={button({ variant: "primary" })} />;
}

export function SecondaryLink(props: LinkButtonProps) {
  return <LinkButton {...props} className={button({ variant: "secondary" })} />;
}

/**
 * Cover in a sticky-note colour: the case's real screen when it has one; otherwise a type cover made of the case
 * itself (kind and year, title, tags, a large initial) instead of a «picture coming soon» placeholder.
 * `kindLabel`: «Концепт» / «Реальний проєкт»; `bare` leaves the title out where the card already sets it large.
 */
export function CaseCover({
  item,
  kindLabel,
  large,
  bare,
}: {
  item: Case;
  kindLabel?: string | null;
  large?: boolean;
  bare?: boolean;
}) {
  if (item.cover) {
    return (
      <div
        className={cn("relative overflow-hidden rounded-[4px]", large ? "aspect-[16/8]" : "aspect-[4/3]")}
        style={{ background: item.sticker }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- static screenshot, sizes known */}
        <img
          {...responsive(item.cover.src, item.cover.width, large ? SIZES.cover : SIZES.card)}
          alt={large ? item.cover.alt : ""}
          width={item.cover.width}
          height={item.cover.height}
          loading={large ? "eager" : "lazy"}
          decoding="async"
          className="absolute left-[8%] top-[12%] w-[92%] rounded-[4px] border-2 border-black/15 shadow-[0_24px_60px_-20px_rgba(0,0,0,.35)]"
        />
      </div>
    );
  }
  const meta = [kindLabel, item.year].filter(Boolean).join(" · ");
  return (
    <div
      className={cn("sg-type-cover text-on-sticky", large ? "aspect-[16/8]" : "aspect-[4/3]")}
      style={{ backgroundColor: item.sticker }}
      data-initial={item.title.trim().charAt(0)}
      role="img"
      aria-label={item.title}
    >
      {meta && <span className="sg-type-cover-meta">{meta}</span>}
      {!bare && <span className="sg-type-cover-title">{item.title}</span>}
      {item.tags.length > 0 && (
        <span className="sg-type-cover-tags">
          {item.tags.slice(0, 4).map((t) => <span key={t}>{t}</span>)}
        </span>
      )}
    </div>
  );
}

/**
 * «Глибина процесу»: records of each stage in the workbook, every number named, with the stage's colour from the
 * tool. Cards show five stages; the case page shows all nine with a note that it is not a score.
 */
export function ProcessStrip({ process, locale, full }: { process: CaseProcess; locale: Locale; full?: boolean }) {
  const p = dict(locale).process;
  const stages = PROCESS_STAGES.filter((s) => full || s.card);
  return (
    <div className="flex flex-col gap-3">
      <p className="sg-eyebrow text-fg-secondary">{p.title}</p>
      <dl className={cn("grid gap-x-3 gap-y-4", full ? "grid-cols-3 sm:grid-cols-5 lg:grid-cols-9" : "grid-cols-5")}>
        {stages.map((s) => (
          // A stage with no records keeps readable text; only its rule stays grey.
          <div key={s.key} className={cn("flex min-w-0 flex-col-reverse justify-end gap-1 border-t pt-2.5", process[s.key] === 0 ? "border-line" : "border-accent-text")}>
            <dt className="truncate font-label text-[0.6875rem] uppercase tracking-[0.04em] text-fg-secondary" title={p.stages[s.key]}>{p.stages[s.key]}</dt>
            <dd className={cn("font-medium leading-none tracking-[-0.04em] tabular-nums", full ? "text-[clamp(1.5rem,2.4vw,2.125rem)]" : "text-[1.25rem]")}>{process[s.key]}</dd>
          </div>
        ))}
      </dl>
      {full && <p className="text-[0.75rem] text-fg-secondary">{p.note}</p>}
    </div>
  );
}
