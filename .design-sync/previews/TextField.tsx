import { useState } from "react";
import { TextField } from "workspace-ui";

export const Filled = () => {
  const [v, setV] = useState("Скоротити час від входу до столика до двох хвилин.");
  return <div className="w-96"><TextField id="goal" label="Мета продукту" value={v} readOnly={false} onChange={setV} /></div>;
};

export const WithHint = () => {
  const [v, setV] = useState("");
  return (
    <div className="w-96">
      <TextField id="audience" label="Аудиторія" hint="Хто користується продуктом і в якій ситуації?" value={v} readOnly={false} onChange={setV} />
    </div>
  );
};

export const FromClient = () => (
  <div className="w-96">
    <TextField id="problem" label="Проблема" badge="зі слів клієнта"
      value="Гості скаржаться на чергу у вихідні, бронювання телефоном не встигаємо приймати." readOnly onChange={() => {}} />
  </div>
);
