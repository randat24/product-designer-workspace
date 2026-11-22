import { dict, type Locale } from "@/site/content";
import { getCases } from "@/site/cases-source";
import { getSiteProfile } from "@/site/profile-source";
import { applyProfile } from "@/site/site-profile";
import { absoluteUrl } from "@/site/seo";
import { aboutMarkdown, caseMarkdown, homeMarkdown } from "@/site/agents/markdown";
import { agentResponse } from "@/site/agents/source";

// /llms-full.txt: the whole portfolio in one Markdown file for agents that read once instead of following links
// (the llms.txt convention): home, About and every published case study in full, English first, then Ukrainian.
// Sample cases are left out, as in /llms.txt and the sitemap.
export const revalidate = 3600;

/** Lower every heading one level, so the pages nest under their part of the file. */
const nest = (md: string) => md.replace(/^(#{1,5}) /gm, "#$1 ");

async function part(locale: Locale): Promise<string> {
  const d = applyProfile(dict(locale), await getSiteProfile(locale));
  const cases = (await getCases(locale)).filter((c) => !c.sample);
  return [homeMarkdown(locale, d, cases), aboutMarkdown(locale, d), ...cases.map((c) => caseMarkdown(locale, dict(locale), c))]
    .map(nest)
    .join("\n---\n\n");
}

export async function GET() {
  const en = dict("en");
  const body = [
    `# ${en.name} — ${en.role} (full text)`,
    "",
    `> Everything on ${absoluteUrl("/")} in one file: profile, services, experience and every published case study. The short index is ${absoluteUrl("/llms.txt")}.`,
    "",
    "# English",
    "",
    await part("en"),
    "",
    "# Українська",
    "",
    await part("uk"),
    "",
  ].join("\n");
  return agentResponse(body, "text/markdown");
}
