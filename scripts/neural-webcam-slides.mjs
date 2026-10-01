// Brand slides for the Neural WebCam case, built only from the real logo SVG (public/cases/neural-webcam/logo.svg).
// Run from the repo root: node scripts/neural-webcam-slides.mjs  → public/cases/neural-webcam/*.webp
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const OUT = process.argv[2] ?? "public/cases/neural-webcam";
const svg = fs.readFileSync("public/cases/neural-webcam/logo.svg", "utf8");
const ds = [...svg.matchAll(/ d="([^"]*)"/g)].map((m) => m[1]);
const [WORDS, SYMBOL, DOT] = ds;
const subs = WORDS.split(/(?=M)/).filter(Boolean);
// Subpaths of the wordmark: the lower line (y > 2700) is «WebCam», the rest is «Neural».
const WEBCAM_IDX = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]);
const NEURAL = subs.filter((_, i) => !WEBCAM_IDX.has(i)).join("");
const WEBCAM = subs.filter((_, i) => WEBCAM_IDX.has(i)).join("");

const FONT = path.resolve("node_modules/@fontsource-variable/manrope/files/manrope-latin-wght-normal.woff2");
const FONT_B64 = fs.readFileSync(FONT).toString("base64");
const BLUE = "#2459B4", SKY = "#71A1F2", NAVY = "#0B1A3A", INK = "#0F172A", PAPER = "#F4F7FD", LINE = "#DCE4F3";

let gid = 0;
/** One logo part set as an inline SVG; fill "grad" uses the logo's own radial gradient. */
function art(parts, { viewBox, fill = "grad", wordFill, height, width, extra = "" }) {
  const id = `g${gid++}`;
  const f = (p) => (p === "words" && wordFill ? wordFill : fill === "grad" ? `url(#${id})` : fill);
  const el = {
    symbol: `<path fill-rule="evenodd" clip-rule="evenodd" d="${SYMBOL}" fill="${f("symbol")}"/>`,
    dot: `<path d="${DOT}" fill="${f("dot")}"/>`,
    neural: `<path fill-rule="evenodd" clip-rule="evenodd" d="${NEURAL}" fill="${f("words")}"/>`,
    webcam: `<path fill-rule="evenodd" clip-rule="evenodd" d="${WEBCAM}" fill="${f("words")}"/>`,
  };
  const size = `${height ? `height="${height}"` : ""} ${width ? `width="${width}"` : ""}`;
  return `<svg viewBox="${viewBox}" ${size} xmlns="http://www.w3.org/2000/svg" style="display:block;overflow:visible">
    <defs><radialGradient id="${id}" cx="0" cy="0" r="1" gradientTransform="matrix(2899.8 -3648.96 1617.8 12420.3 152.057 3969.94)" gradientUnits="userSpaceOnUse">
      <stop offset="0.163352" stop-color="${SKY}"/><stop offset="0.575677" stop-color="${BLUE}"/></radialGradient></defs>
    ${parts.map((p) => el[p]).join("")}${extra}</svg>`;
}
const VB = { full: "150 -30 2250 3040", symbol: "150 -30 2230 2000", words: "600 2110 1790 890", neural: "600 2110 1790 520" };
const full = (o = {}) => art(["symbol", "dot", "neural", "webcam"], { viewBox: VB.full, ...o });
const symbol = (o = {}) => art(["symbol", "dot"], { viewBox: VB.symbol, ...o });
const words = (o = {}) => art(["neural", "webcam"], { viewBox: VB.words, ...o });
const neural = (o = {}) => art(["neural"], { viewBox: VB.neural, ...o });

