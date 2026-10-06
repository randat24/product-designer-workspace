// Product case study: a long, editorial case built from typed sections (roles, architecture, flows,
// monetization, brand…). Each section carries its own heading, so one language of a case is one object.
// It lives in the published snapshot next to the rest of the case (see src/site/content.ts → Case.product).

import type { GalleryItem } from "./content";

export type TrustIcon = "age" | "identity" | "security" | "privacy" | "gdpr" | "scam" | "payment" | "access";
export type BrandShape = "circle" | "base" | "dot";

type Base = { id: string; title: string; lede?: string };

export type ProductSection = Base & (
  | { kind: "overview"; body: string[]; facts: { label: string; value: string }[] }
  | { kind: "role"; areas: string[] }
  | { kind: "challenge"; body: string[]; behaviors: { who: string; goal: string }[] }
  | { kind: "ecosystem"; center: string; nodes: string[] }
  | { kind: "roles"; items: { name: string; summary: string; can: string[] }[] }
  | { kind: "ia"; groups: { title: string; items: string[] }[] }
  | { kind: "flows"; items: { title: string; steps: string[] }[] }
  | { kind: "monetization"; chain: string[]; actions: string[]; models: { title: string; body: string }[] }
  | { kind: "principles"; items: { title: string; body: string }[] }
  /** Real product screens only (Figma or the live product); the section is left out until there are some. */
  | { kind: "screens"; items: GalleryItem[] }
  | { kind: "checklist"; body: string[]; items: string[] }
  | { kind: "system"; body: string[]; groups: { title: string; items: string[] }[] }
  /** `image` may be missing while the block is being written in the editor; the page then shows the block without it. */
  | { kind: "brand"; body: string[]; parts: { shape: BrandShape; title: string; meaning: string }[]; formula: string; image?: GalleryItem }
  | { kind: "timeline"; steps: { title: string; body: string }[] }
  | { kind: "figure"; body: string[]; images: GalleryItem[] }
  | { kind: "trust"; items: { icon: TrustIcon; title: string; body: string }[] }
  | { kind: "outcome"; body: string[] }
);

export type ProductStory = {
  /** Disciplines under the title: Product Design, UI/UX, Brand Identity. */
  disciplines: string[];
  /** A short note under the hero, e.g. that the product later continued under another brand. */
  note?: string;
  /** Label of the sticky contents. */
  contents: string;
  sections: ProductSection[];
};
