import { useEffect, useRef } from "react";
import { ConfirmDelete } from "workspace-ui";

const remove = async () => ({ ok: true }) as never;

export const Armed = () => {
  const preview = useRef<HTMLDivElement>(null);
  useEffect(() => { preview.current?.querySelector<HTMLButtonElement>('button[type="submit"]')?.click(); }, []);
  return (
    <div ref={preview}>
      <ConfirmDelete action={remove} fields={{ id: "ins-012" }} label="Видалити інсайт" confirm="Точно видалити?" />
    </div>
  );
};

export const Idle = () => (
  <ConfirmDelete action={remove} fields={{ id: "ins-012" }} label="Видалити інсайт" confirm="Точно видалити?" />
);

export const InFormFooter = () => (
  <div className="flex w-96 items-center justify-between border-t border-line pt-4">
    <span className="text-meta text-fg-secondary">Зміни зберігаються автоматично</span>
    <ConfirmDelete action={remove} fields={{ type: "interview", id: "int-004" }} label="Видалити інтерв'ю" confirm="Точно видалити?" />
  </div>
);
