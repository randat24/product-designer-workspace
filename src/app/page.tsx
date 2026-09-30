import { headers } from "next/headers";
import { redirect } from "next/navigation";

/** The public site lives at /uk and /en; pick by the browser's language (Ukrainian by default). */
export default async function Root() {
  const lang = (await headers()).get("accept-language") ?? "";
  const prefersEnglish = /^en\b/i.test(lang.trim()) && !/\buk\b/i.test(lang);
  redirect(prefersEnglish ? "/en" : "/uk");
}
