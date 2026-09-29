export const PLATFORMS = [
  { value: "ios", label: "iOS" },
  { value: "android", label: "Android" },
  { value: "web", label: "Web" },
  { value: "desktop", label: "Desktop" },
] as const;

export const PROJECT_STATUSES = [
  { value: "active", label: "В работе" },
  { value: "paused", label: "На паузе" },
  { value: "done", label: "Завершён" },
] as const;
