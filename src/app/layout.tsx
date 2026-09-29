import type { Metadata } from "next";
import "@fontsource-variable/inter";
import "./globals.css";
import { t } from "@/shared/i18n/ru";

export const metadata: Metadata = { title: { default: t.app.name, template: `%s · ${t.app.name}` } };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