const page = (body, { bg = "#fff", fg = INK } = {}) => `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:Manrope;src:url(data:font/woff2;base64,${FONT_B64}) format("woff2");font-weight:200 800}
*{box-sizing:border-box;margin:0}
body{width:1600px;height:1000px;background:${bg};color:${fg};font-family:Manrope,sans-serif;overflow:hidden;position:relative}
.eyebrow{position:absolute;top:56px;left:72px;font-size:15px;letter-spacing:.14em;text-transform:uppercase;font-weight:700;opacity:.55}
.lbl{font-size:15px;font-weight:600;opacity:.6}
h2{font-size:52px;font-weight:800;letter-spacing:-.02em;line-height:1.05}
p.lead{font-size:24px;line-height:1.45;opacity:.75;max-width:620px}
.card{border-radius:24px;display:flex;align-items:center;justify-content:center}
</style></head><body>${body}</body></html>`;

const slides = {};

// 01 — Brand overview: the big logo on white.
slides["01-overview"] = page(`
  <div class="eyebrow">01 / Brand overview</div>
  <div style="position:absolute;left:150px;top:110px">${full({ height: 780 })}</div>
  <div style="position:absolute;left:860px;top:300px;display:flex;flex-direction:column;gap:28px">
    <h2>Digital platform for live interaction and media</h2>
    <p class="lead">A platform built around communication, content and interaction between people. The identity had to feel technological, approachable and recognisable across a large product ecosystem.</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap">${["Human", "Connection", "Live", "Video", "Network", "Digital"].map((t) => `<span style="border:1.5px solid ${LINE};border-radius:999px;padding:8px 18px;font-size:17px;font-weight:600;color:${BLUE}">${t}</span>`).join("")}</div>
  </div>`);

// 02 — Concept: user + camera + node = the mark.
const glyph = (inner, label, sub) => `<div style="display:flex;flex-direction:column;align-items:center;gap:22px;width:250px">
  <div class="card" style="width:220px;height:220px;background:${PAPER}">${inner}</div>
  <div style="text-align:center"><div style="font-size:24px;font-weight:800;letter-spacing:.08em">${label}</div><div class="lbl" style="font-size:17px;margin-top:6px">${sub}</div></div></div>`;
const op = (t) => `<div style="font-size:64px;font-weight:300;color:${BLUE};margin-top:-70px">${t}</div>`;
slides["02-concept"] = page(`
  <div class="eyebrow">02 / Concept</div>
  <h2 style="position:absolute;left:72px;top:130px;max-width:1100px">A person, a camera, a connection</h2>
  <div style="position:absolute;inset:260px 72px 60px;display:flex;align-items:center;justify-content:space-between">
    ${glyph(`<svg width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="44" fill="none" stroke="${BLUE}" stroke-width="16"/></svg>`, "USER", "a person, a profile")}
    ${op("+")}
    ${glyph(`<svg width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="48" fill="none" stroke="${BLUE}" stroke-width="10"/><circle cx="60" cy="60" r="22" fill="${BLUE}"/></svg>`, "CAMERA", "live and visual communication")}
    ${op("+")}
    ${glyph(`<svg width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="26" fill="${BLUE}"/></svg>`, "NODE", "a connection in the network")}
    ${op("=")}
    <div style="display:flex;flex-direction:column;align-items:center;gap:22px;width:300px">
      <div class="card" style="width:300px;height:300px;background:${PAPER}">${symbol({ height: 200 })}</div>
      <div style="font-size:24px;font-weight:800">Neural WebCam</div>
    </div>
  </div>`);

// 03 — Construction: circles, axes, the dot as the module X, clear space.
const C = { x: 1478.5, y: 858 }, R_OUT = 858, R_IN = 550, DOT_C = { x: 367.5, y: 194 }, X = 378;
const guides = `
  <g fill="none" stroke="#E0457B" stroke-width="7" stroke-dasharray="26 18">
    <circle cx="${C.x}" cy="${C.y}" r="${R_OUT}"/><circle cx="${C.x}" cy="${C.y}" r="${R_IN}"/>
    <circle cx="${DOT_C.x}" cy="${DOT_C.y}" r="${X / 2}"/>
    <line x1="${C.x}" y1="-260" x2="${C.x}" y2="2220"/><line x1="-120" y1="${C.y}" x2="2600" y2="${C.y}"/>
    <line x1="${DOT_C.x}" y1="${DOT_C.y}" x2="${C.x}" y2="${C.y}"/>
    <line x1="420" y1="1942" x2="2540" y2="1942"/>
  </g>
  <g fill="none" stroke="${BLUE}" stroke-width="6" opacity=".55">
    <rect x="${178 - X}" y="${0 - X}" width="${2353 - 178 + 2 * X}" height="${1942 + 2 * X}"/>
  </g>`;
