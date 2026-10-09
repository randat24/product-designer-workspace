import { useEffect, useRef, useState } from "react";
import { DateField } from "workspace-ui";

export const Filled = () => {
  const [v, setV] = useState("2026-10-14");
  return <div className="w-64"><DateField id="interview-date" value={v} onChange={setV} locale="uk" /></div>;
};

export const Empty = () => {
  const [v, setV] = useState("");
  return <div className="w-64"><DateField id="deadline" value={v} onChange={setV} locale="uk" /></div>;
};

export const Large = () => {
  const [v, setV] = useState("2026-11-03");
  return <div className="w-72"><DateField id="start" value={v} onChange={setV} locale="uk" size="lg" /></div>;
};

export const Invalid = () => {
  const [v, setV] = useState("2026-10-14");
  return <div className="w-64"><DateField id="bad-date" value={v} onChange={setV} locale="uk" invalid /></div>;
};

export const OpenCalendar = () => {
  const preview = useRef<HTMLDivElement>(null);
  const [v, setV] = useState("2026-10-14");
  useEffect(() => {
    preview.current?.querySelector<HTMLButtonElement>('button[aria-haspopup="dialog"]')?.click();
    requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo({ top: 0 })));
  }, []);
  // Keep the absolutely positioned calendar inside the sync card's overflow clip.
  return (
    <div ref={preview} className="w-64 pb-96">
      <DateField id="open-calendar" value={v} onChange={setV} locale="uk" />
    </div>
  );
};
