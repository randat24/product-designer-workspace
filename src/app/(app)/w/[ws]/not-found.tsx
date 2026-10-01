import { NotFoundState } from "@/shared/ui/error-state";
import { t } from "@/shared/i18n/uk";

/** A workspace or project that is gone or not shared with this account. */
export default function WorkspaceNotFound() {
  return <NotFoundState back={{ href: "/app", label: t.status.toProjects }} className="mx-auto px-6 py-24" />;
}
