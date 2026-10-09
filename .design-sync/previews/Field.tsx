import { Field, Input, Select } from "workspace-ui";

export const WithInput = () => (
  <div className="w-80">
    <Field label="Назва проєкту" htmlFor="name"><Input id="name" defaultValue="Restaurant App" /></Field>
  </div>
);

export const WithError = () => (
  <div className="w-80">
    <Field label="Адреса проєкту" htmlFor="slug" error="Така адреса вже зайнята в цьому просторі">
      <Input id="slug" defaultValue="restaurant-app" aria-invalid aria-describedby="slug-error" />
    </Field>
  </div>
);

export const WithSelect = () => (
  <div className="w-80">
    <Field label="Платформа" htmlFor="platform">
      <Select id="platform" defaultValue="ios">
        <option value="web">Web</option>
        <option value="ios">iOS</option>
        <option value="android">Android</option>
      </Select>
    </Field>
  </div>
);
