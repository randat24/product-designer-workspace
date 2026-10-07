import { CaseFilter } from "./case-filter";
import { dict, type Case, type Locale } from "./content";
import { CaseCard, FeaturedCase, HeroCase } from "./ui";

/**
 * Cases as a gallery: the first one large («Кейс у фокусі»), the rest in a grid, with a real / concept filter
 * when there are both. Home and the work page share it; the order is the one set in the tool.
 */
export function CaseList({
  cases,
  locale,
  heading,
  extra,
  location = "cases",
  hero,
}: {
  cases: Case[];
  locale: Locale;
  heading: React.ReactNode;
  extra?: React.ReactNode;
  location?: "home" | "cases";
  /** Home: the first case opens the page (HeroCase), above the section title. */
  hero?: boolean;
}) {
  const d = dict(locale);
  const [first, ...rest] = cases;
  const real = cases.filter((c) => c.kind !== "concept").length;
  return (
    <CaseFilter
      heading={heading}
      extra={extra}
      counts={{ all: cases.length, real, concept: cases.length - real }}
      labels={{ group: d.cases.filter, all: d.cases.filterAll, real: d.cases.filterReal, concept: d.cases.filterConcept }}
      lead={hero && first ? <HeroCase item={first} locale={locale} label={d.cases.placeholder} total={cases.length} /> : undefined}
    >
      {first && !hero && <FeaturedCase item={first} locale={locale} label={d.cases.placeholder} total={cases.length} location={location} />}
      {rest.length > 0 && (
        <div className="grid gap-x-7 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((item, i) => (
            <CaseCard key={item.slug} item={item} locale={locale} label={d.cases.placeholder} index={i + 2} location={location} />
          ))}
        </div>
      )}
    </CaseFilter>
  );
}
