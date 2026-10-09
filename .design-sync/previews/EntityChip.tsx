import { EntityChip } from "workspace-ui";

export const Groups = () => (
  <div className="flex flex-wrap items-center gap-2">
    <EntityChip type="interview" code="INT-004" title="Розмова з адміністратором зали" />
    <EntityChip type="insight" code="INS-012" title="Гості не довіряють оцінці часу" />
    <EntityChip type="pain_point" code="PP-007" />
    <EntityChip type="opportunity" code="OPP-003" />
    <EntityChip type="user_flow" code="FL-002" />
    <EntityChip type="screen" code="SCR-018" />
    <EntityChip type="design_decision" code="DEC-005" />
  </div>
);

export const TraceChain = () => (
  <div className="flex flex-wrap items-center gap-1.5 text-fg-secondary">
    <EntityChip type="quote" code="Q-031" /> →
    <EntityChip type="insight" code="INS-012" /> →
    <EntityChip type="opportunity" code="OPP-003" /> →
    <EntityChip type="screen" code="SCR-018" />
  </div>
);
