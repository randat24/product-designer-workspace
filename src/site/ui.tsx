import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { PROCESS_STAGES, type CaseProcess } from "./case-process";
import { dict, type Case, type Locale } from "./content";
import { button } from "./signal/ui";

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
  /** Analytics data attributes, from trackAttrs(). */
  track?: Record<string, string>;
};

function LinkButton({ href, children: label, icon, download, track, className }: LinkButtonProps & { className: string }) {
  const children = <>{label}{icon}</>;
  if (href.startsWith("/") && !download)
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

/** Cover in a sticky-note colour: the case's real screen when it has one, otherwise an abstract placeholder. */
export function CaseCover({
  item,
  label,
  large,
}: {
  item: Case;
  label: string;
  large?: boolean;
}) {
  if (item.cover) {
    return (
      <div
        className={cn("relative overflow-hidden rounded-[4px]", large ? "aspect-[16/8]" : "aspect-[4/3]")}
        style={{ background: item.sticker }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- static screenshot, sizes known */}
        <img
          src={item.cover.src}
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
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[4px] text-on-sticky",
        large ? "aspect-[16/8]" : "aspect-[4/3]",
      )}
      style={{ background: item.sticker }}
      role="img"
      aria-label={`${item.title} — ${label}`}
    >
      {/* phone-ish frame */}
      <div className="absolute bottom-[-18%] left-[8%] h-[88%] w-[34%] rotate-[-4deg] rounded-[12px] border-2 border-current/25 bg-white/35 p-[3%]">
        <div className="h-[8%] w-1/2 rounded-full bg-current/20" />
        <div className="mt-[10%] h-[28%] rounded-[4px] bg-current/15" />
        <div className="mt-[8%] h-[5%] w-4/5 rounded-full bg-current/20" />
        <div className="mt-[5%] h-[5%] w-3/5 rounded-full bg-current/15" />
        <div className="mt-[10%] h-[10%] rounded-[4px] bg-current/30" />
      </div>
      {/* desktop-ish frame */}
      <div className="absolute right-[-6%] top-[14%] h-[70%] w-[58%] rotate-[3deg] rounded-[8px] border-2 border-current/25 bg-white/35 p-[2.5%]">
        <div className="flex gap-[3%]">
          <div className="h-[10px] w-[10px] rounded-full bg-current/25" />
          <div className="h-[10px] w-[10px] rounded-full bg-current/25" />
          <div className="h-[10px] w-[10px] rounded-full bg-current/25" />
        </div>
        <div className="mt-[6%] grid grid-cols-3 gap-[4%]">
          <div className="aspect-square rounded-[4px] bg-current/15" />
          <div className="aspect-square rounded-[4px] bg-current/20" />
          <div className="aspect-square rounded-[4px] bg-current/15" />
        </div>
        <div className="mt-[6%] h-[8%] w-2/3 rounded-full bg-current/20" />
      </div>
      <span className="absolute left-3 top-3 rounded-[4px] bg-white/60 px-2.5 py-1 text-[12px] font-semibold">
        {label}
      </span>
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
            <dt className="truncate font-label text-[10px] uppercase tracking-[0.04em] text-fg-secondary" title={p.stages[s.key]}>{p.stages[s.key]}</dt>
            <dd className={cn("font-medium leading-none tracking-[-0.04em] tabular-nums", full ? "text-[clamp(24px,2.4vw,34px)]" : "text-[20px]")}>{process[s.key]}</dd>
          </div>
        ))}
      </dl>
      {full && <p className="text-[12px] text-fg-secondary">{p.note}</p>}
    </div>
  );
}
