import type { Metadata } from "next";
import "@fontsource-variable/manrope";
import "@fontsource-variable/oswald";
import "../globals.css";
import { t } from "@/shared/i18n/uk";
import { NetworkBanner } from "@/shared/ui/network";

// Root of the private workspace and its login: Ukrainian UI, never in search results.
// The public site has its own root layout in (site)/[locale].
export const toolMetadata: Metadata = {
  title: { default: t.app.name, template: `%s · ${t.app.name}` },
  robots: { index: false, follow: false, nocache: true },
};

export function ToolRoot({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <body>
        <NetworkBanner />
        {children}
      </body>
    </html>
  );
}
