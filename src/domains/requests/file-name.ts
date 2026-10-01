/** File name of the brief: Project-Brief-{name}-{YYYY-MM-DD}.pdf, Latin letters only (Cyrillic is transliterated). */
const UK: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ye", ж: "zh", з: "z", и: "y", і: "i", ї: "yi", й: "y",
  к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "kh", ц: "ts", ч: "ch",
  ш: "sh", щ: "shch", ь: "", ю: "yu", я: "ya", ы: "y", э: "e", ё: "yo", ъ: "",
};

export function briefFileName(projectName: string | null, code: string, submittedAt: string): string {
  const translit = (projectName ?? "")
    .split("")
    .map((ch) => {
      const lower = ch.toLowerCase();
      const t = UK[lower];
      if (t === undefined) return ch;
      return ch === lower ? t : t.charAt(0).toUpperCase() + t.slice(1);
    })
    .join("");
  const base = translit
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return `Project-Brief-${base || code}-${submittedAt.slice(0, 10)}.pdf`;
}