slides["03-construction"] = page(`
  <div class="eyebrow">03 / Construction</div>
  <div style="position:absolute;left:90px;top:120px">${art(["symbol", "dot"], { viewBox: `${178 - X - 40} ${-X - 40} ${2353 - 178 + 2 * X + 80} ${1942 + 2 * X + 80}`, height: 820, extra: guides })}</div>
  <div style="position:absolute;left:1080px;top:200px;display:flex;flex-direction:column;gap:30px;width:440px">
    <h2 style="font-size:40px">X = the diameter of the dot</h2>
    ${[["Ring", "outer Ø ≈ 4.5X, stroke ≈ 0.8X"], ["Base", "follows the ring's lower arc, closes the shape"], ["Dot", "on the line to the ring's centre, upper left"], ["Clear space", "X on every side"], ["Wordmark", "set under the symbol, X below the base"]]
      .map(([k, v]) => `<div style="border-top:1.5px solid ${LINE};padding-top:14px"><div style="font-size:20px;font-weight:800">${k}</div><div class="lbl" style="font-size:18px;margin-top:4px">${v}</div></div>`).join("")}
    <div style="display:flex;gap:18px;align-items:center;font-size:15px;font-weight:600;opacity:.7"><span style="width:36px;border-top:4px dashed #E0457B"></span>geometry<span style="width:36px;border-top:4px solid ${BLUE};opacity:.6"></span>clear space</div>
  </div>`);

// 04 — Versions.
const tile = (inner, label, bg = PAPER, fg = INK) => `<div style="display:flex;flex-direction:column;gap:12px">
  <div class="card" style="height:330px;background:${bg};border:1.5px solid ${bg === "#fff" ? LINE : bg}">${inner}</div><div class="lbl" style="color:${fg}">${label}</div></div>`;
const horizontal = (o = {}, h = 120) => `<div style="display:flex;align-items:center;gap:${h * 0.22}px">${symbol({ height: h, ...o })}${words({ height: h * 0.62, ...o })}</div>`;
slides["04-versions"] = page(`
  <div class="eyebrow">04 / Logo versions</div>
  <div style="position:absolute;inset:110px 72px 56px;display:grid;grid-template-columns:repeat(4,1fr);gap:28px 24px">
    ${tile(full({ height: 250 }), "Primary")}
    ${tile(horizontal({}, 96), "Horizontal")}
    ${tile(symbol({ height: 190 }), "Symbol — UI, avatar, favicon")}
    ${tile(`<div style="display:flex;align-items:center;gap:22px">${symbol({ height: 84 })}${neural({ height: 44 })}</div>`, "Compact — no «WebCam» for small sizes")}
    ${tile(full({ height: 250, fill: INK }), "Monochrome", "#fff")}
    ${tile(full({ height: 250, fill: "#fff" }), "Inverse", BLUE)}
    ${tile(full({ height: 250, wordFill: "#fff" }), "Dark mode", NAVY)}
    ${tile(horizontal({ fill: "#fff" }, 96), "Horizontal inverse", NAVY)}
  </div>`);

// 05 — Colour.
const sw = (bg, name, hex, note, fg = "#fff") => `<div style="display:flex;flex-direction:column;gap:14px">
  <div style="height:600px;border-radius:24px;background:${bg};border:1.5px solid ${LINE};display:flex;align-items:flex-end;padding:22px;color:${fg};font-size:22px;font-weight:800">${hex}</div>
  <div style="font-size:20px;font-weight:800">${name}</div><div class="lbl" style="font-size:16px;margin-top:-8px">${note}</div></div>`;
