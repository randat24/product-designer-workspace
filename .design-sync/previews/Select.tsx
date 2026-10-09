import { Select } from "workspace-ui";

export const Medium = () => (
  <div className="w-64">
    <Select aria-label="Статус" defaultValue="review">
      <option value="draft">Чернетка</option>
      <option value="review">На погодженні</option>
      <option value="published">Опубліковано</option>
    </Select>
  </div>
);

export const Small = () => (
  <div className="w-48">
    <Select size="sm" aria-label="Тип кроку" defaultValue="screen">
      <option value="screen">Екран</option>
      <option value="decision">Розгалуження</option>
      <option value="end">Кінець</option>
    </Select>
  </div>
);

export const Disabled = () => (
  <div className="w-64">
    <Select aria-label="Роль" defaultValue="viewer" disabled>
      <option value="viewer">Глядач</option>
      <option value="editor">Редактор</option>
    </Select>
  </div>
);
