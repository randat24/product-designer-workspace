import {
  ArrowDown, ArrowRight, BadgeCheck, CreditCard, FileLock2, Fingerprint, LockKeyhole, ShieldAlert, ShieldCheck, UserCheck,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { GalleryItem } from "./content";
import { CaseContentsSpy } from "./case-contents-spy";
import type { BrandShape, ProductSection, ProductStory, TrustIcon } from "./product-story";
import { container } from "./ui";

const num = (i: number) => String(i + 1).padStart(2, "0");

/**
 * An editorial product case: sticky contents, then sections that each pick their own layout
 * (diagrams for roles, architecture, flows and money; a navy band for the brand). The case's own
 * accent (`.nw` in globals.css) comes from the product's logo blue.
 */
export function ProductStoryView({ story }: { story: ProductStory }) {
  const sections = story.sections.filter((s) => s.kind !== "screens" || s.items.length > 0);
  return (
    <div className="nw">
      <nav id="case-contents" aria-label={story.contents} className="z-10 border-y border-line bg-canvas/90 backdrop-blur lg:sticky lg:top-16">
        <ol className={`${container} flex gap-1 overflow-x-auto py-2.5 text-[13px] font-semibold`}>
          {sections.map((s, i) => (
            <li key={s.id} className="shrink-0">
              <a href={`#${s.id}`} className="hit flex items-center gap-1.5 rounded-full px-3 py-1.5 text-fg-secondary hover:bg-subtle hover:text-fg aria-[current]:bg-[var(--nw-tint)] aria-[current]:text-[var(--nw-ink)]">
                <span className="display-num text-[11px]">{num(i)}</span>
                {s.title}
              </a>
            </li>
          ))}
        </ol>
        <CaseContentsSpy ids={sections.map((s) => s.id)} navId="case-contents" />
      </nav>

      <div className="flex flex-col">
        {sections.map((s, i) => <Section key={s.id} section={s} index={i} />)}
      </div>
    </div>
  );
}

/** Sections on a navy band: the ecosystem and the brand open a new chapter of the story. */
const BAND = new Set<ProductSection["kind"]>(["ecosystem", "brand"]);

function Section({ section: s, index }: { section: ProductSection; index: number }) {
  const band = BAND.has(s.kind);
  return (
    <section id={s.id} aria-labelledby={`${s.id}-h`}
      className={cn("scroll-mt-32 py-16 sm:py-20", band ? "nw-band" : index % 2 === 1 && "bg-[var(--nw-wash)]")}>
      <div className={`${container} flex flex-col gap-10`}>
        <header className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] lg:items-end lg:gap-12">
          <div className="flex flex-col gap-3">
            <span className={cn("display-num text-[14px]", band ? "text-white/70" : "text-[var(--nw-ink)]")}>{num(index)}</span>
            <h2 id={`${s.id}-h`} className="font-display text-[clamp(30px,4.4vw,52px)] font-bold uppercase leading-[1.05]">{s.title}</h2>
          </div>
          {s.lede && <p className={cn("max-w-[62ch] text-[18px] leading-[1.6]", band ? "text-white/85" : "text-fg-secondary")}>{s.lede}</p>}
        </header>
        <Body section={s} />
      </div>
    </section>
  );
}

function Body({ section: s }: { section: ProductSection }) {
  switch (s.kind) {
    case "overview": return <Overview body={s.body} facts={s.facts} />;
    case "role": return <Chips items={s.areas} large />;
    case "challenge": return <Challenge body={s.body} behaviors={s.behaviors} />;
    case "ecosystem": return <Ecosystem center={s.center} nodes={s.nodes} />;
    case "roles": return <Roles items={s.items} />;
    case "ia": return <Ia groups={s.groups} />;
    case "flows": return <Flows items={s.items} />;
    case "monetization": return <Monetization chain={s.chain} actions={s.actions} models={s.models} />;
    case "principles": return <Principles items={s.items} />;
    case "screens": return <Figures images={s.items} />;
    case "checklist": return <Checklist body={s.body} items={s.items} />;
    case "system": return <System body={s.body} groups={s.groups} />;
    case "brand": return <Brand body={s.body} parts={s.parts} formula={s.formula} image={s.image} />;
    case "timeline": return <Timeline steps={s.steps} />;
    case "figure": return <><Paragraphs body={s.body} /><Figures images={s.images} /></>;
    case "trust": return <Trust items={s.items} />;
    case "outcome": return <Outcome body={s.body} />;
  }
}

