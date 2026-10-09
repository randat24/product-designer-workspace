// design-sync shim: next/link outside a Next.js runtime renders the plain anchor it would produce.
import { forwardRef, type AnchorHTMLAttributes, type ReactNode } from "react";

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  href: string | { pathname?: string };
  prefetch?: boolean | null;
  replace?: boolean;
  scroll?: boolean;
  children?: ReactNode;
};

const Link = forwardRef<HTMLAnchorElement, Props>(function Link({ href, prefetch, replace, scroll, ...p }, ref) {
  return <a ref={ref} href={typeof href === "string" ? href : href.pathname ?? "#"} {...p} />;
});

export default Link;
