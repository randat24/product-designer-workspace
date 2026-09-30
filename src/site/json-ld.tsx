import { jsonLdScript } from "./seo";

/** Server-rendered JSON-LD; the content is escaped in jsonLdScript(). */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }} />;
}
