import type { ReactNode } from "react";

/** Entity detail page: content + trace panel (right on wide screens, below otherwise). */
export function EntityLayout({ children, aside }: { children: ReactNode; aside: ReactNode }) {
  return (
    <div className="grid max-w-6xl gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
      <div className="min-w-0">{children}</div>
      <div className="xl:sticky xl:top-6 xl:self-start">{aside}</div>
    </div>
  );
}
