import { PageSkeleton } from "@/shared/ui/page-skeleton";

// Projects list and the first load of a project (its own loading.tsx covers pages inside it).
export default function Loading() {
  return (
    <div className="min-h-screen">
      <div className="h-14 bg-rail" aria-hidden="true" />
      <div className="px-[clamp(18px,4vw,56px)] pt-8">
        <PageSkeleton rows={4} />
      </div>
    </div>
  );
}
