import { Button, EntityChip, Panel } from "workspace-ui";

export const Card = () => (
  <Panel className="w-96">
    <div className="mb-2 flex items-center gap-2">
      <EntityChip type="insight" code="INS-012" />
      <span className="text-caption font-medium text-fg-secondary">5 джерел · 4 учасники</span>
    </div>
    <h3 className="text-heading font-semibold">Гості не довіряють оцінці часу очікування</h3>
    <p className="mt-2 text-fg-secondary">Після першого промаху з прогнозом гість перестає дивитися на таймер і питає хостес.</p>
  </Panel>
);

export const WithActions = () => (
  <Panel className="flex w-96 flex-col gap-4">
    <p className="text-body">У цьому проєкті ще немає інтерв'ю. Додайте перше або відкрийте демо-проєкт.</p>
    <div className="flex gap-3">
      <Button size="sm">+ Додати інтерв'ю</Button>
      <Button size="sm" variant="secondary">Відкрити демо</Button>
    </div>
  </Panel>
);
