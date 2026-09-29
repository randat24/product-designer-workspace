"use client";

import { useRouter } from "next/navigation";

export function WorkspaceSwitcher({ current, workspaces }: { current: string; workspaces: { slug: string; name: string }[] }) {
  const router = useRouter();
  if (workspaces.length < 2) {
    return <span className="text-sm font-semibold">{workspaces.find((w) => w.slug === current)?.name}</span>;
  }
  return (
    <select aria-label="Пространство" value={current} onChange={(e) => router.push(`/w/${e.target.value}`)}
      className="h-8 rounded-md bg-transparent px-1 text-sm font-semibold hover:bg-subtle">
      {workspaces.map((w) => <option key={w.slug} value={w.slug}>{w.name}</option>)}
    </select>
  );
}
