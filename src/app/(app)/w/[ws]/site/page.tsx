import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { getMyRole, getWorkspaceBySlug } from "@/domains/projects";
import { getSiteProfileForEditor } from "@/domains/site-profile/queries";
import { SITE_LOCALES } from "@/domains/site-profile/locales";
import { ProfileEditor, type ProfileDraft } from "@/domains/site-profile/profile-editor";
import { dict } from "@/site/content";
import { profileFromDictionary } from "@/site/site-profile";
import { t } from "@/shared/i18n/uk";
import { WorkspaceHeader, WorkspaceTabs } from "../workspace-header";

export const metadata: Metadata = { title: t.siteProfile.title };

export default async function SiteProfilePage({ params }: { params: Promise<{ ws: string }> }) {
  const { ws } = await params;
  const workspace = await getWorkspaceBySlug(ws);
  if (!workspace) notFound();
  const role = await getMyRole(workspace.id);
  const isOwner = role === "owner";
  const { profile, isSite } = isOwner ? await getSiteProfileForEditor(workspace.id) : { profile: {}, isSite: false };
  // What the site shows now: the stored fields over the text from the code.
  const drafts = Object.fromEntries(
    SITE_LOCALES.map((l) => [l, { ...profileFromDictionary(dict(l)), ...profile[l] } satisfies ProfileDraft]),
  ) as Record<(typeof SITE_LOCALES)[number], ProfileDraft>;
  const s = t.siteProfile;

  return (
    <div className="min-h-screen">
      <WorkspaceHeader current={workspace.slug} />
      <main className="mx-auto flex max-w-4xl flex-col gap-8 px-[clamp(18px,4vw,56px)] py-10">
        <WorkspaceTabs wsSlug={workspace.slug} workspaceId={workspace.id} current="site" />
        <div className="flex flex-col gap-2">
          <h1 className="page-title">{s.title}</h1>
          <p className="max-w-prose text-fg-secondary">{s.lede}</p>
          <p className="max-w-prose text-meta text-fg-secondary">{s.fallback}</p>
          <Link href="/uk/about" target="_blank" className="inline-flex w-fit items-center gap-1.5 text-meta font-semibold underline underline-offset-4">
            {s.view}<ExternalLink aria-hidden className="size-4" />
          </Link>
        </div>
        {!isOwner ? (
          <p className="rounded-panel border-[1.5px] border-dashed border-line p-7 text-center text-fg-secondary">{s.ownerOnly}</p>
        ) : (
          <>
            {!isSite && <p role="note" className="max-w-prose rounded-panel border border-warning p-4 text-meta">{s.notSite}</p>}
            <ProfileEditor workspaceId={workspace.id} drafts={drafts} canEdit />
          </>
        )}
      </main>
    </div>
  );
}
