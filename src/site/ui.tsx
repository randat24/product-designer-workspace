import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { trackAttrs } from "./analytics/track";
import { dict, type Case, type Locale } from "./content";

export const container = "mx-auto w-full max-w-[1120px] px-4 sm:px-8";

export function Eyebrow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        "font-display text-[13px] font-semibold uppercase tracking-[0.12em] text-fg-secondary",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function SectionTitle({
  children,
  id,
}: {
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <h2
      id={id}
      className="font-display text-[clamp(28px,4vw,40px)] font-bold uppercase leading-[1.1] tracking-[0.01em]"
    >
      {children}
    </h2>
  );
}

const linkBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] px-5 text-[15px] font-semibold transition-colors duration-[120ms]";

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
  return <LinkButton {...props} className={cn(linkBtn, "border-[1.5px] border-accent bg-accent text-on-accent hover:bg-accent-hover")} />;
}

export function SecondaryLink(props: LinkButtonProps) {
  return <LinkButton {...props} className={cn(linkBtn, "border-[1.5px] border-fg text-fg hover:bg-subtle")} />;
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
        className={cn("relative overflow-hidden rounded-[14px]", large ? "aspect-[16/8]" : "aspect-[4/3]")}
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
          className="absolute left-[8%] top-[12%] w-[92%] rounded-[10px] border-2 border-black/15 shadow-[0_24px_60px_-20px_rgba(0,0,0,.35)]"
        />
      </div>
    );
  }
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[14px] text-on-sticky",
        large ? "aspect-[16/8]" : "aspect-[4/3]",
      )}
      style={{ background: item.sticker }}
      role="img"
      aria-label={`${item.title} — ${label}`}
    >
      {/* phone-ish frame */}
      <div className="absolute bottom-[-18%] left-[8%] h-[88%] w-[34%] rotate-[-4deg] rounded-[18px] border-2 border-current/25 bg-white/35 p-[3%]">
        <div className="h-[8%] w-1/2 rounded-full bg-current/20" />
        <div className="mt-[10%] h-[28%] rounded-[10px] bg-current/15" />
        <div className="mt-[8%] h-[5%] w-4/5 rounded-full bg-current/20" />
        <div className="mt-[5%] h-[5%] w-3/5 rounded-full bg-current/15" />
        <div className="mt-[10%] h-[10%] rounded-[8px] bg-current/30" />
      </div>
      {/* desktop-ish frame */}
      <div className="absolute right-[-6%] top-[14%] h-[70%] w-[58%] rotate-[3deg] rounded-[12px] border-2 border-current/25 bg-white/35 p-[2.5%]">
        <div className="flex gap-[3%]">
          <div className="h-[10px] w-[10px] rounded-full bg-current/25" />
          <div className="h-[10px] w-[10px] rounded-full bg-current/25" />
          <div className="h-[10px] w-[10px] rounded-full bg-current/25" />
        </div>
        <div className="mt-[6%] grid grid-cols-3 gap-[4%]">
          <div className="aspect-square rounded-[8px] bg-current/15" />
          <div className="aspect-square rounded-[8px] bg-current/20" />
          <div className="aspect-square rounded-[8px] bg-current/15" />
        </div>
        <div className="mt-[6%] h-[8%] w-2/3 rounded-full bg-current/20" />
      </div>
      <span className="absolute left-3 top-3 rounded-full bg-white/60 px-2.5 py-1 text-[12px] font-semibold">
        {label}
      </span>
    </div>
  );
}

/** Two-digit position of a case in the list: 01, 02… */
const caseIndex = (n: number) => String(n).padStart(2, "0");

/** The cover of a card: blurred for 18+ unless it is safe; on hover a scrim lifts the tags and «Open case». */
function CardCover({ item, locale, label }: { item: Case; locale: Locale; label: string }) {
  const d = dict(locale);
  const blurred = item.adult && !item.coverSafe;
  return (
    <div className="relative overflow-hidden rounded-[14px]">
      <div className={cn("transition-transform duration-500 ease-out group-hover:scale-[1.03] motion-reduce:transition-none", blurred && "blur-xl")}>
        <CaseCover item={item} label={label} />
      </div>
      {blurred && (
        <span aria-hidden className="absolute inset-0 grid place-items-center">
          <span className="grid size-14 place-items-center rounded-full bg-fg font-display text-[22px] font-bold text-canvas">{d.adult.badge}</span>
        </span>
      )}
      {/* Pointer devices only: the same tags are listed under the card on touch screens. */}
      <div aria-hidden className="absolute inset-0 hidden flex-col justify-end gap-3 bg-[#151a33]/80 p-5 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100 pointer-fine:flex motion-reduce:transition-none">
        <ul className="flex flex-wrap gap-1.5">
          {item.tags.map((tag) => <li key={tag} className="rounded-full border border-white/70 px-2.5 py-0.5 text-[12px]">{tag}</li>)}
        </ul>
        <span className="flex items-center justify-between font-display text-[22px] font-bold uppercase leading-[1.08]">
          {d.cases.open}<span>→</span>
        </span>
      </div>
    </div>
  );
}

