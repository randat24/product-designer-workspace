import type { Locale } from "./content";

/** The owner's photo (public/about): the whole frame for the About page, a 4:5 crop for the home page and search. */
export const PHOTO = {
  wide: { src: "/about/hennadii-fedorov.webp", width: 1088, height: 608 },
  portrait: { src: "/about/hennadii-fedorov-portrait.webp", width: 486, height: 608 },
  alt: {
    uk: "Геннадій Федоров за столиком кав'ярні, з чашкою кави",
    en: "Hennadii Fedorov at a café table with a cup of coffee",
  } satisfies Record<Locale, string>,
} as const;
