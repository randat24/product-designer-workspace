import { Textarea } from "workspace-ui";

export const Filled = () => (
  <div className="w-96">
    <Textarea aria-label="Опис" rows={3}
      defaultValue="Гості не бачать, скільки чекати на столик, і йдуть до конкурентів ще до розмови з хостес." />
  </div>
);

export const Placeholder = () => (
  <div className="w-96"><Textarea aria-label="Нотатка" rows={3} placeholder="Що ви помітили під час інтерв'ю?" /></div>
);
