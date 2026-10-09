import { ConfirmIconButton } from "workspace-ui";

export const InRow = () => (
  <div className="flex w-80 items-center justify-between rounded-panel border border-line bg-surface px-3 py-2">
    <span className="text-body">Чи зручно бронювати телефоном?</span>
    <ConfirmIconButton label="Видалити питання" confirm="Видалити?" onConfirm={() => {}}
      className="inline-flex size-8 items-center justify-center rounded-control text-fg-secondary hover:bg-subtle hover:text-danger" />
  </div>
);

export const Disabled = () => (
  <div className="flex w-80 items-center justify-between rounded-panel border border-line bg-surface px-3 py-2">
    <span className="text-body text-fg-secondary">Питання з гайду (лише перегляд)</span>
    <ConfirmIconButton label="Видалити питання" confirm="Видалити?" onConfirm={() => {}} disabled
      className="inline-flex size-8 items-center justify-center rounded-control text-fg-secondary opacity-50" />
  </div>
);
