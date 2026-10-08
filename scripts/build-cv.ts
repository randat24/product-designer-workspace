// Builds the PDF CVs (public/cv/hennadii-fedorov-cv-{uk,en}.pdf) from the site content, in the site's SIGNAL style
// (the light theme, for print): Manrope for all text, headings Medium in sentence case with tight tracking,
// IBM Plex Mono for eyebrows, periods and labels; ink #20221F on white with a canvas header band, 1px rules instead
// of cards, 4px chips, one orange accent (a 2px rule, the section numbers in accent-text), the availability dot in
// success green, the medals drawn in ink. Fonts come from src/app/fonts.css, the same @fontsource files the site uses.
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

const EXTRA: Record<Locale, { cv: string; phone: string; portfolio: string }> = {
  uk: { cv: "Резюме", phone: "Телефон", portfolio: "Портфоліо" },
  en: { cv: "Curriculum vitae", phone: "Phone", portfolio: "Portfolio" },
};

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const bare = (url: string) => url.replace(/^https?:\/\//, "").replace(/^www\./, "");
const FONTS = pathToFileURL(join(ROOT, "src/app/fonts.css")).href;
/** The medal artwork inline, one tone in the text colour (as on the site), instead of the lavender of the files. */
const medal = (icon: string) =>
  readFileSync(join(ROOT, "public/awards", `${icon}.svg`), "utf8")
    .replace(/fill="#BABED6"/gi, 'fill="currentColor"')
    .replace("<svg ", '<svg aria-hidden="true" ');

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

  let n = 0;
  const section = (title: string, body: string, cls = "") => {
    n += 1;
    return `<section class="sec ${cls}"><h2 class="eyebrow"><span class="num">${String(n).padStart(2, "0")}</span> / ${esc(title)}</h2>${body}</section>`;
  };
  /** A ruled row: mono label on the left, content on the right (the About page's period | role grid). */
  const row = (label: string, body: string, cls = "") =>
    `<div class="row ${cls}"><p class="label">${label}</p><div>${body}</div></div>`;

  const jobs = d.jobs
    .map((j) =>
      row(
        esc(j.period),
        `<h3>${esc(j.title)}${j.military ? ` <span class="chip">${esc(d.about.serviceTitle)}</span>` : ""}</h3>
         <p class="sub">${esc(j.place)}</p>
         <ul class="dash">${(j.details ?? j.points).map((p) => `<li>${esc(p)}</li>`).join("")}</ul>`,
        "job",
      ),
    )
    .join("");

  const skills = d.skills.map((s) => row(esc(s.group), `<p>${esc(s.items)}</p>`, "skill")).join("");

  const education =
    d.education.map((e) => row(esc(e.year), `<p class="strong">${esc(e.title)}</p><p class="sub">${esc(e.place)}</p>`)).join("") +
    row(
      esc(d.about.languages),
      `<p>${d.languages.map((l) => `<span class="strong">${esc(l.name)}</span> <span class="sub">· ${esc(l.level)}</span>`).join("<span class=\"gap\"></span>")}</p>`,
    );

  const availability = `<ul class="dots">${d.availability.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>`;

  const awards = `<ul class="awards">${d.awards
    .map((a) => `<li><span class="medal">${medal(a.icon)}</span><span><b>${esc(a.title)}</b><small>${esc(a.issuer)}</small></span></li>`)
    .join("")}</ul>`;

  return `<!doctype html><html lang="${locale}"><head><meta charset="utf-8">
<title>${esc(d.name)} — CV</title>
<link rel="stylesheet" href="${FONTS}">
<style>
  @page { size: A4; margin: 11mm 13mm 12mm; }
  /* SIGNAL light theme (src/app/globals.css). */
  :root { --canvas:#F3F1EB; --surface:#FFFFFF; --fg:#20221F; --fg2:#62645D; --line:#D0D1C8; --accent:#FF6B35; --accent-text:#AF360B; --success:#27603B;
          --mono: "IBM Plex Mono", ui-monospace, Menlo, monospace; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font: 400 9.4pt/1.5 "Manrope", sans-serif; letter-spacing: -0.005em; color: var(--fg); background: var(--surface); }
  a { color: inherit; text-decoration: none; }
  ul { list-style: none; }
  .eyebrow, .label, .contacts small, .chip { font-family: var(--mono); font-weight: 400; text-transform: uppercase; letter-spacing: .075em; }

  /* Header: a canvas band with the orange signal rule on top. */
  .hero { background: var(--canvas); border-top: 2px solid var(--accent); border-radius: 0 0 8px 8px; padding: 5.5mm 8mm 6mm; }
  .hero-top { display: flex; justify-content: space-between; align-items: baseline; gap: 6mm; }
  .eyebrow { font-size: 7.2pt; line-height: 1.5; color: var(--fg2); }
  .open { display: inline-flex; align-items: center; gap: 2mm; font-size: 8.4pt; font-weight: 500; }
  .open i { width: 1.9mm; height: 1.9mm; border-radius: 50%; background: var(--success); }
  .hero h1 { margin-top: 4mm; font-size: 36pt; font-weight: 500; line-height: 1.02; letter-spacing: -0.05em; word-spacing: .12em; }
  .hero .role { margin-top: 2.6mm; font: 400 8.4pt/1.5 var(--mono); text-transform: uppercase; letter-spacing: .075em; }
  .hero .role span { color: var(--fg2); }
  .contacts { margin-top: 5mm; padding-top: 3mm; border-top: 1px solid var(--line); display: grid; grid-template-columns: repeat(3, auto); justify-content: space-between; gap: 2.4mm 6mm; font-size: 8.6pt; }
  .contacts li { display: flex; flex-direction: column; gap: .3mm; white-space: nowrap; }
  .contacts small { font-size: 6.6pt; color: var(--fg2); }
  .contacts a { font-weight: 600; }

  .summary { margin: 5.5mm 0 0; font-size: 11.5pt; font-weight: 500; line-height: 1.45; letter-spacing: -0.02em; max-width: 172mm; }

  /* Sections: a rule above, the mono eyebrow «01 / …», then ruled rows on a label | content grid. */
  .sec { margin-top: 5.5mm; border-top: 1px solid var(--fg); padding-top: 2.4mm; }
  .sec > h2 { margin-bottom: .4mm; break-after: avoid; }
  .num { color: var(--accent-text); }
  .row { display: grid; grid-template-columns: 34mm 1fr; gap: 5mm; padding: 1.9mm 0; border-top: 1px solid var(--line); break-inside: avoid; }
  .sec > h2 + .row, .sec > h2 + ul > li:first-child { border-top: 0; }
  .label { font-size: 7.2pt; line-height: 1.5; color: var(--fg2); padding-top: .9mm; font-variant-numeric: tabular-nums; }
  .job { padding: 2.8mm 0; }
  .job h3 { font-size: 12.5pt; font-weight: 500; line-height: 1.25; letter-spacing: -0.03em; }
  .sub { color: var(--fg2); }
  .job .sub { margin: .4mm 0 1.4mm; }
  .strong { font-weight: 600; }
  .gap { display: inline-block; width: 6mm; }
  .chip { display: inline-block; vertical-align: 2.5px; margin-left: 1mm; font-size: 6.4pt; line-height: 1; letter-spacing: .075em; color: var(--fg); border: 1px solid var(--line); border-radius: 4px; padding: .9mm 1.6mm; }
  ul.dash li { position: relative; padding-left: 4.6mm; margin-top: .7mm; }
  ul.dash li::before { content: "—"; position: absolute; left: 0; color: var(--fg2); }
  .skill .label { color: var(--fg); }

  ul.dots { columns: 2; column-gap: 8mm; padding-top: 1.4mm; }
  ul.dots li { position: relative; padding-left: 4.4mm; margin-bottom: 1mm; break-inside: avoid; }
  ul.dots li::before { content: ""; position: absolute; left: .4mm; top: 1.85mm; width: 1.5mm; height: 1.5mm; border-radius: 50%; background: var(--success); }

  .awards { display: grid; grid-template-columns: 1fr 1fr; column-gap: 8mm; }
  .awards li { display: grid; grid-template-columns: 6mm 1fr; gap: 3mm; align-items: center; padding: 1.8mm 0; border-top: 1px solid var(--line); break-inside: avoid; }
  .awards li:nth-child(-n+2) { border-top: 0; }
  .medal { display: block; color: var(--fg); }
  .medal svg { display: block; width: 5.2mm; height: auto; }
  .awards b { display: block; font-size: 8.8pt; font-weight: 600; line-height: 1.3; }
  .awards small { display: block; margin-top: .4mm; font-size: 8pt; color: var(--fg2); }
</style></head><body>
  <header class="hero">
    <div class="hero-top">
      <p class="eyebrow">${esc(x.cv)}</p>
      <p class="open"><i></i>${esc(d.home.available)}</p>
    </div>
    <h1>${esc(d.name)}</h1>
    <p class="role">${esc(d.role)} <span>· ${esc(d.location)}</span></p>
    <ul class="contacts">${contacts.map(([k, v, href]) => `<li><small>${esc(k!)}</small><a href="${esc(href!)}">${esc(v!)}</a></li>`).join("")}</ul>
  </header>
  <p class="summary">${esc(d.about.summary)}</p>
  ${section(d.about.experience, jobs)}
  ${section(d.about.skills, skills)}
  ${section(d.about.education, education)}
  ${section(d.about.availability, availability)}
  ${section(d.about.awards, awards)}
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
