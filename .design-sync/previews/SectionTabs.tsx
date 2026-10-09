import { SectionTabs } from "workspace-ui";

const TABS = [
  { key: "plan", href: "#plan", label: "План" },
  { key: "participants", href: "#participants", label: "Учасники" },
  { key: "interviews", href: "#interviews", label: "Інтерв'ю" },
  { key: "guides", href: "#guides", label: "Гайди" },
];

export const FirstTab = () => <SectionTabs label="Розділи дослідження" tabs={TABS} current="plan" />;

export const MiddleTab = () => <SectionTabs label="Розділи дослідження" tabs={TABS} current="interviews" />;
