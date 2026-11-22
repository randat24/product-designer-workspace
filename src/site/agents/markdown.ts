// The site for AI agents: every public page also as plain Markdown, built from the same data as the HTML page
// (the dictionary, «Профіль сайту», the published case snapshots, the notes), so an agent reads the same facts a
// visitor sees without parsing the layout. Pure functions: the routes load the data (src/site/agents/source.ts).
// URLs: /uk.md, /uk/about.md, /uk/cases.md, /uk/cases/<slug>.md, /uk/notes.md (and /en/…); the HTML pages
// point to them with <link rel="alternate" type="text/markdown">. See docs/SEO.md, «Версия для агентов».

import { CONTACTS, type Case, type Dictionary, type Locale } from "../content";
import type { CaseStory, StoryLabels } from "../case-story";
import type { ProductSection } from "../product-story";
import type { Note } from "../notes-source";
import { signalCopy } from "../signal/home-content";
import { absoluteUrl, localeUrl, markdownUrl } from "../seo";

export { markdownUrl };

const other = (locale: Locale): Locale => (locale === "uk" ? "en" : "uk");
/** One line: collapses the line breaks of a text field. */
export const line = (s: string) => s.replace(/\s+/g, " ").trim();
/** A text field with its paragraphs kept. */
const text = (s: string) => s.replace(/\r\n/g, "\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
/** A table cell: no pipes or line breaks. */
const cell = (s: string) => line(s).replace(/\|/g, "\\|");

const L = {
  uk: {
    html: "HTML-версія",
    otherLang: "English version",
    agentNote: "Markdown-версія сторінки для AI-агентів. Ті самі дані, що й на сторінці.",
    contact: "Контакти",
    email: "Пошта",
    brief: "Форма брифу (почати проєкт)",
    cv: "Резюме (PDF)",
    services: "Послуги",
    result: "Результат",
    work: "Вибрані роботи",
    approach: "Підхід",
    allCases: "Усі кейси",
    year: "Рік",
    client: "Клієнт",
    role: "Роль",
    kind: "Тип",
    real: "реальний проєкт",
    concept: "концепт",
    tags: "Теги",
    metrics: "Цифри",
    live: "Живий продукт",
    prototype: "Прототип",
    figma: "Файл Figma",
    pages: "Сторінки проєкту",
    sampleNote: "Кейс-приклад: цифри й цитати ілюстративні.",
    adultNote: "Проєкт для аудиторії 18+.",
    trace: "Слід рішень",
    traceNote: "Записи робочого зошита і звʼязки між ними (від спостережень до рішень).",
    links: "Звʼязки",
    summary: "Коротко",
    experience: "Досвід",
    skills: "Навички",
    name: "Імʼя",
    location: "Локація",
    notesEmpty: "Поки немає нотаток цією мовою.",
    continues: "продовжує нотатку",
    tagsLabel: "теги",
    noCases: "Поки немає опублікованих кейсів.",
    process: "Процес",
    agents: "Для агентів",
  },
  en: {
    html: "HTML version",
    otherLang: "Українська версія",
    agentNote: "Markdown version of the page for AI agents. Same data as the page.",
    contact: "Contact",
    email: "Email",
    brief: "Project brief form (start a project)",
    cv: "CV (PDF)",
    services: "Services",
    result: "What you get",
    work: "Selected work",
    approach: "Approach",
    allCases: "All case studies",
    year: "Year",
    client: "Client",
    role: "Role",
    kind: "Type",
    real: "real project",
    concept: "concept",
    tags: "Tags",
    metrics: "Numbers",
    live: "Live product",
    prototype: "Prototype",
    figma: "Figma file",
    pages: "Project pages",
    sampleNote: "Sample case: numbers and quotes are illustrative.",
    adultNote: "Made for an 18+ audience.",
    trace: "Decision trace",
    traceNote: "Records of the workbook and the links between them (from observations to decisions).",
    links: "Links",
    summary: "Summary",
    experience: "Experience",
    skills: "Skills",
    name: "Name",
    location: "Location",
    notesEmpty: "No notes in this language yet.",
    continues: "continues note",
    tagsLabel: "tags",
    noCases: "No published case studies yet.",
    process: "Process",
    agents: "For agents",
  },
} satisfies Record<Locale, Record<string, string>>;

/** Title, the page it mirrors and the same page in the other language. */
function header(locale: Locale, path: string, title: string, lede?: string): string[] {
  const l = L[locale];
  const alt = markdownUrl(other(locale), path);
  const out = [`# ${line(title)}`, ""];
  if (lede) out.push(`> ${line(lede)}`, "");
  out.push(`${l.agentNote} ${l.html}: ${localeUrl(locale, path)}${alt ? ` · ${l.otherLang}: ${alt}` : ""}`, "");
  return out;
}

function contacts(locale: Locale): string[] {
  const l = L[locale];
  return [
    `## ${l.contact}`,
    "",
    `- ${l.email}: ${CONTACTS.email}`,
    `- LinkedIn: ${CONTACTS.linkedin}`,
    `- Dribbble: ${CONTACTS.dribbble}`,
    `- Telegram: ${CONTACTS.telegram}`,
    `- ${l.brief}: ${localeUrl(locale, "/start-project")}`,
    `- ${l.cv}: ${absoluteUrl(CONTACTS.cv[locale])}`,
    "",
  ];
}

const kindLabel = (locale: Locale, c: Case) => (c.kind === "concept" ? L[locale].concept : c.kind === "real" ? L[locale].real : null);

/** One case as a list item: link to its Markdown, summary and facts. */
function caseItem(locale: Locale, c: Case): string {
  const meta = [c.year, c.client, c.role, kindLabel(locale, c)].filter(Boolean).map((s) => line(s!)).join(" · ");
  return `- [${line(c.title)}](${markdownUrl(locale, `/cases/${c.slug}`)}): ${line(c.summary)}${meta ? ` (${meta})` : ""}`;
}

export function homeMarkdown(locale: Locale, d: Dictionary, cases: Case[]): string {
  const s = signalCopy(locale);
  const l = L[locale];
  const shown = cases.filter((c) => !c.sample);
  const out = header(locale, "", `${d.name} — ${s.role}`, d.seo.home.description);
  out.push(line(s.about.text), "");
  for (const f of s.about.facts) out.push(`- ${f.value}: ${f.label}`);
  out.push("");
  out.push(`## ${l.work}`, "");
  out.push(...(shown.length ? shown.map((c) => caseItem(locale, c)) : [l.noCases]), "");
  out.push(`[${l.allCases}](${markdownUrl(locale, "/cases")})`, "");
  out.push(`## ${l.services}`, "", line(s.services.lead), "");
  for (const it of s.services.items) out.push(`### ${it.title}`, "", line(it.text), "", `${l.result}: ${line(it.result)}`, "");
  out.push(`## ${l.approach}`, "", `${s.process.title.join(" ")} ${line(s.process.lead)}`, "");
  for (const st of s.process.steps) out.push(`- ${st.code} — ${st.title}: ${line(st.text)}`);
  out.push("");
  out.push(`## ${d.nav.about}`, "", `${line(d.about.summary)} → ${markdownUrl(locale, "/about")}`, "");
  out.push(...contacts(locale));
  return out.join("\n");
}

export function aboutMarkdown(locale: Locale, d: Dictionary): string {
  const l = L[locale];
  const designJobs = d.jobs.filter((j) => !j.military);
  const service = d.jobs.find((j) => j.military);
  const out = header(locale, "/about", d.about.title, d.seo.about.description);
  out.push(`- ${l.name}: ${d.name}`, `- ${l.role}: ${d.role}`, `- ${l.location}: ${d.location}`, "");
  out.push(text(d.about.summary), "");
  for (const f of d.about.facts) out.push(`- ${f.value} ${f.label}`);
  out.push("");
  if (d.about.steps.length) {
    out.push(`## ${d.about.approach}`, "", line(d.about.approachLead), "");
    d.about.steps.forEach((st, i) => out.push(`${i + 1}. **${st.title}.** ${line(st.text)} (${d.about.inWorkbook}: ${line(st.tie)})`));
    out.push("");
  }
  if (designJobs.length) {
    out.push(`## ${d.about.experience}`, "");
    for (const j of designJobs) {
      out.push(`### ${j.title}, ${j.place} (${j.period})`, "");
      for (const p of j.details?.length ? j.details : j.points) out.push(`- ${line(p)}`);
      out.push("");
    }
  }
  if (service) {
    out.push(`## ${d.about.serviceTitle}`, "", text(d.about.serviceText), "");
    if (d.about.serviceThanks) out.push(line(d.about.serviceThanks), "");
  }
  if (d.awards.length) {
    out.push(`## ${d.about.awards}`, "");
    for (const a of d.awards) out.push(`- **${a.title}**${a.issuer === a.title ? "" : ` (${a.issuer})`}: ${line(a.description)}`);
    out.push("");
  }
  out.push(`## ${d.about.skills}`, "");
  for (const s of d.skills) out.push(`- ${s.group}: ${line(s.items)}`);
  out.push("", `## ${d.about.education}`, "");
  for (const e of d.education) {
    const place = e.certificate ? e.place.split(" · ")[0] : e.place;
    out.push(`- ${e.year}: ${e.title}, ${place}${e.certificate ? ` (${e.certificate})` : ""}`);
  }
  out.push("", `## ${d.about.languages}`, "");
  for (const lang of d.languages) out.push(`- ${lang.name}: ${lang.level}`);
  out.push("", `## ${d.about.availability}`, "");
  for (const a of d.availability) out.push(`- ${line(a)}`);
  out.push("");
  out.push(...contacts(locale));
  return out.join("\n");
}

export function casesMarkdown(locale: Locale, d: Dictionary, cases: Case[]): string {
  const l = L[locale];
  const out = header(locale, "/cases", d.cases.title, d.seo.cases.description);
  out.push(line(d.cases.lead), "");
  const real = cases.filter((c) => !c.sample);
  out.push(...(real.length ? real.map((c) => caseItem(locale, c)) : [l.noCases]), "");
  return out.join("\n");
}

function storyMarkdown(story: CaseStory, t: StoryLabels): string[] {
  const out: string[] = [];
  if (story.meta.length) {
    for (const m of story.meta) out.push(`- ${m.label}: ${line(m.value)}`);
    out.push("");
  }
  out.push(`## ${t.overview}`, "", `**${t.challenge}.** ${text(story.overview.challenge)}`, "", `**${t.solution}.** ${text(story.overview.solution)}`, "", `**${t.outcome}.** ${text(story.overview.outcome)}`, "");
  if (story.process.length) {
    out.push(`## ${t.process}`, "");
    for (const p of story.process) out.push(`- ${p.value} ${p.label}`);
    out.push("");
  }
  if (story.research) {
    out.push(`## ${t.research}`, "", text(story.research.intro), "");
    for (const f of story.research.facts) out.push(`- ${f.value}: ${f.label}`);
    if (story.research.facts.length) out.push("");
    for (const q of story.research.quotes) out.push(`> ${line(q.text)}`, `> — ${line(q.who)}`, "");
  }
  if (story.insights?.length) {
    out.push(`## ${t.insights}`, "");
    for (const i of story.insights) {
      out.push(`### ${i.code}: ${line(i.title)}`, "", text(i.body), "");
      if (i.evidence) out.push(`${t.evidence}: ${line(i.evidence)}`, "");
    }
  }
  if (story.competitors) {
    const c = story.competitors;
    out.push(`## ${t.competitors}`, "", text(c.intro), "");
    if (c.products.length && c.rows.length) {
      out.push(`| | ${c.products.map(cell).join(" | ")} |`, `|---|${c.products.map(() => "---").join("|")}|`);
      for (const r of c.rows) out.push(`| ${cell(r.feature)} | ${r.marks.map((m) => t.marks[m]).join(" | ")} |`);
      out.push("");
    }
  }
  if (story.opportunities?.length) {
    out.push(`## ${t.opportunities}`, "");
    for (const o of story.opportunities) out.push(`- ${o.code}: ${line(o.text)}`);
    out.push("");
  }
  if (story.flow) {
    out.push(`## ${t.flow}`, "", text(story.flow.intro), "");
    story.flow.steps.forEach((s, i) => out.push(`${i + 1}. ${line(s.label)} (${s.kind})`));
    out.push("");
    if (story.flow.edgeCases.length) {
      out.push(`### ${t.edgeCases}`, "");
      for (const e of story.flow.edgeCases) out.push(`- ${line(e)}`);
      out.push("");
    }
  }
  if (story.screens) {
    out.push(`## ${t.screens}`, "", text(story.screens.intro), "");
    for (const s of story.screens.items) {
      out.push(`- **${line(s.title)}**: ${line(s.caption)}${s.states.length ? ` (${s.states.map(line).join(", ")})` : ""}`);
    }
    out.push("");
  }
  if (story.decisions?.length) {
    out.push(`## ${t.decisions}`, "");
    for (const dec of story.decisions) {
      out.push(`### ${dec.code}: ${line(dec.title)}`, "", `**${t.why}.** ${text(dec.why)}`, "");
      if (dec.rejected.length) out.push(`${t.rejected}:`, ...dec.rejected.map((r) => `- ${line(r)}`), "");
      if (dec.evidence.length) out.push(`${t.evidence}: ${dec.evidence.map(line).join(", ")}`, "");
    }
  }
  if (story.results) {
    out.push(`## ${t.results}`, "", text(story.results.intro), "");
    for (const m of story.results.metrics) out.push(`- ${m.value}: ${m.label}`);
    if (story.results.metrics.length) out.push("");
    if (story.results.quote) out.push(`> ${line(story.results.quote.text)}`, `> — ${line(story.results.quote.who)}`, "");
  }
  return out;
}

const paras = (body: string[]) => body.map(text).filter(Boolean).flatMap((p) => [p, ""]);

function productSection(s: ProductSection): string[] {
  const out = [`## ${line(s.title)}`, ""];
  if (s.lede) out.push(line(s.lede), "");
  switch (s.kind) {
    case "overview":
      out.push(...paras(s.body));
      for (const f of s.facts) out.push(`- ${f.label}: ${line(f.value)}`);
      break;
    case "role":
      for (const a of s.areas) out.push(`- ${line(a)}`);
      break;
    case "challenge":
      out.push(...paras(s.body));
      for (const b of s.behaviors) out.push(`- **${line(b.who)}**: ${line(b.goal)}`);
      break;
    case "ecosystem":
      out.push(`${line(s.center)}: ${s.nodes.map(line).join(", ")}`);
      break;
    case "roles":
      for (const r of s.items) {
        out.push(`### ${line(r.name)}`, "", line(r.summary), "");
        for (const c of r.can) out.push(`- ${line(c)}`);
        out.push("");
      }
      break;
    case "ia":
    case "system":
      if (s.kind === "system") out.push(...paras(s.body));
      for (const g of s.groups) out.push(`- **${line(g.title)}**: ${g.items.map(line).join(", ")}`);
      break;
    case "flows":
      for (const f of s.items) out.push(`- **${line(f.title)}**: ${f.steps.map(line).join(" → ")}`);
      break;
    case "monetization":
      out.push(s.chain.map(line).join(" → "), "");
      for (const a of s.actions) out.push(`- ${line(a)}`);
      if (s.actions.length) out.push("");
      for (const m of s.models) out.push(`- **${line(m.title)}**: ${line(m.body)}`);
      break;
    case "principles":
    case "trust":
      for (const p of s.items) out.push(`- **${line(p.title)}**: ${line(p.body)}`);
      break;
    case "screens":
      for (const i of s.items) out.push(`- ${line(i.caption ?? i.alt)}`);
      break;
    case "checklist":
      out.push(...paras(s.body));
      for (const i of s.items) out.push(`- ${line(i)}`);
      break;
    case "brand":
      out.push(...paras(s.body));
      for (const p of s.parts) out.push(`- **${line(p.title)}**: ${line(p.meaning)}`);
      out.push("", line(s.formula));
      break;
    case "timeline":
      s.steps.forEach((st, i) => out.push(`${i + 1}. **${line(st.title)}.** ${line(st.body)}`));
      break;
    case "figure":
      out.push(...paras(s.body));
      for (const i of s.images) out.push(`- ${line(i.caption ?? i.alt)}`);
      break;
    case "outcome":
      out.push(...paras(s.body));
      break;
  }
  if (out[out.length - 1] !== "") out.push("");
  return out;
}

export function caseMarkdown(locale: Locale, d: Dictionary, c: Case): string {
  const l = L[locale];
  const out = header(locale, `/cases/${c.slug}`, c.title, c.summary);
  if (c.sample) out.push(`**${l.sampleNote}**`, "");
  if (c.adult) out.push(`*${l.adultNote}*`, "");
  const facts: [string, string | undefined | null][] = [
    [l.year, c.year],
    [l.client, c.client],
    [l.role, c.role],
    [l.kind, kindLabel(locale, c)],
    [l.tags, c.tags.join(", ")],
    [l.live, c.liveUrl],
    [l.prototype, c.prototype ? absoluteUrl(c.prototype) : undefined],
    [l.figma, c.figma],
  ];
  for (const [k, v] of facts) if (v) out.push(`- ${k}: ${line(v)}`);
  out.push("");
  if (c.metrics.length) {
    out.push(`## ${l.metrics}`, "");
    for (const m of c.metrics) out.push(`- ${m.value}: ${m.label}`);
    out.push("");
  }
  if (c.product) {
    if (c.product.note) out.push(line(c.product.note), "");
    for (const s of c.product.sections) out.push(...productSection(s));
  } else if (c.story) {
    out.push(...storyMarkdown(c.story, d.story));
  } else {
    for (const s of c.sections) out.push(`## ${line(s.title)}`, "", text(s.body), "");
  }
  if (c.process) {
    const stages = Object.entries(c.process).filter(([, n]) => typeof n === "number" && n > 0);
    if (stages.length) {
      out.push(`## ${l.process}`, "", line(d.process.note), "");
      for (const [stage, n] of stages) out.push(`- ${d.process.stages[stage as keyof typeof d.process.stages] ?? stage}: ${n}`);
      out.push("");
    }
  }
  if (c.trace) {
    out.push(`## ${l.trace}`, "", l.traceNote, "");
    for (const n of c.trace.nodes) out.push(`- ${n.code} (${n.stage})${n.title ? `: ${line(n.title)}` : ""}`);
    out.push("", `${l.links}: ${c.trace.links.map(([a, b]) => `${a} → ${b}`).join("; ")}`, "");
  }
  // Mockups of an 18+ case wait for an age check on the page; the agent version lists them only for the others.
  if (c.gallery?.length && !c.adult) {
    out.push(`## ${l.pages}`, "");
    for (const g of c.gallery) out.push(`- ${line(g.caption ?? g.alt)}: ${g.src.startsWith("/") ? absoluteUrl(g.src) : g.src}`);
    out.push("");
  }
  out.push(...contacts(locale));
  return out.join("\n");
}

export function notesMarkdown(locale: Locale, d: Dictionary, notes: Note[]): string {
  const l = L[locale];
  const out = header(locale, "/notes", d.notes.title, d.seo.notes.description);
  out.push(line(d.notes.lead), "");
  if (!notes.length) out.push(l.notesEmpty, "");
  for (const n of notes) {
    out.push(`## #${n.number} · ${n.publishedAt.slice(0, 10)}`, "", `${localeUrl(locale, `/notes/${n.number}`)}`, "");
    if (n.parent) out.push(`*${l.continues} #${n.parent}*`, "");
    out.push(text(n.body), "");
    if (n.tags.length) out.push(`${l.tagsLabel}: ${n.tags.join(", ")}`, "");
  }
  return out.join("\n");
}

/** The "for agents" block of /llms.txt: where the Markdown and JSON versions are. */
export function agentIndex(): string[] {
  return [
    "## For agents",
    "",
    "Every public page has a Markdown twin: add `.md` to the URL, or request the page with `Accept: text/markdown`.",
    "",
    ...(["en", "uk"] as const).flatMap((loc) => [
      `- ${loc === "en" ? "English" : "Українська"}: [home](${markdownUrl(loc, "")}), [about](${markdownUrl(loc, "/about")}), [case studies](${markdownUrl(loc, "/cases")}), [notes](${markdownUrl(loc, "/notes")})`,
    ]),
    `- [llms-full.txt](${absoluteUrl("/llms-full.txt")}): the profile and every published case study in full, in one file`,
    `- [portfolio.json](${absoluteUrl("/portfolio.json")}): profile, services, contacts and cases as JSON`,
    "",
  ];
}
