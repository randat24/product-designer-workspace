import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/uk";
import type { Enums } from "@/types/database";

const TONE: Record<Enums<"request_status">, string> = {
  submitted: "bg-fg text-canvas",
  reviewing: "bg-warning/15 text-warning",
  qualified: "bg-success/15 text-success",
  accepted: "bg-success text-on-status",
  declined: "bg-subtle text-fg-secondary",
  converted: "border border-control text-fg",
};

export function StatusBadge({ status }: { status: Enums<"request_status"> }) {
  return (
    <span className={cn("inline-flex h-6 items-center rounded-[4px] px-2.5 text-[12px] font-semibold whitespace-nowrap", TONE[status])}>
      {t.requests.status[status]}
    </span>
  );
}
