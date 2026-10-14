import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
import { threadOf, type Note } from "./notes-source";

const note = (number: number, parent: number | null, day: number): Note => ({
  number, parent, body: `#${number}`, image: null, tags: [], reactions: {}, publishedAt: `2026-10-${String(day).padStart(2, "0")}T10:00:00Z`,
});

describe("threadOf", () => {
  const notes = [note(1, null, 1), note(2, 1, 2), note(3, 2, 3), note(4, 1, 4), note(5, null, 5)];

  it("puts the notes a note continues before it and its continuations after", () => {
    expect(threadOf(notes, 2).map((n) => n.number)).toEqual([1, 2, 3]);
    expect(threadOf(notes, 1).map((n) => n.number)).toEqual([1, 2, 4, 3]);
  });

  it("is the note alone when nothing continues it", () => {
    expect(threadOf(notes, 5).map((n) => n.number)).toEqual([5]);
  });

  it("ends the chain at a note missing in this language", () => {
    expect(threadOf([note(2, 1, 2), note(3, 2, 3)], 3).map((n) => n.number)).toEqual([2, 3]);
  });

  it("is empty for an unknown note", () => {
    expect(threadOf(notes, 9)).toEqual([]);
  });
});
