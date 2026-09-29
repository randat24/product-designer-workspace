import { notFound } from "next/navigation";
import { getWorkspaceBySlug } from "@/domains/projects";

export default async function WorkspaceLayout({ children, params }: { children: React.ReactNode; params: Promise<{ ws: string }> }) {
  const { ws } = await params;
  const workspace = await getWorkspaceBySlug(ws);
  if (!workspace) notFound(); // missing or not a member (RLS hides it)
  return children;
}
