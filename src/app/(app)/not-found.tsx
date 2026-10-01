import { NotFoundState } from "@/shared/ui/error-state";
import { t } from "@/shared/i18n/uk";

/** A workspace that is gone or not shared with this account (its layout calls notFound()). */
export default function ToolNotFound() {
  return (
    <main className="px-6 py-24">
      <NotFoundState back={{ href: "/app", label: t.status.toProjects }} className="mx-auto" />
    </main>
  );
}
