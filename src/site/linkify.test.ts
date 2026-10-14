import { describe, expect, it } from "vitest";
import { linkify } from "./linkify";

describe("linkify", () => {
  it("keeps plain text as one part", () => {
    expect(linkify("Без посилань.")).toEqual([{ text: "Без посилань." }]);
  });

  it("turns http(s) links into links and leaves the punctuation after them", () => {
    expect(linkify("Див. https://www.nngroup.com/articles/x, там усе.")).toEqual([
      { text: "Див. " },
      { href: "https://www.nngroup.com/articles/x", text: "nngroup.com/articles/x" },
      { text: ", там усе." },
    ]);
  });

  it("keeps a closing bracket the link opened", () => {
    expect(linkify("(https://en.wikipedia.org/wiki/Fitts(law))")).toEqual([
      { text: "(" },
      { href: "https://en.wikipedia.org/wiki/Fitts(law)", text: "en.wikipedia.org/wiki/Fitts(law)" },
      { text: ")" },
    ]);
  });

  it("ignores other schemes", () => {
    expect(linkify("javascript:alert(1)")).toEqual([{ text: "javascript:alert(1)" }]);
  });
});