function CardBadges({ item, locale }: { item: Case; locale: Locale }) {
  const d = dict(locale);
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      {item.kind && <KindBadge kind={item.kind} label={item.kind === "concept" ? d.project.concept : d.project.real} />}
      {item.adult && <AdultBadge label={d.adult.badge} />}
    </span>
  );
}

function CardTags({ tags, className }: { tags: string[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map((tag) => (
        <li key={tag} className="rounded-full border border-line px-2.5 py-0.5 text-[12px] text-fg-secondary">{tag}</li>
      ))}
    </ul>
  );
}

/** A case in the grid: cover, then its number, badges, title, client · year and the summary. */
export function CaseCard({
  item,
  locale,
  label,
  index,
  location = "cases",
}: {
  item: Case;
  locale: Locale;
  label: string;
  /** 1-based position in the list, shown as 02, 03… */
  index: number;
  location?: "home" | "cases";
}) {
  // Home: under the "Selected work" h2. Work page: directly under the page h1.
  const Title = location === "home" ? "h3" : "h2";
  return (
    <Link
      href={`/${locale}/cases/${item.slug}`}
      data-kind={item.kind ?? "real"}
      className="group flex flex-col gap-4"
      {...trackAttrs("case_open", { case_slug: item.slug, location })}
    >
      <CardCover item={item} locale={locale} label={label} />
      <div className="flex flex-col gap-2">
        <p className="flex items-center justify-between gap-2">
          <span className="font-label text-[12px] text-fg-secondary">{caseIndex(index)}</span>
          <CardBadges item={item} locale={locale} />
        </p>
        <Title className="font-display text-[26px] font-bold uppercase leading-[1.08]">{item.title}</Title>
        <p className="text-[14px] text-fg-secondary">{item.client} · {item.year}</p>
        <p className="text-fg-secondary">{item.summary}</p>
        <CardTags tags={item.tags} className="mt-1 pointer-fine:hidden" />
      </div>
    </Link>
  );
}

/** The first case, shown large: cover beside its title, summary and facts. */
export function FeaturedCase({
  item,
  locale,
  label,
  total,
  location = "cases",
}: {
  item: Case;
  locale: Locale;
  label: string;
  total: number;
  location?: "home" | "cases";
}) {
  const d = dict(locale);
  const Title = location === "home" ? "h3" : "h2";
  const facts = [
    { label: d.cases.client, value: item.client },
    { label: d.cases.year, value: item.year },
    { label: d.cases.type, value: item.kind === "concept" ? d.project.concept : d.project.real },
    { label: d.cases.role, value: item.role },
  ].filter((f) => f.value);
  return (
    <Link
      href={`/${locale}/cases/${item.slug}`}
      data-kind={item.kind ?? "real"}
      className="group grid gap-6 rounded-[20px] border border-line bg-surface p-4 sm:p-6 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-8"
      {...trackAttrs("case_open", { case_slug: item.slug, location })}
    >
      <CardCover item={item} locale={locale} label={label} />
      <div className="flex min-w-0 flex-col gap-4">
        <p className="flex items-center justify-between gap-2 font-label text-[12px] uppercase tracking-[0.04em]">
          <span className="flex items-center gap-2"><span aria-hidden className="size-2 rounded-full bg-fg" />{d.cases.featured}</span>
          <span className="text-fg-secondary">{caseIndex(1)} / {caseIndex(total)}</span>
        </p>
        <CardBadges item={item} locale={locale} />
        <Title className="font-display text-[clamp(30px,3.6vw,44px)] font-bold uppercase leading-[1.08] text-balance">{item.title}</Title>
        <p className="text-fg-secondary">{item.summary}</p>
        <dl className="grid grid-cols-2 border-t border-line">
          {facts.map((f) => (
            <div key={f.label} className="flex flex-col-reverse justify-end gap-0.5 border-b border-line py-2.5 pr-3">
              <dd className="text-[14px] font-semibold">{f.value}</dd>
              <dt className="font-label text-[11px] uppercase tracking-[0.04em] text-fg-secondary">{f.label}</dt>
            </div>
          ))}
        </dl>
        <CardTags tags={item.tags} />
        <span className="mt-auto flex items-center gap-2 font-semibold">
          {d.cases.open}<span aria-hidden className="transition-transform duration-200 group-hover:translate-x-1 motion-reduce:transition-none">→</span>
        </span>
      </div>
    </Link>
  );
}

/** 18+ marker on case cards and pages. */
export function AdultBadge({ label }: { label: string }) {
  return (
    <span className="rounded-full border-[1.5px] border-danger px-2 py-0.5 text-[11px] font-bold tracking-[0.06em] text-danger">
      {label}
    </span>
  );
}

/** "Real project" / "Concept" marker on case cards and pages. */
export function KindBadge({ kind, label }: { kind: "real" | "concept"; label: string }) {
  return (
    <span
      className={cn(
        "rounded-full px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.06em]",
        kind === "concept" ? "border border-dashed border-fg-secondary text-fg-secondary" : "bg-fg text-canvas",
      )}
    >
      {label}
    </span>
  );
}

