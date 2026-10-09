import { Field, Input, Section, Textarea } from "workspace-ui";

export const FormSection = () => (
  <div className="w-[480px]">
    <Section id="product" title="Продукт">
      <Field label="Назва" htmlFor="product-name"><Input id="product-name" defaultValue="Restaurant App" /></Field>
      <Field label="Що це і для кого" htmlFor="product-about">
        <Textarea id="product-about" rows={3} defaultValue="Застосунок для гостей ресторану: черга, бронювання і передзамовлення в одному місці." />
      </Field>
    </Section>
  </div>
);
