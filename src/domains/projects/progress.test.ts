import { describe, expect, it } from "vitest";
import { countsFromRow, stageProgress, type ProgressCounts } from "./progress";

const zero = { done: 0, total: 0 };
const empty: ProgressCounts = {
  brief: { done: 0, total: 7 }, competitorsAssessed: 0, research: { conducted: 0, target: null },
  synthesis: zero, insights: zero, painPoints: zero, opportunities: 0, flows: zero, screens: zero, decisions: zero,
};

describe("stageProgress", () => {
  it("is 0 everywhere for a new project (no division by zero)", () => {
    expect(Object.values(stageProgress(empty)).every((v) => v === 0)).toBe(true);
  });
  it("rounds ratios to whole percent", () => {
    expect(stageProgress({ ...empty, brief: { done: 1, total: 3 } }).brief).toBe(33);
    expect(stageProgress({ ...empty, screens: { done: 2, total: 3 } }).screens).toBe(67);
  });
  it("caps targets at 100%", () => {
    expect(stageProgress({ ...empty, competitorsAssessed: 10 }).competitors).toBe(100);
    expect(stageProgress({ ...empty, research: { conducted: 9, target: 5 } }).research).toBe(100);
  });
  it("uses the default research target when none or zero is set", () => {
    const withNull = stageProgress({ ...empty, research: { conducted: 1, target: null } }).research;
    const withZero = stageProgress({ ...empty, research: { conducted: 1, target: 0 } }).research;
    expect(withNull).toBeGreaterThan(0);
    expect(withZero).toBe(withNull);
  });
  it("marks opportunities done once there is one", () => {
    expect(stageProgress({ ...empty, opportunities: 1 }).opportunities).toBe(100);
  });
});

describe("countsFromRow", () => {
  it("maps database counts, treating missing values as zero", () => {
    const c = countsFromRow({ screens_total: 3, screens_complete: 2, research_target: null }, { done: 1, total: 7 });
    expect(c.screens).toEqual({ done: 2, total: 3 });
    expect(c.research).toEqual({ conducted: 0, target: null });
    expect(c.flows).toEqual({ done: 0, total: 0 });
    expect(stageProgress(c).screens).toBe(67);
  });
});
