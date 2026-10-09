import { Button, PageHeader } from "workspace-ui";

export const Basic = () => (
  <div className="w-[720px]">
    <PageHeader eyebrow="Restaurant App" title="Інсайти" lede="Висновки з досліджень, на які спираються можливості та рішення." />
  </div>
);

export const WithProgress = () => (
  <div className="w-[720px]">
    <PageHeader eyebrow="Етап 2 з 6" title="Дослідження" lede="План, учасники та інтерв'ю проєкту." progress={{ value: 64, caption: "етап заповнено" }} />
  </div>
);

export const WithStat = () => (
  <div className="w-[720px]">
    <PageHeader eyebrow="PAT-004" title="Гості йдуть, не дочекавшись столика" stat={{ value: 7, caption: "учасників згадали" }} />
  </div>
);

export const WithActions = () => (
  <div className="w-[720px]">
    <PageHeader title="Проєкти" lede="Усі проєкти простору.">
      <div className="mt-4 flex gap-3">
        <Button>Створити проєкт</Button>
        <Button variant="secondary">Відновити з копії</Button>
      </div>
    </PageHeader>
  </div>
);
