import { Button } from "workspace-ui";

export const Variants = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button>Створити проєкт</Button>
    <Button variant="secondary">Скасувати</Button>
    <Button variant="ghost">Докладніше</Button>
    <Button variant="danger">Прибрати</Button>
  </div>
);

export const Small = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button size="sm">+ Додати ціль</Button>
    <Button size="sm" variant="secondary">Пов'язати…</Button>
    <Button size="sm" variant="ghost">Згорнути</Button>
  </div>
);

export const Disabled = () => (
  <div className="flex flex-wrap items-center gap-3">
    <Button disabled>Зберегти</Button>
    <Button variant="secondary" disabled>Скасувати</Button>
  </div>
);
