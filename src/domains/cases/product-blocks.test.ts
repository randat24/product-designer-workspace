import { describe, expect, it } from "vitest";
import { DICTIONARIES, LOCALES } from "@/site/content";
import { BLOCK_KINDS, emptyBlock, emptyStory, productStorySchema } from "./product-blocks";
import { draftFromSnapshot, mergeDraft } from "./schema";

const roundTrip = <T,>(x: T): T => JSON.parse(JSON.stringify(x));

describe("product story blocks", () => {
  it("every product story in the code passes the editor's check unchanged", () => {
    let checked = 0;
    for (const locale of LOCALES) {
      for (const item of DICTIONARIES[locale].cases_list) {
        if (!item.product) continue;
        const stored = roundTrip(item.product);
        const parsed = productStorySchema.safeParse(stored);
        expect(parsed.success, `${locale}/${item.slug}: ${parsed.error?.issues[0]?.path.join(".")} ${parsed.error?.issues[0]?.message}`).toBe(true);
        // Nothing is dropped or added on the way through the check.
        expect(parsed.data).toEqual(stored);
        checked++;
      }
    }
    expect(checked).toBeGreaterThan(0);
  });

  it("a new block of every kind is valid as it starts", () => {
    const story = emptyStory("Зміст");
    for (const kind of BLOCK_KINDS) story.sections.push(emptyBlock(kind, story.sections.map((s) => s.id)));
    const parsed = productStorySchema.safeParse(roundTrip(story));
    expect(parsed.success, JSON.stringify(parsed.error?.issues[0])).toBe(true);
    expect(new Set(story.sections.map((s) => s.id)).size).toBe(BLOCK_KINDS.length);
  });

  it("anchor ids stay unique when a kind is added twice", () => {
    const first = emptyBlock("principles", []);
    const second = emptyBlock("principles", [first.id]);
    expect(second.id).toBe("principles-2");
  });

  it("refuses what the page cannot show", () => {
    expect(productStorySchema.safeParse({ disciplines: [], contents: "", sections: [{ kind: "nope", id: "x", title: "" }] }).success).toBe(false);
    expect(productStorySchema.safeParse({ disciplines: [], contents: "", sections: [{ kind: "trust", id: "t", title: "", items: [{ icon: "skull", title: "", body: "" }] }] }).success).toBe(false);
    expect(productStorySchema.safeParse({ disciplines: [], contents: "", sections: [{ kind: "flows", id: "Bad Id", title: "", items: [] }] }).success).toBe(false);
  });

  it("the draft keeps the story and can drop it", () => {
    const item = DICTIONARIES.uk.cases_list.find((c) => c.product)!;
    const snapshot = { uk: roundTrip({ ...item, slug: undefined }) };
    const draft = draftFromSnapshot(snapshot, "uk");
    expect(draft.product).toEqual(roundTrip(item.product));
    expect(mergeDraft(snapshot, "uk", draft).uk?.product).toEqual(draft.product);
    expect(mergeDraft(snapshot, "uk", { ...draft, product: null }).uk).not.toHaveProperty("product");
  });
});
