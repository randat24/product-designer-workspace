import { describe, expect, it } from "vitest";
import { z } from "zod";
import { parseKeepingStored } from "./keep-stored";
import { optionalHttpUrl } from "./url";

const schema = z.object({ name: z.string().min(1), url: optionalHttpUrl() });
const stored = (v: unknown) => async () => v;

describe("parseKeepingStored", () => {
  it("saves the other fields when the only bad value is the stored one (spaces aside)", async () => {
    const r = await parseKeepingStored(schema, { name: "Acme", url: "mailto:a@b.co" }, "url", stored(" mailto:a@b.co "));
    expect(r.success && r.data).toEqual({ name: "Acme" });
  });
  it("still rejects a newly typed bad value", async () => {
    const r = await parseKeepingStored(schema, { name: "Acme", url: "tel:0501234567" }, "url", stored("mailto:a@b.co"));
    expect(r.success).toBe(false);
  });
  it("still rejects when another field is wrong too", async () => {
    const r = await parseKeepingStored(schema, { name: "", url: "mailto:a@b.co" }, "url", stored("mailto:a@b.co"));
    expect(r.success).toBe(false);
  });
  it("does not read the stored value when the record is valid", async () => {
    let read = false;
    const r = await parseKeepingStored(schema, { name: "Acme", url: "acme.com" }, "url", async () => { read = true; return null; });
    expect(r.success && r.data.url).toBe("https://acme.com");
    expect(read).toBe(false);
  });
});
