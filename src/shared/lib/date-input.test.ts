import { describe, expect, it } from "vitest";
import { addMonths, formatDateInput, parseDateInput } from "./date-input";

describe("parseDateInput", () => {
  it("reads day-first dates with dots, slashes or dashes, and ISO", () => {
    expect(parseDateInput("1.12.2026")).toBe("2026-12-01");
    expect(parseDateInput(" 01/12/2026 ")).toBe("2026-12-01");
    expect(parseDateInput("01-12-2026")).toBe("2026-12-01");
    expect(parseDateInput("2026-12-01")).toBe("2026-12-01");
  });
  it("rejects dates that do not exist and other text", () => {
    expect(parseDateInput("31.02.2026")).toBeNull();
    expect(parseDateInput("2026-02-30")).toBeNull();
    expect(parseDateInput("завтра")).toBeNull();
    expect(parseDateInput("")).toBeNull();
  });
});

describe("formatDateInput", () => {
  it("formats an ISO date for the locale", () => {
    expect(formatDateInput("2026-09-29", "uk")).toBe("29.09.2026");
    expect(formatDateInput("2026-09-29", "en")).toBe("29/09/2026");
    expect(formatDateInput("", "uk")).toBe("");
  });
});

describe("addMonths", () => {
  it("keeps the day inside a shorter month", () => {
    const d = addMonths(new Date(2026, 0, 31), 1);
    expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 1, 28]);
  });
});
