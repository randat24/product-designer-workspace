export const PLATFORMS = [
  { value: "ios", label: "iOS" },
  { value: "android", label: "Android" },
  { value: "web", label: "Web" },
  { value: "desktop", label: "Desktop" },
] as const;

export const PROJECT_STATUSES = [
  { value: "active", label: "У роботі" },
  { value: "paused", label: "На паузі" },
  { value: "done", label: "Завершено" },
] as const;
