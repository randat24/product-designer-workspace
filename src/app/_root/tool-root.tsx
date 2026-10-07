import type { Metadata } from "next";
import "../fonts.css";
import "../globals.css";
import { t } from "@/shared/i18n/uk";
import { NetworkBanner } from "@/shared/ui/network";
import { THEME_INIT_SCRIPT } from "@/shared/ui/theme-switch";

// Root of the private workspace and its login: Ukrainian UI, never in search results.
// The public site has its own root layout in (site)/[locale].
export const toolMetadata: Metadata = {
  title: { default: t.app.name, template: `%s · ${t.app.name}` },
  robots: { index: false, follow: false, nocache: true },
};

export function ToolRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk" suppressHydrationWarning>
      <head>
        {/* Before paint: the saved light/dark choice (shared with the site), so the page never flashes the other theme. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body>
        <NetworkBanner />
        {children}
      </body>
    </html>
  );
}
