import { PageSkeleton } from "@/shared/ui/page-skeleton";

// Inside the project layout: the navigation rail stays, only the page area shows the skeleton.
export default function Loading() {
  return <PageSkeleton />;
}