function Paragraphs({ body, className }: { body: string[]; className?: string }) {
  if (!body.length) return null;
  return (
    <div className={cn("flex max-w-[68ch] flex-col gap-4 text-[18px] leading-[1.65]", className)}>
      {body.map((p) => <p key={p}>{p}</p>)}
    </div>
  );
}

function Chips({ items, large }: { items: string[]; large?: boolean }) {
  return (
    <ul className="flex flex-wrap gap-2.5">
      {items.map((it) => (
        <li key={it} className={cn("rounded-full border border-[var(--nw-line)] bg-surface font-semibold text-fg",
          large ? "px-5 py-2.5 text-[16px] sm:text-[18px]" : "px-3.5 py-1.5 text-[14px]")}>{it}</li>
      ))}
    </ul>
  );
}

function Overview({ body, facts }: { body: string[]; facts: { label: string; value: string }[] }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:gap-16">
      <Paragraphs body={body} className="text-[clamp(18px,1.6vw,21px)]" />
      <dl className="flex flex-col divide-y divide-line self-start rounded-[18px] border border-line bg-surface">
        {facts.map((f) => (
          <div key={f.label} className="flex flex-col gap-1 px-6 py-4">
            <dt className="text-[13px] font-semibold uppercase tracking-wide text-fg-secondary">{f.label}</dt>
            <dd className="font-semibold leading-snug">{f.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Challenge({ body, behaviors }: { body: string[]; behaviors: { who: string; goal: string }[] }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
      <Paragraphs body={body} />
      <ul className="flex flex-col gap-3">
        {behaviors.map((b, i) => (
          <li key={b.who} className="nw-rise grid grid-cols-[auto_1fr] items-baseline gap-x-5 rounded-[18px] border border-line bg-surface p-6">
            <span className="display-num text-[28px] leading-none text-[var(--nw-ink)]">{num(i)}</span>
            <div className="flex flex-col gap-1">
              <p className="font-display text-[20px] font-bold uppercase leading-[1.1]">{b.who}</p>
              <p className="text-fg-secondary">{b.goal}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The product's areas around its centre: a ring on wide screens, a list under the centre on a phone. */
function Ecosystem({ center, nodes }: { center: string; nodes: string[] }) {
  const w = 1000, h = 560, cx = w / 2, cy = h / 2, rx = 400, ry = 215;
  const points = nodes.map((label, i) => {
    const a = (i / nodes.length) * Math.PI * 2 - Math.PI / 2;
    return { label, x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a) };
  });
  return (
    <>
      <figure className="nw-rise hidden md:block">
        <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${center}: ${nodes.join(", ")}`} className="h-auto w-full">
          <ellipse cx={cx} cy={cy} rx={rx} ry={ry} fill="none" stroke="currentColor" strokeOpacity="0.18" strokeDasharray="4 8" />
          {points.map((p) => (
            <line key={`l-${p.label}`} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="var(--nw-glow)" strokeOpacity="0.35" className="nw-draw" pathLength={1} />
          ))}
          <circle cx={cx} cy={cy} r="92" fill="var(--nw-blue)" />
          <circle cx={cx} cy={cy} r="112" fill="none" stroke="var(--nw-glow)" strokeOpacity="0.35" />
          <text x={cx} y={cy} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="22" fontWeight="700" className="font-display uppercase">{center}</text>
          {points.map((p) => {
            const width = p.label.length * 9.2 + 36;
            return (
              <g key={p.label}>
                <rect x={p.x - width / 2} y={p.y - 19} width={width} height="38" rx="19" fill="#0E1C40" stroke="var(--nw-glow)" strokeOpacity="0.55" />
                <text x={p.x} y={p.y + 1} textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="16" fontWeight="600">{p.label}</text>
              </g>
            );
          })}
        </svg>
      </figure>
      <div className="flex flex-col items-center gap-6 md:hidden">
        <p className="grid size-36 place-items-center rounded-full bg-[var(--nw-blue)] px-4 text-center font-display text-[18px] font-bold uppercase leading-tight text-white">{center}</p>
        <ul className="flex flex-wrap justify-center gap-2">
          {nodes.map((n) => <li key={n} className="rounded-full border border-white/30 px-3.5 py-1.5 text-[14px] font-semibold text-white">{n}</li>)}
        </ul>
      </div>
    </>
  );
}

function Roles({ items }: { items: { name: string; summary: string; can: string[] }[] }) {
  return (
    <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((r, i) => (
        <li key={r.name} className="nw-rise relative flex flex-col gap-4 rounded-[20px] border border-line bg-surface p-6 transition-[border-color,box-shadow] duration-200 hover:border-[var(--nw-blue)] hover:shadow-[0_12px_32px_-18px_var(--nw-blue)]">
          <div className="flex items-center justify-between">
            <span className="display-num text-[14px] text-[var(--nw-ink)]">{num(i)}</span>
            {i < items.length - 1 && <ArrowRight aria-hidden className="hidden size-5 text-[var(--nw-ink)] xl:block" />}
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-display text-[24px] font-bold uppercase leading-[1.05]">{r.name}</h3>
            <p className="text-fg-secondary">{r.summary}</p>
          </div>
          <ul className="mt-auto flex flex-col gap-1.5 border-t border-line pt-4 text-[15px]">
            {r.can.map((c) => (
              <li key={c} className="flex gap-2"><span aria-hidden className="mt-[9px] size-1.5 shrink-0 rounded-full bg-[var(--nw-blue)]" />{c}</li>
            ))}
          </ul>
        </li>
      ))}
    </ol>
  );
}

function Ia({ groups }: { groups: { title: string; items: string[] }[] }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((g, i) => (
        <section key={g.title} aria-label={g.title} className="nw-rise overflow-hidden rounded-[18px] border border-line bg-surface">
          <header className="flex items-baseline justify-between gap-3 bg-[var(--nw-blue)] px-5 py-3.5 text-white">
            <h3 className="font-display text-[18px] font-bold uppercase tracking-wide">{g.title}</h3>
            <span className="display-num text-[12px] opacity-80">{num(i)}</span>
          </header>
          <ul className="flex flex-col divide-y divide-line px-5 text-[15px]">
            {g.items.map((it) => <li key={it} className="py-2.5">{it}</li>)}
          </ul>
        </section>
      ))}
    </div>
  );
}

function Flows({ items }: { items: { title: string; steps: string[] }[] }) {
  return (
    <ol className="flex flex-col gap-5">
      {items.map((f, i) => (
        <li key={f.title} className="nw-rise grid gap-4 rounded-[20px] border border-line bg-surface p-5 sm:p-6 lg:grid-cols-[220px_1fr] lg:items-center">
          <div className="flex items-baseline gap-3 lg:flex-col lg:gap-1">
            <span className="display-num text-[13px] text-[var(--nw-ink)]">FLOW {num(i)}</span>
            <h3 className="font-display text-[20px] font-bold uppercase leading-[1.1]">{f.title}</h3>
          </div>
          <ol className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
            {f.steps.map((step, j) => (
              <li key={step} className="flex flex-col items-start gap-2 sm:contents">
                <span className={cn("rounded-[12px] border px-3.5 py-2 text-[15px] font-semibold",
                  j === 0 ? "border-[var(--nw-blue)] bg-[var(--nw-tint)] text-[var(--nw-ink)]"
                    : j === f.steps.length - 1 ? "border-transparent bg-[var(--nw-blue)] text-white" : "border-line bg-canvas")}>
                  {step}
                </span>
                {j < f.steps.length - 1 && (
                  <>
                    <ArrowDown aria-hidden className="size-4 shrink-0 text-fg-secondary sm:hidden" />
                    <ArrowRight aria-hidden className="hidden size-4 shrink-0 text-fg-secondary sm:block" />
                  </>
                )}
              </li>
            ))}
          </ol>
        </li>
      ))}
    </ol>
  );
}

function Monetization({ chain, actions, models }: { chain: string[]; actions: string[]; models: { title: string; body: string }[] }) {
  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
      <figure className="nw-rise flex flex-col items-center gap-3 rounded-[24px] bg-[var(--nw-tint)] p-6 sm:p-8">
        {chain.map((c, i) => (
          <div key={c} className="flex w-full flex-col items-center gap-3">
            <p className={cn("w-full max-w-[320px] rounded-[14px] px-5 py-3.5 text-center font-display text-[20px] font-bold uppercase",
              i === chain.length - 1 ? "bg-[var(--nw-blue)] text-white" : "border border-[var(--nw-line)] bg-surface")}>{c}</p>
            <ArrowDown aria-hidden className="size-5 text-[var(--nw-ink)]" />
          </div>
        ))}
        <ul className="grid w-full grid-cols-2 gap-2.5">
          {actions.map((a) => (
            <li key={a} className="rounded-[12px] border border-[var(--nw-line)] bg-surface px-3 py-3 text-center font-semibold">{a}</li>
          ))}
        </ul>
      </figure>
      <ul className="grid gap-3 sm:grid-cols-2">
        {models.map((m) => (
          <li key={m.title} className="nw-rise flex flex-col gap-1.5 rounded-[16px] border border-line bg-surface p-5">
            <p className="font-semibold">{m.title}</p>
            <p className="text-[15px] leading-[1.55] text-fg-secondary">{m.body}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Principles({ items }: { items: { title: string; body: string }[] }) {
  return (
    <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((p, i) => (
        <li key={p.title} className="nw-rise flex min-h-[220px] flex-col justify-between gap-6 rounded-[20px] border border-line bg-surface p-6">
          <span className="display-num text-[44px] leading-none text-[var(--nw-ink)]">{num(i)}</span>
          <div className="flex flex-col gap-2">
            <h3 className="font-display text-[24px] font-bold uppercase leading-[1.05]">{p.title}</h3>
            <p className="text-fg-secondary">{p.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function Checklist({ body, items }: { body: string[]; items: string[] }) {
  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
      <Paragraphs body={body} />
      <ul className="grid gap-2 self-start sm:grid-cols-2">
        {items.map((it) => (
          <li key={it} className="flex items-center gap-3 rounded-[12px] border border-line bg-surface px-4 py-3 font-semibold">
            <BadgeCheck aria-hidden className="size-5 shrink-0 text-[var(--nw-ink)]" strokeWidth={1.75} />{it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function System({ body, groups }: { body: string[]; groups: { title: string; items: string[] }[] }) {
  return (
    <div className="flex flex-col gap-8">
      <Paragraphs body={body} className="text-[clamp(18px,1.6vw,21px)]" />
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {groups.map((g) => (
          <li key={g.title} className="nw-rise flex flex-col gap-3 rounded-[18px] border border-line bg-surface p-5">
            <p className="font-display text-[18px] font-bold uppercase leading-[1.1] text-[var(--nw-ink)]">{g.title}</p>
            <ul className="flex flex-col gap-1.5 text-[15px] text-fg-secondary">
              {g.items.map((it) => <li key={it}>{it}</li>)}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Geometric glyph of one part of the mark (a diagram of the idea, not the logo itself). */
function Glyph({ shape }: { shape: BrandShape }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className="size-14">
      {shape === "circle" && <circle cx="32" cy="30" r="20" fill="none" stroke="currentColor" strokeWidth="9" />}
      {shape === "base" && <path d="M12 50a20 14 0 0 1 40 0" fill="none" stroke="currentColor" strokeWidth="9" strokeLinecap="round" />}
      {shape === "dot" && <circle cx="32" cy="32" r="8" fill="currentColor" />}
    </svg>
  );
}

function Brand({ body, parts, formula, image }: { body: string[]; parts: { shape: BrandShape; title: string; meaning: string }[]; formula: string; image: GalleryItem }) {
  return (
    <div className="flex flex-col gap-10">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-16">
        <Paragraphs body={body} className="text-white/90" />
        <ul className="flex flex-col gap-3">
          {parts.map((p) => (
            <li key={p.shape} className="nw-rise grid grid-cols-[auto_1fr] items-center gap-5 rounded-[18px] border border-white/15 bg-white/[0.04] p-5">
              <span className="text-[var(--nw-glow)]"><Glyph shape={p.shape} /></span>
              <div className="flex flex-col gap-1">
                <p className="font-display text-[20px] font-bold uppercase">{p.title}</p>
                <p className="text-white/80">{p.meaning}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <p className="text-center font-display text-[clamp(24px,3.6vw,44px)] font-bold uppercase leading-[1.1] text-white">{formula}</p>
      <Figures images={[image]} dark />
    </div>
  );
}

function Timeline({ steps }: { steps: { title: string; body: string }[] }) {
  return (
    <ol className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-4">
      {steps.map((s, i) => (
        <li key={s.title} className="nw-rise flex flex-col gap-3 border-t-2 border-[var(--nw-blue)] pt-4">
          <span className="display-num text-[14px] text-[var(--nw-ink)]">{num(i)}</span>
          <h3 className="font-display text-[20px] font-bold uppercase leading-[1.1]">{s.title}</h3>
          <p className="text-[15px] leading-[1.6] text-fg-secondary">{s.body}</p>
        </li>
      ))}
    </ol>
  );
}

function Figures({ images, dark }: { images: GalleryItem[]; dark?: boolean }) {
  return (
    <div className={cn("grid gap-6", images.length > 1 && "lg:grid-cols-2")}>
      {images.map((im, i) => (
        <figure key={im.src} className={cn("flex flex-col gap-2", images.length > 2 && i === 0 && "lg:col-span-2")}>
          {/* eslint-disable-next-line @next/next/no-img-element -- static case images with known size */}
          <img src={im.src} alt={im.alt} width={im.width} height={im.height} loading="lazy" decoding="async"
            className={cn("h-auto w-full rounded-[18px] border", dark ? "border-white/15" : "border-line")} />
          {im.caption && <figcaption className={cn("text-[14px]", dark ? "text-white/70" : "text-fg-secondary")}>{im.caption}</figcaption>}
        </figure>
      ))}
    </div>
  );
}

const TRUST_ICONS: Record<TrustIcon, LucideIcon> = {
  age: ShieldAlert, identity: Fingerprint, security: LockKeyhole, privacy: FileLock2,
  gdpr: ShieldCheck, scam: ShieldAlert, payment: CreditCard, access: UserCheck,
};

function Trust({ items }: { items: { icon: TrustIcon; title: string; body: string }[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {items.map((t) => {
        const Icon = TRUST_ICONS[t.icon];
        return (
          <li key={t.title} className="nw-rise flex flex-col gap-3 rounded-[18px] border border-line bg-surface p-5">
            <span className="grid size-11 place-items-center rounded-[12px] bg-[var(--nw-tint)] text-[var(--nw-ink)]">
              <Icon aria-hidden className="size-5" strokeWidth={1.75} />
            </span>
            <p className="font-semibold">{t.title}</p>
            <p className="text-[15px] leading-[1.55] text-fg-secondary">{t.body}</p>
          </li>
        );
      })}
    </ul>
  );
}

function Outcome({ body }: { body: string[] }) {
  return (
    <div className="flex flex-col gap-6 border-l-4 border-[var(--nw-blue)] pl-6 sm:pl-10">
      {body.map((p, i) => (
        <p key={p} className={cn(i === 0 ? "font-display text-[clamp(22px,2.6vw,34px)] font-bold uppercase leading-[1.2]" : "max-w-[68ch] text-[18px] leading-[1.65] text-fg-secondary")}>{p}</p>
      ))}
    </div>
  );
}
