import { Input } from "workspace-ui";

export const Filled = () => (
  <div className="w-80"><Input aria-label="Назва проєкту" defaultValue="Restaurant App" /></div>
);

export const Placeholder = () => (
  <div className="w-80"><Input aria-label="Пошук" placeholder="Пошук за кодом або назвою" /></div>
);

export const Disabled = () => (
  <div className="w-80"><Input aria-label="Адреса" defaultValue="restaurant-app" disabled /></div>
);
