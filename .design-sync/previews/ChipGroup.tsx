import { useState } from "react";
import { ChipGroup } from "workspace-ui";

const SEVERITY = [
  { value: "low", label: "Низька" },
  { value: "medium", label: "Середня" },
  { value: "high", label: "Висока" },
  { value: "critical", label: "Критична" },
] as const;

export const Medium = () => {
  const [v, setV] = useState<string>("high");
  return <ChipGroup label="Серйозність" options={SEVERITY} value={v} onChange={setV} />;
};

export const Small = () => {
  const [v, setV] = useState<string>("medium");
  return <ChipGroup label="Серйозність" size="sm" options={SEVERITY} value={v} onChange={setV} />;
};

export const Disabled = () => (
  <ChipGroup label="Серйозність" options={SEVERITY} value="low" onChange={() => {}} disabled />
);
