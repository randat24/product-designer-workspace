import { CONTACTS, dict, type Locale } from "@/site/content";
import { getCases } from "@/site/cases-source";
import { getSiteProfile } from "@/site/profile-source";
import { applyProfile } from "@/site/site-profile";
import { absoluteUrl, localeUrl } from "@/site/seo";
import { isIndexable } from "@/shared/lib/site-url";

// /llms.txt (llmstxt.org): a plain Markdown overview of the site for AI assistants (ChatGPT, Perplexity,
// Claude…), so they can answer "who is this designer and what has he done" from one file and cite the
// right page. Built from the same data as the pages: the dictionary, the «Профіль сайту» and the
// published cases, so it never says anything the site does not. Sample cases are left out, as in the
// sitemap. English first (most assistants answer in English), then the Ukrainian pages.
export const revalidate = 3600;

const line = (s: string) => s.replace(/\s+/g, " ").trim();

async function overview(locale: Locale): Promise<string> {
  const d = applyProfile(dict(locale), await getSiteProfile(locale));
  const cases = (await getCases(locale)).filter((c) => !c.sample);
  const designJobs = d.jobs.filter((j) => !j.military);
  const service = d.jobs.find((j) => j.military);
  const en = locale === "en";

  const out: string[] = [];
  out.push(`## ${en ? "About" : "Про мене"}`, "");
  out.push(`- ${en ? "Name" : "Імʼя"}: ${d.name}`);
  out.push(`- ${en ? "Role" : "Роль"}: ${d.role}`);
  out.push(`- ${en ? "Location" : "Локація"}: ${d.location}`);
  out.push(`- ${en ? "Summary" : "Коротко"}: ${line(d.about.summary)}`);
  for (const f of d.about.facts) out.push(`- ${f.value} ${f.label}`);
  out.push("");

  out.push(`### ${en ? "Skills" : "Навички"}`, "");
  for (const s of d.skills) out.push(`- ${s.group}: ${line(s.items)}`);
  out.push("");

  if (designJobs.length) {
    out.push(`### ${en ? "Experience" : "Досвід"}`, "");
    for (const j of designJobs) out.push(`- ${j.period}: ${j.title}, ${j.place}. ${j.points.map(line).join("; ")}`);
    out.push("");
  }
  if (service) {
    out.push(`### ${d.about.serviceTitle}`, "", line(d.about.serviceText), "");
  }
  if (d.awards.length) {
    out.push(`### ${d.about.awards}`, "");
    for (const a of d.awards) out.push(`- ${a.title}${a.issuer === a.title ? "" : ` (${a.issuer})`}`);
    out.push("");
  }
  out.push(`### ${d.about.education}`, "");
  for (const e of d.education) {
    // A certificate's place reads "School · certificate"; the link says it instead.
    const place = e.certificate ? e.place.split(" · ")[0] : e.place;
    out.push(`- ${e.year}: ${e.title}, ${place}${e.certificate ? ` ([${en ? "certificate" : "сертифікат"}](${e.certificate}))` : ""}`);
  }
  out.push("");
  out.push(`### ${d.about.languages}`, "");
  for (const l of d.languages) out.push(`- ${l.name}: ${l.level}`);
  out.push("");
  out.push(`### ${d.about.availability}`, "");
  for (const a of d.availability) out.push(`- ${line(a)}`);
  out.push("");

  out.push(`## ${en ? "Case studies" : "Кейси"}`, "");
  for (const c of cases) {
    const kind = c.kind === "concept" ? (en ? "concept" : "концепт") : en ? "real project" : "реальний проєкт";
    const meta = [c.year, c.client, c.role, kind].filter(Boolean).join(" · ");
    out.push(`- [${line(c.title)}](${localeUrl(locale, `/cases/${c.slug}`)}): ${line(c.summary)} (${meta})`);
  }
  out.push("");

  out.push(`## ${en ? "Pages" : "Сторінки"}`, "");
  out.push(`- [${d.seo.home.title}](${localeUrl(locale, "")}): ${line(d.seo.home.description)}`);
  out.push(`- [${d.seo.about.title}](${localeUrl(locale, "/about")}): ${line(d.seo.about.description)}`);
  out.push(`- [${d.seo.cases.title}](${localeUrl(locale, "/cases")}): ${line(d.seo.cases.description)}`);
  out.push(`- [${en ? "Start a project (brief form)" : "Почати проєкт (форма брифу)"}](${localeUrl(locale, "/start-project")})`);
  out.push(`- [${en ? "CV (PDF)" : "Резюме (PDF)"}](${absoluteUrl(CONTACTS.cv[locale])})`);
  return out.join("\n");
}

export async function GET() {
  const en = dict("en");
  const body = [
    `# ${en.name} — ${en.role}`,
    "",
    `> ${line(en.seo.home.description)}`,
    "",
    `Portfolio of ${en.name} (${dict("uk").name}), ${en.role}, ${en.location}. The site is bilingual: English under /en, Ukrainian under /uk.`,
    "",
    "## Contact",
    "",
    `- Email: ${CONTACTS.email}`,
    `- LinkedIn: ${CONTACTS.linkedin}`,
    `- Dribbble: ${CONTACTS.dribbble}`,
    `- Telegram: ${CONTACTS.telegram}`,
    "",
    await overview("en"),
    "",
    "---",
    "",
    "Нижче те саме українською.",
    "",
    await overview("uk"),
    "",
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      // Previews stay out of every index, like the rest of the site.
      ...(isIndexable() ? {} : { "X-Robots-Tag": "noindex" }),
    },
  });
}
