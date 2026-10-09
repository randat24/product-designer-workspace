import { IconButton } from "workspace-ui";
import { Pencil, Trash2, Link2 } from "lucide-react";

export const Default = () => (
  <div className="flex items-center gap-2">
    <IconButton label="Редагувати"><Pencil aria-hidden className="size-4" /></IconButton>
    <IconButton label="Пов'язати"><Link2 aria-hidden className="size-4" /></IconButton>
    <IconButton label="Видалити" tone="danger"><Trash2 aria-hidden className="size-4" /></IconButton>
  </div>
);

export const Small = () => (
  <div className="flex items-center gap-2">
    <IconButton size="sm" label="Редагувати"><Pencil aria-hidden className="size-4" /></IconButton>
    <IconButton size="sm" label="Видалити" tone="danger"><Trash2 aria-hidden className="size-4" /></IconButton>
  </div>
);
