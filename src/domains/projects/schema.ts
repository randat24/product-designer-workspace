import { z } from "zod";
import { t } from "@/shared/i18n/ru";

export { PLATFORMS } from "./constants";

export const createProjectSchema = z.object({
  workspaceId: z.uuid(),
  name: z.string().trim().min(1, { error: t.workspace.nameRequired }).max(120),
  description: z.string().trim().max(2000).optional().transform((v) => v || null),
  platforms: z.array(z.enum(["ios", "android", "web", "desktop"])).default([]),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  projectId: z.uuid(),
  name: z.string().trim().min(1, { error: t.workspace.nameRequired }).max(120),
  description: z.string().trim().max(2000).optional().transform((v) => v || null),
  platforms: z.array(z.enum(["ios", "android", "web", "desktop"])).default([]),
  status: z.enum(["active", "paused", "done"]),
});
