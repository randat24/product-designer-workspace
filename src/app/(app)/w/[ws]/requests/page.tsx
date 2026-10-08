import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getWorkspaceBySlug } from "@/domains/projects";
import { REQUEST_FILTERS, REQUEST_SORTS, listRequests, type RequestFilter, type RequestSort } from "@/domains/requests/queries";
import { budgetLabel, label, labels } from "@/domains/requests/labels";
import { StatusBadge } from "@/domains/requests/status-badge";
import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/uk";
import { WorkspaceHeader, WorkspaceTabs } from "../workspace-header";

export const metadata: Metadata = { title: t.requests.title };

const date = (iso: string) => new Intl.DateTimeFormat("uk-UA", { day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));

export default async function RequestsPage({ params, searchParams }: {
  params: Promise<{ ws: string }>;
  searchParams: Promise<{ status?: string; sort?: string }>;
}) {
  const [{ ws }, sp] = await Promise.all([params, searchParams]);
  const workspace = await getWorkspaceBySlug(ws);
  if (!workspace) notFound();
  const filter: RequestFilter = (REQUEST_FILTERS as readonly string[]).includes(sp.status ?? "") ? (sp.status as RequestFilter) : "open";
  const sort: RequestSort = (REQUEST_SORTS as readonly string[]).includes(sp.sort ?? "") ? (sp.sort as RequestSort) : "new";
  const rows = await listRequests(workspace.id, filter, sort);
  const href = (p: { status?: string; sort?: string }) => {
    const q = new URLSearchParams({ status: p.status ?? filter, sort: p.sort ?? sort });
    return `/w/${ws}/requests?${q}`;
  };
  const r = t.requests;

  return (
    <div className="min-h-screen">
      <WorkspaceHeader current={workspace.slug} />
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-[clamp(18px,4vw,56px)] py-10">
        <WorkspaceTabs wsSlug={workspace.slug} workspaceId={workspace.id} current="requests" />
        <div className="flex flex-col gap-2">
          <h1 className="page-title">{r.title}</h1>
          <p className="max-w-prose text-fg-secondary">{r.lede}</p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <nav aria-label={r.statusLabel} className="flex flex-wrap gap-1.5">
            {REQUEST_FILTERS.map((f) => (
              <Link key={f} href={href({ status: f })} aria-current={f === filter ? "page" : undefined}
                className={cn("rounded-[4px] border px-3 py-1 text-sm font-semibold",
                  f === filter ? "border-fg bg-fg text-canvas" : "border-line text-fg-secondary hover:border-fg hover:text-fg")}>
                {r.filters[f]}
              </Link>
            ))}
          </nav>
          <nav aria-label={r.sort.label} className="flex items-center gap-2 text-sm">
            <span className="text-fg-secondary">{r.sort.label}:</span>
            {REQUEST_SORTS.map((s) => (
              <Link key={s} href={href({ sort: s })} aria-current={s === sort ? "true" : undefined}
                className={cn("whitespace-nowrap font-semibold", s === sort ? "text-fg underline underline-offset-4" : "text-fg-secondary hover:text-fg")}>
                {r.sort[s]}
              </Link>
            ))}
          </nav>
        </div>

        {rows.length === 0 ? (
          <p className="rounded-panel border border-dashed border-line p-7 text-center text-fg-secondary">
            {filter === "open" ? r.empty : r.emptyFilter}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {rows.map((row) => {
              const client = row.clients as { name: string; company: string | null } | null;
              return (
                <li key={row.id}>
                  <Link href={`/w/${ws}/requests/${row.code}`}
                    className="grid gap-x-6 gap-y-2 rounded-panel border border-line bg-surface p-4 transition-colors hover:border-fg md:grid-cols-[150px_minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)_auto] md:items-center">
                    <span className="flex flex-col">
                      <span className="font-mono text-sm font-semibold">{row.code}</span>
                      <span className="text-meta text-fg-secondary">{date(row.submitted_at)}</span>
                    </span>
                    <span className="flex min-w-0 flex-col">
                      <span className="truncate font-semibold">{row.project_name ?? r.noName}</span>
                      <span className="truncate text-sm text-fg-secondary">
                        {[client?.name, client?.company].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className="truncate text-sm">{labels("types", row.project_types, "uk").join(", ")}</span>
                    <span className="flex flex-col text-sm">
                      <span className="font-semibold">{budgetLabel({ range: row.budget_range, min: row.budget_min, max: row.budget_max, currency: row.budget_currency }, "uk")}</span>
                      <span className="text-fg-secondary">
                        {[label("start", row.start_preference, "uk"), row.has_deadline && row.deadline_date ? r.deadline(date(row.deadline_date)) : null].filter(Boolean).join(", ")}
                      </span>
                    </span>
                    <span className="flex items-center gap-2 md:justify-end">
                      <StatusBadge status={row.status} />
                      {row.archived_at && <span className="text-meta text-fg-secondary">{r.archived}</span>}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