slides["05-color"] = page(`
  <div class="eyebrow">05 / Colour</div>
  <div style="position:absolute;inset:130px 72px 60px;display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr 1fr;gap:24px">
    ${sw(`linear-gradient(100deg, ${SKY} 12%, ${BLUE} 62%)`, "Signature gradient", "#71A1F2 → #2459B4", "the logo's own fill")}
    ${sw(BLUE, "Primary blue", "#2459B4", "technological, calm")}
    ${sw(SKY, "Light blue", "#71A1F2", "highlights, states", INK)}
    ${sw(NAVY, "Navy", "#0B1A3A", "dark theme surface")}
    ${sw(PAPER, "Paper", "#F4F7FD", "light theme surface", INK)}
  </div>`);

// 06 — Responsive sizes: the symbol at real pixel sizes, on light and dark.
const sizes = [16, 24, 32, 64, 128];
slides["06-sizes"] = page(`
  <div class="eyebrow">06 / Responsive testing</div>
  <div style="position:absolute;left:72px;top:150px;right:72px;display:flex;flex-direction:column;gap:36px">
    ${[["#fff", {}, INK], [NAVY, {}, "#fff"], [BLUE, { fill: "#fff" }, "#fff"]].map(([bg, o, fg]) => `
      <div style="display:flex;align-items:flex-end;gap:70px;background:${bg};border:1.5px solid ${bg === "#fff" ? LINE : bg};border-radius:24px;padding:36px 60px;height:220px">
        ${sizes.map((s) => `<div style="display:flex;flex-direction:column;align-items:center;gap:14px;color:${fg}">${symbol({ height: s, ...o })}<span style="font-size:15px;font-weight:700;opacity:.65">${s} px</span></div>`).join("")}
        <div style="margin-left:auto;display:flex;flex-direction:column;align-items:center;gap:14px;color:${fg}">${horizontal(o, 40)}<span style="font-size:15px;font-weight:700;opacity:.65">horizontal · 40 px</span></div>
      </div>`).join("")}
  </div>`);

