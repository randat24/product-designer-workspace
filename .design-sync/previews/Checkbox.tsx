import { Checkbox } from "workspace-ui";

export const WithLabel = () => (
  <div className="flex flex-col gap-3">
    <label className="flex items-center gap-2 text-body"><Checkbox defaultChecked /> Згода учасника отримана</label>
    <label className="flex items-center gap-2 text-body"><Checkbox /> Запис розмови дозволено</label>
    <label className="flex items-center gap-2 text-body text-fg-secondary"><Checkbox disabled /> Недоступно для глядача</label>
  </div>
);
