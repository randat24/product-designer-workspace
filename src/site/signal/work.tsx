import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { trackAttrs } from "@/site/analytics/track";
import { dict, type Case, type Locale } from "@/site/content";
import { CaseCover } from "@/site/ui";
import { WorkFilter } from "./work-filter";

const pad = (n: number) => String(n).padStart(2, "0");

/**
 * SIGNAL work grid (the package's «Вибрані роботи»): the first case full width with its title set large beside the
 * screen, the rest two to a row; a lone last case takes the full row too. Real / concept chips filter the cards
 * (CSS on data-kind, the cards stay in the HTML). Home and the work page share it.
 */
export function SignalWork({ cases, locale, heading, location }: {
  cases: Case[];
  locale: Locale;
  /** The block above the chips: eyebrow and h2 on home, the page h1 on /cases. */
  heading: React.ReactNode;
  location: "home" | "cases";
}) {
  const d = dict(locale);
  const real = cases.filter((c) => c.kind !== "concept").length;
  const wideLast = (cases.length - 1) % 2 === 1;
  return (
    <WorkFilter
      heading={heading}
      counts={{ all: cases.length, real, concept: cases.length - real }}
      labels={{ group: d.cases.filter, all: d.cases.filterAll, real: d.cases.filterReal, concept: d.cases.filterConcept }}
    >
      <div className="sg-project-grid">
        {cases.map((item, i) => (
          <ProjectCard key={item.slug} item={item} index={i + 1} locale={locale} location={location}
            variant={i === 0 ? "lead" : wideLast && i === cases.length - 1 ? "wide" : "half"} />
        ))}
      </div>
    </WorkFilter>
  );
}

function ProjectCard({ item, index, locale, location, variant }: {
  item: Case;
  index: number;
  locale: Locale;
  location: "home" | "cases";
  variant: "lead" | "wide" | "half";
}) {
  const d = dict(locale);
  const href = `/${locale}/cases/${item.slug}`;
  const Title = location === "home" ? "h3" : "h2";
  const kind = item.kind === "concept" ? d.project.concept : d.project.real;
  const track = trackAttrs("case_open", { case_slug: item.slug, location });
  const blurred = !!item.adult && !item.coverSafe;
  // The grid keeps to the SIGNAL ground: a case colour outside the sticker palette (a brand tint) falls back to stone.
  const tone = item.sticker.startsWith("var(--s") ? item.sticker : "var(--s7)";
  return (
    <article className={cn("sg-project", variant !== "half" && "sg-project--full")} data-kind={item.kind ?? "real"}>
      {/* The picture repeats the title link for the pointer; keyboard and screen readers get the one in the title. */}
      <Link href={href} tabIndex={-1} aria-hidden="true" {...track}
        className={cn("sg-project-visual", variant === "lead" && "sg-project-visual--lead")} style={{ background: tone }}>
        {variant === "lead" && (
          <span className="sg-cover-type">
            <small>{kind} / {item.client}</small>
            {item.title}
            <span className="sg-cover-arrow">↗</span>
          </span>
        )}
        <span className={cn("sg-shots", blurred && "blur-xl")}><Shots item={item} label={d.cases.placeholder} /></span>
        {blurred && <span className="sg-adult">{d.adult.badge}</span>}
      </Link>
      <div className="sg-project-meta">
        <div>
          <Title><Link href={href} {...track}>{item.title} <span aria-hidden>↗</span></Link></Title>
          <p>{item.summary}</p>
        </div>
        <span className="sg-project-number">
          {item.adult && <span className="mr-2 text-danger">{d.adult.badge}</span>}
          {pad(index)} / {item.year}
        </span>
      </div>
    </article>
  );
}

/** The case's own screen, two phone pages from its gallery, or the abstract cover when there is neither. */
function Shots({ item, label }: { item: Case; label: string }) {
  if (item.cover) {
    const c = item.cover;
    // eslint-disable-next-line @next/next/no-img-element -- static screenshot, sizes known
    return <img className="sg-shot" src={c.src} alt="" width={c.width} height={c.height} loading="lazy" decoding="async" />;
  }
  const phones = (item.gallery ?? []).filter((g) => g.device === "mobile" || g.height > g.width).slice(0, 2);
  if (phones.length === 2) {
    return (
      <>
        {phones.map((g) => (
          // eslint-disable-next-line @next/next/no-img-element -- static page, sizes known
          <img key={g.src} className="sg-phone" src={g.src} alt="" width={g.width} height={g.height} loading="lazy" decoding="async" />
        ))}
      </>
    );
  }
  const page = item.gallery?.[0];
  if (page) {
    // eslint-disable-next-line @next/next/no-img-element -- static page, sizes known
    return <img className="sg-shot" src={page.src} alt="" width={page.width} height={page.height} loading="lazy" decoding="async" />;
  }
  return <span className="sg-abstract"><CaseCover item={item} label={label} /></span>;
}
