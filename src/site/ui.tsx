import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import type { Case, Locale } from "./content";

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
      className="font-display text-[clamp(28px,4vw,40px)] font-bold uppercase leading-none tracking-[-0.005em]"
    >
      {children}
    </h2>
  );
}

const linkBtn =
  "inline-flex h-11 items-center justify-center gap-2 rounded-[10px] px-5 text-[15px] font-semibold transition-colors duration-[120ms]";

export function PrimaryLink({
  href,
  children,
  download,
}: {
  href: string;
  children: React.ReactNode;
  download?: boolean;
}) {
  const cls = cn(
    linkBtn,
    "border-[1.5px] border-accent bg-accent text-on-accent hover:bg-accent-hover",
  );
  if (href.startsWith("/") && !download)
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  return (
    <a href={href} className={cls} download={download || undefined}>
      {children}
    </a>
  );
}

export function SecondaryLink({
  href,
  children,
  download,
}: {
  href: string;
  children: React.ReactNode;
  download?: boolean;
}) {
  const cls = cn(linkBtn, "border-[1.5px] border-fg text-fg hover:bg-subtle");
  if (href.startsWith("/") && !download)
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  return (
    <a href={href} className={cls} download={download || undefined}>
      {children}
    </a>
  );
}

/** Placeholder cover in a sticky-note colour: an abstract screen until real images arrive. */
export function CaseCover({
  item,
  label,
  large,
}: {
  item: Case;
  label: string;
  large?: boolean;
}) {
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
}: {
  item: Case;
  locale: Locale;
  label: string;
}) {
  return (
    <Link
      href={`/${locale}/cases/${item.slug}`}
      className="group flex flex-col gap-4"
    >
      <div className="transition-transform duration-200 group-hover:-translate-y-1">
        <CaseCover item={item} label={label} />
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="text-[13px] text-fg-secondary">
          {item.client} · {item.year}
        </p>
        <h3 className="font-display text-[24px] font-bold uppercase leading-[1.05] group-hover:underline group-hover:decoration-2 group-hover:underline-offset-4">
          {item.title}
        </h3>
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

/** Award placeholder: a medal outline until the stylised photos arrive. */
export function AwardPlaceholder({
  year,
  title,
  note,
}: {
  year: string;
  title: string;
  note: string;
}) {
  return (
    <figure className="flex flex-col items-center gap-3 rounded-[14px] border-[1.5px] border-dashed border-line bg-surface px-4 py-6 text-center">
      <svg
        viewBox="0 0 64 88"
        className="h-24 w-auto text-fg-secondary"
        aria-hidden="true"
      >
        <path
          d="M18 2h12l6 30H24zM34 2h12l-6 30h-12z"
          fill="currentColor"
          opacity="0.25"
        />
        <path
          d="M18 2h12l6 30M46 2H34l-6 30"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        />
        <circle
          cx="32"
          cy="58"
          r="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
        />
        <circle
          cx="32"
          cy="58"
          r="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="3 3"
        />
        <path
          d="M32 47l3.2 6.6 7.3 1-5.3 5.1 1.3 7.2L32 63.5l-6.5 3.4 1.3-7.2-5.3-5.1 7.3-1z"
          fill="currentColor"
          opacity="0.5"
        />
      </svg>
      <figcaption className="flex flex-col gap-0.5">
        <span className="font-display text-[20px] font-bold uppercase">
          {title} · {year}
        </span>
        <span className="text-[12px] text-fg-secondary">{note}</span>
      </figcaption>
    </figure>
  );
}
