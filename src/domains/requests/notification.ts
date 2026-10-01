// The e-mail about a new project request (pure, tested): just enough to recognise it and a link to open it.
// No e-mail address, phone, Telegram, answers or budget notes: those stay in the workspace.

import { budgetLabel, label, labels } from "./labels";
import type { RequestData } from "./schema";

export type NewRequestNotice = { subject: string; text: string; html: string };

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function buildNewRequestNotice(d: RequestData, code: string, openUrl: string): NewRequestNotice {
  const project = d.project.name ?? "Без названия";
  const rows: [string, string][] = [
    ["Номер", code],
    ["Клиент", d.contact.company ? `${d.contact.name} · ${d.contact.company}` : d.contact.name],
    ["Проект", project],
    ["Тип", labels("types", d.project.types.filter((x) => x !== "other"), "ru").concat(d.project.types.includes("other") ? ["Другое"] : []).join(", ")],
    ["Бюджет", budgetLabel({ range: d.budget.range, min: d.budget.min ?? null, max: d.budget.max ?? null, currency: d.budget.currency ?? null }, "ru")],
    ["Старт", label("start", d.budget.start, "ru")],
    ...(d.budget.has_deadline && d.budget.deadline_date ? [["Дедлайн", d.budget.deadline_date] as [string, string]] : []),
  ];
  const subject = `Новая заявка ${code}: ${project}`;
  const text = [...rows.map(([k, v]) => `${k}: ${v}`), "", `Открыть заявку: ${openUrl}`].join("\n");
  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#151a33">
<p style="font-size:18px;font-weight:700;margin:0 0 12px">Новая заявка на проект</p>
<table style="border-collapse:collapse">${rows
    .map(([k, v]) => `<tr><td style="padding:2px 16px 2px 0;color:#5b6078">${esc(k)}</td><td style="padding:2px 0">${esc(v)}</td></tr>`)
    .join("")}</table>
<p style="margin:20px 0 0"><a href="${esc(openUrl)}" style="display:inline-block;background:#151a33;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;font-weight:600">Открыть заявку</a></p>
</div>`;
  return { subject, text, html };
}
