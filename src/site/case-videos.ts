import type { Locale } from "./content";

/**
 * Screen recordings of a case: a walkthrough above the project pages and short clips inside the story chapters.
 * They are files in public/, not part of the published snapshot (case_studies.content holds text and pictures
 * only), so they are kept here by slug and stay on the page when the case is published again.
 */
export type CaseVideo = {
  /** H.264, listed first: smaller than the VP9 encode at the same look and plays in Safari and every Chrome. */
  mp4: string;
  /** VP9 fallback for Chromium builds without H.264 (open-source Chromium, the e2e browser). */
  webm: string;
  /** A frame of the clip, shown before it loads and instead of it when the visitor prefers less motion. */
  poster: string;
  width: number;
  height: number;
  caption: Record<Locale, string>;
};

/** Story chapters a clip can sit in (ids of the sections in CaseStoryView). */
export type ClipSection = "research" | "insights" | "competitors" | "opportunities" | "flow" | "screens" | "decisions";

type CaseVideos = { walkthrough?: CaseVideo; clips?: Partial<Record<ClipSection, CaseVideo>> };

const workspace = (file: string, caption: Record<Locale, string>): CaseVideo => ({
  mp4: `/cases/designer-workspace/video/${file}.mp4`,
  webm: `/cases/designer-workspace/video/${file}.webm`,
  poster: `/cases/designer-workspace/video/${file}.webp`,
  width: 1440,
  height: 900,
  caption,
});

// Recorded from the tool with the demo project, the UI in English like the case screenshots (used for both locales).
const VIDEOS: Record<string, CaseVideos> = {
  "designer-workspace": {
    walkthrough: workspace("walkthrough", {
      uk: "Новий проєкт і бриф, цитата в патерн, інсайт з джерелами, пошук рішення з доказами. 42 секунди",
      en: "A new project and its brief, a quote into a pattern, an insight with its sources, search to a decision with evidence. 42 seconds",
    }),
    clips: {
      flow: workspace("new-project", {
        uk: "Новий проєкт — одне поле; бриф зберігається сам, готовність росте",
        en: "A new project is one field; the brief saves itself and readiness grows",
      }),
      insights: workspace("synthesis", {
        uk: "Цитата перетягується в колонку, з колонки — інсайт: усі картки стають його джерелами",
        en: "A quote is dragged into a column, the column becomes an insight: every card becomes its source",
      }),
      decisions: workspace("decision", {
        uk: "Пошук веде до рішення, а рішення — до болю, інсайту й цитат, на яких воно стоїть",
        en: "Search leads to a decision, and the decision to the pain point, insight and quotes it stands on",
      }),
    },
  },
};

export function caseVideos(slug: string): CaseVideos {
  return VIDEOS[slug] ?? {};
}