// 07 — Product usage: generic interface contexts (no real screens or content of the product).
const bar = (w, o = 1) => `<div style="height:12px;width:${w}px;border-radius:6px;background:${INK};opacity:${0.12 * o}"></div>`;
const frame = (title, inner, style = "") => `<div style="display:flex;flex-direction:column;gap:12px"><div style="border-radius:22px;overflow:hidden;border:1.5px solid ${LINE};height:340px;${style}">${inner}</div><div class="lbl">${title}</div></div>`;
slides["07-usage"] = page(`
  <div class="eyebrow">07 / Product usage</div>
  <div style="position:absolute;inset:110px 72px 56px;display:grid;grid-template-columns:1.25fr 1fr 1fr;gap:28px 24px">
    ${frame("Website header", `
      <div style="display:flex;align-items:center;gap:26px;padding:22px 28px;border-bottom:1.5px solid ${LINE};background:#fff">${horizontal({}, 44)}<div style="margin-left:auto;display:flex;gap:18px">${bar(60)}${bar(70)}${bar(54)}</div><div style="width:110px;height:40px;border-radius:12px;background:${BLUE}"></div></div>
      <div style="padding:34px 28px;display:flex;flex-direction:column;gap:16px;background:#fff;height:100%">${bar(380, 2)}${bar(300, 2)}${bar(220)}<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:10px">${[0, 1, 2].map(() => `<div style="height:90px;border-radius:14px;background:${PAPER}"></div>`).join("")}</div></div>`)}
    ${frame("Authorization", `
      <div style="height:100%;background:${PAPER};display:flex;align-items:center;justify-content:center"><div style="width:270px;background:#fff;border-radius:18px;padding:26px;display:flex;flex-direction:column;align-items:center;gap:14px;box-shadow:0 14px 40px -18px rgba(11,26,58,.35)">${symbol({ height: 54 })}${bar(150, 2)}<div style="width:100%;height:38px;border-radius:10px;border:1.5px solid ${LINE}"></div><div style="width:100%;height:38px;border-radius:10px;border:1.5px solid ${LINE}"></div><div style="width:100%;height:40px;border-radius:10px;background:${BLUE}"></div></div></div>`)}
    ${frame("Mobile, dark theme", `
      <div style="height:100%;background:${NAVY};display:flex;align-items:center;justify-content:center"><div style="width:190px;height:300px;border-radius:30px;border:6px solid #1F2E52;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px">${full({ height: 120, wordFill: "#fff" })}<div style="width:120px;height:34px;border-radius:10px;background:${BLUE};margin-top:14px"></div></div></div>`)}
    ${frame("Profile and messenger", `
      <div style="height:100%;background:#fff;display:flex">
        <div style="width:96px;border-right:1.5px solid ${LINE};display:flex;flex-direction:column;align-items:center;gap:22px;padding-top:22px">${symbol({ height: 40 })}${[0, 1, 2, 3].map(() => `<div style="width:30px;height:30px;border-radius:9px;background:${PAPER}"></div>`).join("")}</div>
        <div style="flex:1;padding:24px;display:flex;flex-direction:column;gap:16px">${[0, 1, 2, 3].map((i) => `<div style="display:flex;align-items:center;gap:14px"><div style="position:relative;width:46px;height:46px;border-radius:50%;background:${PAPER}">${i === 0 ? `<span style="position:absolute;right:-2px;top:-2px;width:14px;height:14px;border-radius:50%;background:${BLUE};border:3px solid #fff"></span>` : ""}</div><div style="display:flex;flex-direction:column;gap:8px">${bar(150, 2)}${bar(100)}</div></div>`).join("")}</div></div>`)}
    ${frame("Notification", `
      <div style="height:100%;background:${PAPER};display:flex;align-items:center;justify-content:center"><div style="width:300px;background:#fff;border-radius:18px;padding:18px;display:flex;gap:14px;align-items:center;box-shadow:0 14px 40px -18px rgba(11,26,58,.35)"><div style="width:48px;height:48px;border-radius:13px;background:${BLUE};display:flex;align-items:center;justify-content:center">${symbol({ height: 30, fill: "#fff" })}</div><div style="display:flex;flex-direction:column;gap:8px"><div style="font-size:15px;font-weight:800">Neural WebCam</div>${bar(170)}</div></div></div>`)}
    ${frame("Favicon and app icon", `
      <div style="height:100%;background:#fff;display:flex;flex-direction:column">
        <div style="background:${PAPER};padding:16px 18px 0;display:flex"><div style="background:#fff;border-radius:12px 12px 0 0;padding:12px 16px;display:flex;align-items:center;gap:10px">${symbol({ height: 16 })}<span style="font-size:14px;font-weight:700">Neural WebCam</span></div></div>
        <div style="flex:1;display:flex;align-items:center;justify-content:center;gap:22px">${[96, 64, 40].map((s) => `<div style="width:${s}px;height:${s}px;border-radius:${s * 0.24}px;background:${BLUE};display:flex;align-items:center;justify-content:center">${symbol({ height: s * 0.62, fill: "#fff" })}</div>`).join("")}</div></div>`)}
  </div>`);

// 00 — Cover: the horizontal logo on white, placed so it reads in the card's crop (top-left 80%).
slides["00-cover"] = page(`
  <div style="position:absolute;left:150px;top:230px">${horizontal({}, 330)}</div>
  <div style="position:absolute;left:156px;top:660px;font-size:30px;font-weight:600;color:${BLUE};opacity:.8">Brand identity · Product design</div>`);

fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
for (const [name, html] of Object.entries(slides)) {
  await p.setContent(html, { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready);
  const png = await p.screenshot();
  await sharp(png).resize(2400, 1500).webp({ quality: 86 }).toFile(path.join(OUT, `${name}.webp`));
  console.log(name);
}
await b.close();
