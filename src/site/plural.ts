import type { Locale } from "./content";

/** Three forms of a counted word: one, few, many («1 запис, 2 записи, 5 записів»; English uses one and many). */
export type Forms = readonly [string, string, string];

export function plural(locale: Locale, n: number, forms: Forms): string {
  if (locale === "en") return n === 1 ? forms[0] : forms[2];
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return forms[0];
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return forms[1];
  return forms[2];
}

/** «9 спостережень»: the number with its word. */
export const count = (locale: Locale, n: number, forms: Forms) => `${n} ${plural(locale, n, forms)}`;
