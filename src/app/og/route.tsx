import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { dict, isLocale, type Locale } from "@/site/content";
import { getCases } from "@/site/cases-source";
import { Signature } from "@/site/signature";

// Social preview images, 1200×630: /og?locale=uk (site card) and /og?locale=uk&case=<slug>.
// Rendered on demand and cached by the CDN for a day.

const STICKER: Record<string, string> = {
  "var(--s1)": "#f2a6ae", "var(--s2)": "#f6a94f", "var(--s3)": "#f7dc52", "var(--s4)": "#6fb9b9",
  "var(--s5)": "#d9ee8f", "var(--s6)": "#a99bf5", "var(--s7)": "#8fd3f2",
};
const INK = "#151a33";
const PAPER = "#eef0f3";

const fontDir = join(process.cwd(), "src/site/og/fonts");
const font = (file: string) => readFile(join(fontDir, file));

async function fonts() {
  const [ol, oc, ml, mc, bl, bc] = await Promise.all([
    font("Oswald-Bold-latin.ttf"), font("Oswald-Bold-cyrillic.ttf"),
    font("Manrope-Medium-latin.ttf"), font("Manrope-Medium-cyrillic.ttf"),
    font("Manrope-Bold-latin.ttf"), font("Manrope-Bold-cyrillic.ttf"),
  ]);
  return [
    { name: "Oswald", data: ol, weight: 700 as const, style: "normal" as const },
    { name: "Oswald", data: oc, weight: 700 as const, style: "normal" as const },
    { name: "Manrope", data: ml, weight: 500 as const, style: "normal" as const },
    { name: "Manrope", data: mc, weight: 500 as const, style: "normal" as const },
    { name: "Manrope", data: bl, weight: 700 as const, style: "normal" as const },
    { name: "Manrope", data: bc, weight: 700 as const, style: "normal" as const },
  ];
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const raw = params.get("locale") ?? "uk";
  const locale: Locale = isLocale(raw) ? raw : "uk";
  const d = dict(locale);
  const slug = params.get("case");
  // Cases unreadable right now: the generic card is better than no preview at all.
  const item = slug ? (await getCases(locale).catch(() => [])).find((c) => c.slug === slug) : undefined;
  const accent = item ? (STICKER[item.sticker] ?? "#f7dc52") : "#f7dc52";

  const image = new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: INK, color: PAPER, fontFamily: "Manrope" }}>
        <div style={{ width: 28, height: "100%", background: accent }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "64px 72px" }}>
          {item ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div style={{ display: "flex", gap: 12, fontSize: 26, fontWeight: 700, color: accent, textTransform: "uppercase", letterSpacing: 2 }}>
                {item.kind === "concept" ? d.project.concept : d.nav.work} · {item.year}
              </div>
              <div style={{ fontFamily: "Oswald", fontSize: item.title.length > 34 ? 76 : 92, lineHeight: 1, textTransform: "uppercase", maxWidth: 980 }}>
                {item.title}
              </div>
              <div style={{ fontSize: 30, fontWeight: 500, opacity: 0.8, maxWidth: 940, lineHeight: 1.35 }}>{item.summary}</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
              <div style={{ fontFamily: "Oswald", fontSize: 120, lineHeight: 0.95, textTransform: "uppercase" }}>{d.name}</div>
              <div style={{ fontSize: 40, fontWeight: 700, color: accent }}>{d.seo.ogRole}</div>
              <div style={{ fontSize: 30, fontWeight: 500, opacity: 0.8 }}>{d.seo.ogTopics}</div>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {item && <div style={{ fontFamily: "Oswald", fontSize: 34, textTransform: "uppercase" }}>{d.name}</div>}
              <div style={{ fontSize: 24, opacity: 0.7 }}>{item ? d.seo.ogRole : d.location}</div>
            </div>
            <div style={{ display: "flex", color: PAPER, width: 230, height: 122 }}>
              <Signature width={230} height={122} />
            </div>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, fonts: await fonts() },
  );
  image.headers.set("Cache-Control", "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800");
  return image;
}
