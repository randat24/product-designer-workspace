import { LOCALES, dict } from "@/site/content";
import { NotFoundView, type NotFoundLabels } from "@/site/not-found-view";

// 404 for notFound() inside the site (an unknown case slug), within the site layout; status 404,
// Next.js adds noindex. Unknown URLs never get here — they get app/global-not-found.tsx.
// No headers() here: reading the request would make every site page dynamic (and a dynamic
// not-found drops to Next's empty error shell), so both languages are passed and the view picks
// one from the URL.
export default function NotFound() {
  const labels = Object.fromEntries(
    LOCALES.map((l) => {
      const d = dict(l);
      return [
        l,
        {
          title: `${d.seo.notFound.title} | ${d.name}`,
          heading: d.ui.notFoundTitle,
          body: d.ui.notFoundBody,
          home: d.ui.notFoundHome,
          work: d.ui.notFoundWork,
          about: d.nav.about,
          nav: d.ui.mainNav,
        },
      ];
    }),
  ) as Record<(typeof LOCALES)[number], NotFoundLabels>;
  return <NotFoundView labels={labels} />;
}
