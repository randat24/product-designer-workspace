// Builds the PDF CVs (public/cv/hennadii-fedorov-cv-{uk,en}.pdf) from the site content, in the site's style:
// Oswald uppercase headings, Manrope text, the ink / sticker palette, rounded cards.
// Run: npm run cv  (Chromium from Playwright; no dev server needed).
//
// The CV and the «Про мене» page read the same data (src/site/content.ts), so they cannot drift apart.

import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "@playwright/test";
import { CONTACTS, LOCALES, dict, type Locale } from "../src/site/content";

const ROOT = resolve(__dirname, "..");
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || "https://product-designer-workspace.vercel.app").replace(/\/+$/, "");
/** CV only: the phone is not published on the site pages. */
const PHONE = "+38 063 314 37 55";

const EXTRA: Record<Locale, { phone: string; portfolio: string; contacts: string; languages: string }> = {
  uk: { phone: "Телефон", portfolio: "Портфоліо", contacts: "Контакти", languages: "Мови" },
  en: { phone: "Phone", portfolio: "Portfolio", contacts: "Contacts", languages: "Languages" },
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const bare = (url: string) => url.replace(/^https?:\/\//, "").replace(/^www\./, "");
const font = (pkg: string) => pathToFileURL(join(ROOT, "node_modules/@fontsource-variable", pkg, "index.css")).href;
const award = (icon: string) => pathToFileURL(join(ROOT, "public/awards", `${icon}.svg`)).href;

function html(locale: Locale): string {
  const d = dict(locale);
  const x = EXTRA[locale];
  const contacts = [
    [x.phone, PHONE, `tel:${PHONE.replace(/\s/g, "")}`],
    ["Email", CONTACTS.email, `mailto:${CONTACTS.email}`],
    ["Telegram", bare(CONTACTS.telegram), CONTACTS.telegram],
    ["LinkedIn", bare(CONTACTS.linkedin), CONTACTS.linkedin],
    ["Dribbble", bare(CONTACTS.dribbble), CONTACTS.dribbble],
    [x.portfolio, bare(`${SITE}/${locale}`), `${SITE}/${locale}`],
  ];

  const section = (title: string, body: string, cls = "") =>
    `<section class="sec ${cls}"><h2>${esc(title)}</h2><div>${body}</div></section>`;

  const jobs = d.jobs
    .map(
      (j) => `<article class="job">
        <p class="period">${esc(j.period)}</p>
        <div>
          <h3>${esc(j.title)}${j.military ? ` <span class="pill">${esc(d.about.serviceTitle)}</span>` : ""}</h3>
          <p class="place">${esc(j.place)}</p>
          <ul class="dash">${(j.details ?? j.points).map((p) => `<li>${esc(p)}</li>`).join("")}</ul>
        </div>
      </article>`,
    )
    .join("");

  const skills = `<div class="cards">${d.skills
    .map((s) => `<div class="card"><p class="eyebrow">${esc(s.group)}</p><p>${esc(s.items)}</p></div>`)
    .join("")}</div>`;

  const education = `<div class="cols">
      <ul class="plain">${d.education
        .map((e) => `<li><b>${esc(e.title)}</b><span>${esc(e.place)} · ${esc(e.year)}</span></li>`)
        .join("")}</ul>
      <div><p class="eyebrow">${esc(x.languages)}</p><ul class="plain">${d.languages
        .map((l) => `<li><b>${esc(l.name)}</b><span>${esc(l.level)}</span></li>`)
        .join("")}</ul></div>
    </div>`;

  const availability = `<div class="sticker"><ul class="dash">${d.availability.map((a) => `<li>${esc(a)}</li>`).join("")}</ul></div>`;

  const awards = `<ul class="awards">${d.awards
    .map((a) => `<li><img src="${award(a.icon)}" alt=""><span><b>${esc(a.title)}</b><small>${esc(a.issuer)}</small></span></li>`)
    .join("")}</ul>`;

  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8">
<title>${esc(d.name)} — CV</title>
<link rel="stylesheet" href="${font("manrope")}"><link rel="stylesheet" href="${font("oswald")}">
<style>
  @page { size: A4; margin: 12mm 13mm; }
  :root { --fg:#151a33; --fg2:#5b6078; --line:#d6d9e0; --canvas:#eef0f3; --surface:#fff; --lime:#d9ee8f; --danger:#ac3830; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font: 400 9.6pt/1.5 "Manrope Variable", sans-serif; color: var(--fg); background: #fff; }
  a { color: inherit; text-decoration: none; }
  h1, h2, h3, .display { font-family: "Oswald Variable", sans-serif; font-weight: 700; text-transform: uppercase; letter-spacing: .01em; line-height: 1.1; }

  .hero { background: var(--fg); color: var(--canvas); border-radius: 16px; padding: 9mm 9mm 8mm; display: grid; grid-template-columns: 1fr auto; gap: 8mm; }
  .hero h1 { font-size: 34pt; }
  .hero .role { margin-top: 2mm; font-weight: 600; font-size: 11pt; opacity: .85; }
  .hero .loc { margin-top: 1mm; font-size: 9pt; opacity: .7; }
  .hero .open { white-space: nowrap; display: inline-flex; align-items: center; gap: 2mm; margin-top: 5mm; background: var(--lime); color: #1b1b2a; border-radius: 999px; padding: 1.2mm 3.4mm; font-size: 8.4pt; font-weight: 700; }
  .hero .open i { width: 2.2mm; height: 2.2mm; border-radius: 50%; background: #2f9e44; }
  .contacts { display: grid; gap: 1.4mm; align-content: start; font-size: 8.6pt; }
  .contacts li { list-style: none; display: grid; grid-template-columns: 20mm auto; white-space: nowrap; }
  .contacts small { opacity: .6; font-size: 7.4pt; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; padding-top: .4mm; }
  .contacts a { font-weight: 600; }

  .summary { margin: 7mm 0 1mm; font-size: 11pt; line-height: 1.55; max-width: 165mm; }

  .sec { display: grid; grid-template-columns: 34mm 1fr; gap: 5mm; border-top: 1.5px solid var(--fg); padding-top: 3.6mm; margin-top: 5mm; }
  .sec h2 { font-size: 13pt; break-after: avoid; }
  .card, .sticker, ul.plain li { break-inside: avoid; }
  .job { display: grid; grid-template-columns: 30mm 1fr; gap: 4mm; padding-bottom: 3.6mm; margin-bottom: 3.6mm; border-bottom: 1px solid var(--line); break-inside: avoid; }
  .job:last-child { border-bottom: 0; margin-bottom: 0; padding-bottom: 0; }
  .period { font-weight: 700; font-size: 8.4pt; color: var(--fg2); padding-top: .8mm; font-variant-numeric: tabular-nums; }
  .job h3 { font-size: 12pt; }
  .place { color: var(--fg2); margin: .6mm 0 1.4mm; }
  .pill { display: inline-block; vertical-align: 2px; font: 700 6.6pt/1 "Manrope Variable", sans-serif; letter-spacing: .06em; background: var(--fg); color: var(--canvas); border-radius: 999px; padding: 1mm 2mm; }
  ul.dash li { list-style: none; position: relative; padding-left: 5mm; margin-top: .8mm; }
  ul.dash li::before { content: "—"; position: absolute; left: 0; color: var(--fg2); }

  .eyebrow { font-size: 7.4pt; font-weight: 700; text-transform: uppercase; letter-spacing: .08em; color: var(--fg2); margin-bottom: 1.2mm; }
  .cards { display: grid; grid-template-columns: 1fr 1fr; gap: 3mm; }
  .card { background: #f5f6f8; border: 1px solid var(--line); border-radius: 12px; padding: 3mm 3.6mm; }
  .cols { display: grid; grid-template-columns: 1fr 1fr; gap: 5mm; }
  ul.plain li { list-style: none; display: flex; flex-direction: column; margin-bottom: 1.8mm; }
  ul.plain span { color: var(--fg2); }
  .sticker { background: var(--lime); color: #1b1b2a; border-radius: 12px; padding: 3.6mm 4.4mm; }
  .sticker ul.dash li::before { color: inherit; opacity: .6; }
  .awards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 2.4mm; }
  .awards li { list-style: none; display: grid; grid-template-columns: 9mm 1fr; gap: 2.4mm; align-items: center; background: var(--fg); color: var(--canvas); border-radius: 12px; padding: 2.4mm 3.4mm; break-inside: avoid; }
  .awards img { width: 9mm; height: 11mm; object-fit: contain; }
  .awards b { display: block; font-size: 8.2pt; line-height: 1.3; }
  .awards small { display: block; font-size: 7.2pt; opacity: .7; margin-top: .6mm; }
</style></head><body>
<div class="page">
  <header class="hero">
    <div>
      <h1>${esc(d.name)}</h1>
      <p class="role">${esc(d.role)}</p>
      <p class="loc">${esc(d.location)}</p>
      <p class="open"><i></i>${esc(d.home.available)}</p>
    </div>
    <ul class="contacts">${contacts.map(([k, v, href]) => `<li><small>${esc(k!)}</small><a href="${esc(href!)}">${esc(v!)}</a></li>`).join("")}</ul>
  </header>
  <p class="summary">${esc(d.about.summary)}</p>
  ${section(d.about.experience, jobs)}
  ${section(d.about.skills, skills)}
  ${section(d.about.education, education)}
  ${section(d.about.availability, availability)}
  ${section(d.about.awards, awards)}
</div>
</body></html>`;
}

async function main() {
  const dir = mkdtempSync(join(tmpdir(), "cv-"));
  const browser = await chromium.launch();
  try {
    for (const locale of LOCALES) {
      const file = join(dir, `cv-${locale}.html`);
      writeFileSync(file, html(locale));
      const page = await browser.newPage();
      await page.goto(pathToFileURL(file).href, { waitUntil: "networkidle" });
      await page.evaluate(() => document.fonts.ready);
      const out = join(ROOT, "public", CONTACTS.cv[locale]);
      await page.pdf({ path: out, format: "A4", printBackground: true, preferCSSPageSize: true, tagged: true });
      console.log("wrote", out, `(${Math.round(readFileSync(out).length / 1024)} KB)`);
      await page.close();
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
