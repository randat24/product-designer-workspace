import "server-only";

// «Project brief» PDF: the first documented snapshot of what the client sent. Rendered on the server from the
// immutable document in project_request_documents, so the same version always gives the same content.
// Style follows the site and the CV: Oswald uppercase headings, Manrope text, ink header, lime marker.

import path from "node:path";
import { Children } from "react";
import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { budgetLabel, label, labels, type LabelLocale } from "../labels";
import type { BriefDocument, BriefSnapshot } from "../snapshot";

const FONTS = path.join(process.cwd(), "src/domains/requests/pdf/fonts");
let registered = false;
function registerFonts() {
  if (registered) return;
  Font.register({
    family: "Manrope",
    fonts: [
      { src: path.join(FONTS, "Manrope-Regular.ttf"), fontWeight: 400 },
      { src: path.join(FONTS, "Manrope-SemiBold.ttf"), fontWeight: 600 },
      { src: path.join(FONTS, "Manrope-Bold.ttf"), fontWeight: 700 },
    ],
  });
  Font.register({ family: "Oswald", src: path.join(FONTS, "Oswald-Bold.ttf"), fontWeight: 700 });
  // No automatic hyphenation: its rules are English-only and break Ukrainian words.
  Font.registerHyphenationCallback((word) => [word]);
  registered = true;
}

export const BRIEF_TEMPLATE_VERSION = 1;

type Copy = {
  title: string; requestId: string; date: string; version: string; versionValue: (n: number) => string; noName: string;
  sections: Record<"client" | "project" | "overview" | "existing" | "audience" | "competitors" | "references" | "scope" | "materials" | "budget" | "timeline" | "additional", string>;
  rows: Record<string, string>;
  clientInput: string; none: string; noExisting: string; advice: string; page: (n: number, total: number) => string;
  disclaimer: string;
};

const COPY: Record<"uk" | "en", Copy> = {
  uk: {
    title: "Бриф проєкту",
    requestId: "Номер заявки", date: "Дата подання", version: "Версія документа", versionValue: (n) => `Версія ${n}`,
    noName: "Проєкт без назви",
    sections: {
      client: "Клієнт", project: "Проєкт", overview: "Огляд проєкту", existing: "Чинний продукт", audience: "Цільова аудиторія",
      competitors: "Конкуренти", references: "Приклади дизайну", scope: "Очікуваний обсяг робіт", materials: "Наявні матеріали",
      budget: "Бюджет", timeline: "Терміни", additional: "Додаткова інформація",
    },
    rows: {
      name: "Ім'я", company: "Компанія", role: "Посада", email: "Email", phone: "Телефон", telegram: "Telegram", website: "Сайт",
      channel: "Зручний зв'язок", projectName: "Назва", types: "Тип роботи", url: "Адреса", summary: "Опис", whatItDoes: "Що робить",
      problem: "Проблема", whyNow: "Чому зараз", goals: "Цілі", description: "Що це зараз", worksWell: "Що працює добре",
      dislikes: "Що не подобається", mustChange: "Що треба змінити", links: "Посилання", audience: "Аудиторія",
      primaryUsers: "Основні користувачі", geography: "Географія / ринок", market: "Тип ринку", demographics: "Демографія",
      painPoints: "Труднощі користувачів", likes: "Подобається", why: "Чому конкурент", services: "Послуги", items: "Що є",
      range: "Бюджет", currency: "Валюта", note: "Коментар", start: "Бажаний старт", deadline: "Дедлайн", reason: "Причина",
    },
    clientInput: "Інформація надана клієнтом і ще не перевірена дослідженням.",
    none: "—", noExisting: "Продукту ще немає, починаємо з нуля.", advice: "Клієнт просить рекомендацію щодо обсягу робіт.",
    page: (n, total) => `${n} / ${total}`,
    disclaimer:
      "Цей документ фіксує початкову інформацію, надану клієнтом, і не є остаточним обсягом робіт, договором, кошторисом чи технічним завданням.",
  },
  en: {
    title: "Project brief",
    requestId: "Request ID", date: "Submitted", version: "Document version", versionValue: (n) => `Version ${n}`,
    noName: "Untitled project",
    sections: {
      client: "Client", project: "Project", overview: "Project overview", existing: "Current product", audience: "Target audience",
      competitors: "Competitors", references: "Design references", scope: "Expected scope", materials: "Available materials",
      budget: "Budget", timeline: "Timeline", additional: "Additional information",
    },
    rows: {
      name: "Name", company: "Company", role: "Role", email: "Email", phone: "Phone", telegram: "Telegram", website: "Website",
      channel: "Preferred contact", projectName: "Name", types: "Type of work", url: "URL", summary: "Description", whatItDoes: "What it does",
      problem: "Problem", whyNow: "Why now", goals: "Goals", description: "What it is today", worksWell: "What works well",
      dislikes: "What they dislike", mustChange: "What must change", links: "Links", audience: "Audience",
      primaryUsers: "Primary users", geography: "Geography / market", market: "Market type", demographics: "Demographics",
      painPoints: "User pain points", likes: "Likes", why: "Why a competitor", services: "Services", items: "Available",
      range: "Budget", currency: "Currency", note: "Comment", start: "Preferred start", deadline: "Deadline", reason: "Reason",
    },
    clientInput: "Client-provided information, not yet validated by research.",
    none: "—", noExisting: "No product yet, starting from scratch.", advice: "The client asks for a recommendation on scope.",
    page: (n, total) => `${n} / ${total}`,
    disclaimer:
      "This document records the initial information provided by the client and does not constitute a final scope of work, contract, estimate or project specification.",
  },
};

