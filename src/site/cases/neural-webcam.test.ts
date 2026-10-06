import { describe, expect, it } from "vitest";
import { neuralEn, neuralUk } from "./neural-webcam";

describe("Neural WebCam product case", () => {
  const ids = (c: typeof neuralUk) => c.product!.sections.map((s) => s.id);

  it("has the same sections in both languages, each id once", () => {
    expect(ids(neuralUk)).toEqual(ids(neuralEn));
    expect(new Set(ids(neuralUk)).size).toBe(ids(neuralUk).length);
  });

  it("presents the work as Neural WebCam, not the later brand", () => {
    const text = JSON.stringify([neuralUk, neuralEn]).toLowerCase();
    expect(text).not.toContain("nudesmaker");
    expect(neuralUk.liveUrl).toBeUndefined();
  });

  it("shows no invented product screens: the screens section stays empty until real ones are added", () => {
    const screens = neuralUk.product!.sections.find((s) => s.kind === "screens");
    expect(screens && screens.kind === "screens" ? screens.items : []).toEqual([]);
  });
});
