// Typed dates in the tool and the site's form: dd.mm.yyyy (uk) or dd/mm/yyyy (en) ⇄ ISO YYYY-MM-DD.

export type DateLocale = "uk" | "en";

const SEP: Record<DateLocale, string> = { uk: ".", en: "/" };

export const pad = (n: number) => String(n).padStart(2, "0");
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const fromIso = (s: string): Date | null => {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.getMonth() === Number(m[2]) - 1 ? d : null;
};
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
export const addMonths = (d: Date, n: number) => {
  const last = new Date(d.getFullYear(), d.getMonth() + n + 1, 0).getDate();
  return new Date(d.getFullYear(), d.getMonth() + n, Math.min(d.getDate(), last));
};

/** Text as typed → ISO, or null when it is not a real date. Accepts dd.mm.yyyy, dd/mm/yyyy, dd-mm-yyyy, yyyy-mm-dd. */
export function parseDateInput(text: string): string | null {
  const t = text.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return fromIso(t) ? t : null;
  const m = /^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/.exec(t);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return d.getMonth() === Number(m[2]) - 1 && d.getDate() === Number(m[1]) ? iso(d) : null;
}

export function formatDateInput(value: string, locale: DateLocale): string {
  const d = fromIso(value);
  if (!d) return "";
  const s = SEP[locale];
  return `${pad(d.getDate())}${s}${pad(d.getMonth() + 1)}${s}${d.getFullYear()}`;
}
