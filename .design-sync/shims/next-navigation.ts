// design-sync shim: next/navigation outside a Next.js runtime. Navigation is a no-op; nothing throws.
const router = {
  push: (_href: string) => {},
  replace: (_href: string) => {},
  refresh: () => {},
  back: () => {},
  forward: () => {},
  prefetch: (_href: string) => {},
};

export const useRouter = () => router;
export const usePathname = () => "/";
export const useSearchParams = () => new URLSearchParams();
export const useParams = () => ({});
export const redirect = (_href: string) => {};
export const notFound = () => {};
