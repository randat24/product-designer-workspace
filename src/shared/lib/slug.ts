// Cyrillic (ru + uk) → latin, then kebab-case. "Додаток для ресторанів" → "dodatok-dlia-restoraniv"
const MAP: Record<string, string> = {
  а: "a", б: "b", в: "v", г: "g", ґ: "g", д: "d", е: "e", є: "ie", ё: "e", ж: "zh", з: "z", и: "i", і: "i",
  ї: "i", й: "i", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f",
  х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ъ: "", ы: "y", ь: "", э: "e", ю: "iu", я: "ia",
};

export function slugify(input: string, maxLength = 48): string {
  const latin = input
    .toLowerCase()
    .split("")
    .map((ch) => MAP[ch] ?? ch)
    .join("")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "");
  const slug = latin.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, maxLength).replace(/-+$/g, "");
  return slug.length >= 2 ? slug : `project-${Math.random().toString(36).slice(2, 6)}`;
}
