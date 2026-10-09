import { ErrorState } from "workspace-ui";

export const LoadFailed = () => (
  <ErrorState error={Object.assign(new Error("Failed to load"), { digest: "3912840117" })} reset={() => {}}
    back={{ href: "#projects", label: "До проєктів" }} />
);

export const WithoutId = () => (
  <ErrorState error={new Error("Failed to load")} reset={() => {}} back={{ href: "#project", label: "Назад до проєкту" }} />
);
