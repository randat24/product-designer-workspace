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

export function CaseCard({
  item,
  locale,
  label,
  location = "cases",
}: {
  item: Case;
  locale: Locale;
  label: string;
  location?: "home" | "cases";
}) {
  const p = dict(locale).project;
  // Home: under the "Selected work" h2. Work page: directly under the page h1.
  const Title = location === "home" ? "h3" : "h2";
  return (
    <Link
      href={`/${locale}/cases/${item.slug}`}
      className="group flex flex-col gap-4"
      {...trackAttrs("case_open", { case_slug: item.slug, location })}
    >
      <div className="relative overflow-hidden rounded-[14px] transition-transform duration-200 group-hover:-translate-y-1">
        {/* 18+: the cover is blurred on the card too (unless it is a safe one, like a logo); the case page asks for the visitor's age. */}
        <div className={cn(item.adult && !item.coverSafe && "blur-xl")}><CaseCover item={item} label={label} /></div>
        {item.adult && !item.coverSafe && (
          <span aria-hidden className="absolute inset-0 grid place-items-center">
            <span className="grid size-14 place-items-center rounded-full bg-fg font-display text-[22px] font-bold text-canvas">
              {dict(locale).adult.badge}
            </span>
          </span>
        )}
      </div>
      <div className="flex flex-col gap-2">
        <p className="flex flex-wrap items-center gap-2 text-[13px] text-fg-secondary">
          {item.kind && <KindBadge kind={item.kind} label={item.kind === "concept" ? p.concept : p.real} />}
          {item.adult && <AdultBadge label={dict(locale).adult.badge} />}
          {item.client} · {item.year}
        </p>
        <Title className="font-display text-[24px] font-bold uppercase leading-[1.1] group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
          {item.title}
        </Title>
        <p className="text-fg-secondary">{item.summary}</p>
        <ul className="mt-1 flex flex-wrap gap-1.5">
          {item.tags.map((tag) => (
            <li
              key={tag}
              className="rounded-full border border-line px-2.5 py-0.5 text-[12px] text-fg-secondary"
            >
              {tag}
            </li>
          ))}
        </ul>
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

