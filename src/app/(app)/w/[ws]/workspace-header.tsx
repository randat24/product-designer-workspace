import Link from "next/link";
import { Globe } from "lucide-react";
import { getCurrentUser, listMyWorkspaces } from "@/domains/projects";
import { countNewRequests } from "@/domains/requests/queries";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/uk";
import { WorkspaceSwitcher } from "./workspace-switcher";

/** The workspace bar (brand, switcher, way back to the site, account) shared by the projects and requests pages. */
export async function WorkspaceHeader({ current }: { current: string }) {
  const [workspaces, user] = await Promise.all([listMyWorkspaces(), getCurrentUser()]);
  return (
    <header className="flex h-14 items-center justify-between gap-4 bg-rail px-[clamp(18px,4vw,56px)] text-rail-fg">
      <span className="flex min-w-0 items-center gap-4">
        <span className="font-display text-lg leading-[1.1] font-bold whitespace-nowrap uppercase">{t.auth.brand}</span>
        <WorkspaceSwitcher current={current} workspaces={workspaces} />
      </span>
      <form action="/auth/signout" method="post" className="flex items-center gap-3 text-meta">
        {/* The tool lives next to the portfolio; this is the way back to it. */}
        <Link href="/uk" className="hit inline-flex items-center gap-1.5 font-semibold opacity-80 hover:opacity-100 hover:underline">
          <Globe aria-hidden className="size-4 shrink-0" />
          <span className="sr-only sm:not-sr-only">{t.auth.toSite}</span>
        </Link>
        <Link href="/account" className="hidden opacity-70 hover:opacity-100 hover:underline sm:inline">{user?.email}</Link>
        <button className="rounded-control border border-rail-fg/30 px-2.5 py-1 hover:border-rail-fg/70">{t.auth.signOut}</button>
      </form>
    </header>
  );
}

/** «Проекты · Заявки» with the number of new requests. */
export async function WorkspaceTabs({ wsSlug, workspaceId, current }: { wsSlug: string; workspaceId: string; current: "projects" | "requests" }) {
  const fresh = await countNewRequests(workspaceId);
  const tabs = [
    { key: "projects", href: `/w/${wsSlug}`, label: t.requests.navProjects, badge: 0 },
    { key: "requests", href: `/w/${wsSlug}/requests`, label: t.requests.nav, badge: fresh },
  ] as const;
  return (
    <nav aria-label={t.requests.nav} className="flex gap-1.5">
      {tabs.map((tab) => (
        <Link key={tab.key} href={tab.href} aria-current={tab.key === current ? "page" : undefined}
          className={cn(
            "inline-flex items-center gap-2 rounded-full border-[1.5px] px-4 py-1.5 text-sm font-semibold",
            tab.key === current ? "border-fg bg-fg text-canvas" : "border-line text-fg-secondary hover:border-fg hover:text-fg",
          )}>
          {tab.label}
          {tab.badge > 0 && (
            <span className="rounded-full bg-accent-hover px-1.5 text-[12px] leading-5 text-on-accent" aria-label={t.requests.newCount(tab.badge)}>
              {tab.badge}
            </span>
          )}
        </Link>
      ))}
    </nav>
  );
}
