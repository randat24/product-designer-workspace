import { redirect } from "next/navigation";
import { listMyWorkspaces } from "@/domains/projects";

/** Entry to the workspace tool: send the user to their first workspace. */
export default async function AppHome() {
  const workspaces = await listMyWorkspaces();
  const first = workspaces[0];
  if (!first) throw new Error("No workspace found for this user. Check the on_auth_user_created trigger.");
  redirect(`/w/${first.slug}`);
}
