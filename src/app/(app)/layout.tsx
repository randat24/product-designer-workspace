import { ToolRoot, toolMetadata } from "../_root/tool-root";

export const metadata = toolMetadata;

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ToolRoot>{children}</ToolRoot>;
}
