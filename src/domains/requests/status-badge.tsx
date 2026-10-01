import { cn } from "@/shared/lib/cn";
import { t } from "@/shared/i18n/ru";
import type { Enums } from "@/types/database";

const TONE: Record<Enums<"request_status">, string> = {
  submitted: "bg-fg text-canvas",
  reviewing: "bg-warning/15 text-warning",
  qualified: "bg-success/15 text-success",
  accepted: "bg-success text-on-status",
  declined: "bg-subtle text-fg-secondary",
  converted: "border border-fg text-fg",
};

export function StatusBadge({ status }: { status: Enums<"request_status"> }) {
  return (
    <span className={cn("inline-flex h-6 items-center rounded-full px-2.5 text-[12px] font-semibold whitespace-nowrap", TONE[status])}>
      {t.requests.status[status]}
    </span>
  );
}