const C = { ink: "#151a33", ink2: "#5b6078", line: "#d6d9e0", canvas: "#eef0f3", lime: "#d9ee8f", subtle: "#f5f6f8" };
const s = StyleSheet.create({
  page: { fontFamily: "Manrope", fontSize: 9.5, color: C.ink, paddingTop: 34, paddingBottom: 64, paddingHorizontal: 38 },
  hero: { backgroundColor: C.ink, color: C.canvas, borderRadius: 12, padding: 22, marginBottom: 18 },
  eyebrow: { fontFamily: "Oswald", fontSize: 10, letterSpacing: 1.2, textTransform: "uppercase", color: C.lime },
  h1: { fontFamily: "Oswald", fontSize: 26, textTransform: "uppercase", lineHeight: 1.15, marginTop: 6 },
  meta: { flexDirection: "row", marginTop: 14, gap: 24 },
  metaK: { fontSize: 7.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.8, opacity: 0.65 },
  metaV: { fontSize: 10, fontWeight: 600, marginTop: 2 },
  note: { backgroundColor: C.subtle, borderRadius: 8, padding: 9, marginBottom: 14, fontSize: 8.5, color: C.ink2, lineHeight: 1.35 },
  section: { borderTopWidth: 1.5, borderTopColor: C.ink, paddingTop: 9, marginTop: 12 },
  h2: { fontFamily: "Oswald", fontSize: 12.5, textTransform: "uppercase", letterSpacing: 0.3, marginBottom: 6 },
  row: { flexDirection: "row", marginBottom: 4 },
  k: { width: 128, fontSize: 8.5, fontWeight: 600, color: C.ink2, paddingRight: 8, lineHeight: 1.35 },
  v: { flex: 1 },
  vt: { flex: 1, fontSize: 9.5, lineHeight: 1.35 },
  // Line height per text style, not on the page: a page-level lineHeight hides the fixed page number.
  // fontSize sits next to it: react-pdf resolves a unitless lineHeight against the element's own font size.
  p: { fontSize: 9.5, lineHeight: 1.35 },
  card: { borderWidth: 1, borderColor: C.line, borderRadius: 8, padding: 9, marginBottom: 6 },
  cardTitle: { fontWeight: 700, fontSize: 10, marginBottom: 3 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  chip: { backgroundColor: C.subtle, borderRadius: 999, paddingVertical: 2, paddingHorizontal: 7, fontSize: 8.5, fontWeight: 600 },
  disclaimer: { position: "absolute", bottom: 18, left: 38, right: 120, borderTopWidth: 1, borderTopColor: C.line, paddingTop: 6, fontSize: 7, color: C.ink2, lineHeight: 1.4 },
  pageNo: { position: "absolute", bottom: 18, right: 38, paddingTop: 7, fontSize: 7.5, color: C.ink2, textAlign: "right" },
});

function Row({ k, v }: { k: string; v?: string | null }) {
  if (!v) return null;
  return (
    <View style={s.row} wrap={false}>
      <Text style={s.k}>{k}</Text>
      <Text style={s.vt}>{v}</Text>
    </View>
  );
}

/**
 * A section whose heading never stays alone at the bottom of a page: it is kept with the first item.
 * `flow` sections (one long text) keep only some room after the heading, so the text can break across pages.
 */
function Section({ title, children, flow }: { title: string; children: React.ReactNode; flow?: boolean }) {
  if (flow) {
    // The first lines stay with the heading, cut at a paragraph or sentence end (else a space); the rest flows.
    const text = String(Children.toArray(children).join(""));
    const sentence = Math.max(text.lastIndexOf("\n", 420), text.lastIndexOf(". ", 420) + 1);
    const cut = text.length <= 480 ? text.length : sentence >= 120 ? sentence : Math.max(text.lastIndexOf(" ", 300), 200);
    return (
      <View style={s.section}>
        <View wrap={false}>
          <Text style={s.h2}>{title}</Text>
          <Text style={s.p}>{text.slice(0, cut)}</Text>
        </View>
        {cut < text.length && <Text style={s.p}>{text.slice(cut).trimStart()}</Text>}
      </View>
    );
  }
  const [first, ...rest] = Children.toArray(children);
  return (
    <View style={s.section}>
      <View wrap={false}>
        <Text style={s.h2}>{title}</Text>
        {first}
      </View>
      {rest}
    </View>
  );
}

function Chips({ items }: { items: string[] }) {
  if (!items.length) return null;
  return (
    <View style={s.chips}>
      {items.map((i) => <Text key={i} style={s.chip}>{i}</Text>)}
    </View>
  );
}

function BriefPdf({ doc, locale }: { doc: BriefDocument; locale: "uk" | "en" }) {
  const t = COPY[locale];
  const L: LabelLocale = locale;
  const b: BriefSnapshot = doc.content;
  const r = t.rows;
  const dateFmt = new Intl.DateTimeFormat(locale === "uk" ? "uk-UA" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Kyiv" });
  const date = dateFmt.format(new Date(b.submitted_at));
  const deadline = b.timeline.deadline_date ? dateFmt.format(new Date(`${b.timeline.deadline_date}T12:00:00Z`)) : null;
  const withOther = (items: string[], group: "types" | "goals", other: string | null) =>
    [...labels(group, items.filter((x) => x !== "other"), L), ...(items.includes("other") && other ? [other] : [])];
  const links = (ls: { kind: string; url: string }[]) => ls.map((l) => `${label("linkKinds", l.kind, L)}: ${l.url}`).join("\n");
  const name = b.project.name ?? t.noName;

  return (
    <Document title={`${t.title} — ${name} (${doc.code})`} author={b.client.name} subject={t.title} language={locale}>
      <Page size="A4" style={s.page}>
        <View style={s.hero}>
          <Text style={s.eyebrow}>{t.title}</Text>
          <Text style={s.h1}>{name}</Text>
          <View style={s.meta}>
            {[[t.requestId, doc.code], [t.date, date], [t.version, t.versionValue(doc.version)]].map(([k, v]) => (
              <View key={k}>
                <Text style={s.metaK}>{k}</Text>
                <Text style={s.metaV}>{v}</Text>
              </View>
            ))}
          </View>
        </View>
        <Text style={s.note}>{t.clientInput}</Text>

        <Section title={t.sections.client}>
          <Row k={r.name!} v={b.client.name} />
          <Row k={r.company!} v={b.client.company} />
          <Row k={r.role!} v={b.client.role} />
          <Row k={r.email!} v={b.client.email} />
          <Row k={r.phone!} v={b.client.phone} />
          <Row k={r.telegram!} v={b.client.telegram} />
          <Row k={r.website!} v={b.client.website} />
          <Row k={r.channel!} v={b.client.preferred_channel === "other" ? b.client.preferred_channel_note : label("channels", b.client.preferred_channel, L)} />
        </Section>

        <Section title={t.sections.project}>
          <Row k={r.projectName!} v={name} />
          <View style={s.row}>
            <Text style={s.k}>{r.types}</Text>
            <View style={s.v}><Chips items={withOther(b.project.types, "types", b.project.type_other)} /></View>
          </View>
          <Row k={r.url!} v={b.existing.has ? b.existing.url : null} />
        </Section>

        <Section title={t.sections.overview}>
          <Row k={r.summary!} v={b.about.summary} />
          <Row k={r.whatItDoes!} v={b.about.what_it_does} />
          <Row k={r.problem!} v={b.about.problem} />
          <Row k={r.whyNow!} v={b.about.why_now} />
          {b.about.goals.length > 0 && (
            <View style={s.row}>
              <Text style={s.k}>{r.goals}</Text>
              <View style={s.v}><Chips items={withOther(b.about.goals, "goals", b.about.goal_other)} /></View>
            </View>
          )}
        </Section>

        <Section title={t.sections.existing}>
          {b.existing.has ? (
            <>
              <Row k={r.description!} v={b.existing.description} />
              <Row k={r.worksWell!} v={b.existing.works_well} />
              <Row k={r.dislikes!} v={b.existing.dislikes} />
              <Row k={r.mustChange!} v={b.existing.must_change} />
              <Row k={r.links!} v={links(b.existing.links)} />
            </>
          ) : <Text style={s.p}>{t.noExisting}</Text>}
        </Section>

        <Section title={t.sections.audience}>
          <Row k={r.audience!} v={b.audience.audience} />
          <Row k={r.primaryUsers!} v={b.audience.primary_users} />
          <Row k={r.geography!} v={b.audience.geography} />
          <Row k={r.market!} v={label("markets", b.audience.market, L)} />
          <Row k={r.demographics!} v={b.audience.demographics} />
          <Row k={r.painPoints!} v={b.audience.pain_points} />
          {!b.audience.audience && !b.audience.primary_users && !b.audience.pain_points && <Text style={s.p}>{t.none}</Text>}
        </Section>

        <Section title={t.sections.competitors}>
          {b.competitors.length ? b.competitors.map((c, i) => (
            <View key={i} style={s.card} wrap={false}>
              <Text style={s.cardTitle}>{c.name}</Text>
              <Row k={r.url!} v={c.url} />
              <Row k={r.likes!} v={c.likes} />
              <Row k={r.dislikes!} v={c.dislikes} />
              <Row k={r.why!} v={c.why} />
            </View>
          )) : <Text style={s.p}>{t.none}</Text>}
        </Section>

        <Section title={t.sections.references}>
          {b.references.length ? b.references.map((x, i) => (
            <View key={i} style={s.card} wrap={false}>
              <Text style={s.cardTitle}>{x.url}</Text>
              {x.note && <Text style={s.p}>{x.note}</Text>}
            </View>
          )) : <Text style={s.p}>{t.none}</Text>}
        </Section>

        <Section title={t.sections.scope}>
          <Chips items={labels("scope", b.scope.items, L)} />
          {b.scope.needs_advice && <Text style={[s.p, { marginTop: 4 }]}>{t.advice}</Text>}
        </Section>

        <Section title={t.sections.materials}>
          <Chips items={labels("materials", b.materials.items, L)} />
          <View style={{ marginTop: 4 }}><Row k={r.links!} v={links(b.materials.links)} /></View>
          {!b.materials.items.length && !b.materials.links.length && <Text style={s.p}>{t.none}</Text>}
        </Section>

        <Section title={t.sections.budget}>
          <Row k={r.range!} v={budgetLabel(b.budget, L)} />
          <Row k={r.currency!} v={b.budget.currency} />
          <Row k={r.note!} v={b.budget.note} />
        </Section>

        <Section title={t.sections.timeline}>
          <Row k={r.start!} v={label("start", b.timeline.start, L)} />
          <Row k={r.deadline!} v={b.timeline.has_deadline ? deadline : t.none} />
          <Row k={r.reason!} v={b.timeline.has_deadline ? b.timeline.deadline_reason : null} />
        </Section>

        <Section title={t.sections.additional} flow>{b.additional_info || t.none}</Section>

        <Text style={s.disclaimer} fixed>{t.disclaimer}</Text>
        <Text style={s.pageNo} fixed render={({ pageNumber, totalPages }) => `${doc.code} · ${t.page(pageNumber, totalPages)}`} />
      </Page>
    </Document>
  );
}

/**
 * react-pdf keeps a loaded font together with the glyph subset of the first document it rendered, so a second
 * document in the same server process loses letters the first one did not use (seen: Latin after Cyrillic).
 * Every render therefore starts from freshly loaded fonts, and renders run one at a time.
 */
function freshFonts() {
  const families = Font.getRegisteredFonts() as Record<string, { sources: { data: unknown; loadResultPromise: unknown }[] }>;
  for (const family of ["Manrope", "Oswald"]) {
    for (const source of families[family]?.sources ?? []) {
      source.data = null;
      source.loadResultPromise = null;
    }
  }
}

let queue: Promise<unknown> = Promise.resolve();

export function renderBriefPdf(doc: BriefDocument, locale: "uk" | "en"): Promise<Buffer> {
  const run = queue.then(async () => {
    registerFonts();
    freshFonts();
    return renderToBuffer(<BriefPdf doc={doc} locale={locale} />);
  });
  queue = run.catch(() => undefined);
  return run;
}
