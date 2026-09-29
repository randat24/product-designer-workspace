import { notFound } from "next/navigation";
import { getProjectBySlug, getWorkspaceBySlug } from "@/domains/projects";
import { TracePanel } from "@/domains/trace";
import { Sidebar } from "./sidebar";

/** Three-column project shell: sidebar · main · trace panel (docs/IA.md §1). */
export default async function ProjectLayout({ children, params }: {
  children: React.ReactNode;
  params: Promise<{ ws: string; project: string }>;
}) {
  const { ws, project: slug } = await params;
  const workspace = await getWorkspaceBySlug(ws);
  if (!workspace) notFound();
  const project = await getProjectBySlug(workspace.id, slug);
  if (!project) notFound();

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-[232px_minmax(0,1fr)] xl:grid-cols-[232px_minmax(0,1fr)_300px]">
      <Sidebar wsSlug={workspace.slug} wsName={workspace.name} projectSlug={project.slug} projectName={project.name} />
      <main className="min-w-0 px-6 py-6 lg:px-10">{children}</main>
      <div className="hidden border-l border-line bg-surface xl:block">
        {/* Entity pages pass their entity here from Phase 2 on. */}
        <TracePanel />
      </div>
    </div>
  );
}
