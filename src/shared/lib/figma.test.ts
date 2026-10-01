import { describe, expect, it } from "vitest";
import { figmaEmbedUrl, figmaFileUrl } from "./figma";

describe("figmaFileUrl", () => {
  it("accepts design, file, prototype and board links, with or without scheme and www", () => {
    expect(figmaFileUrl("https://www.figma.com/design/AbC123/Workspace?node-id=1-2")).toBe("https://www.figma.com/design/AbC123/Workspace?node-id=1-2");
    expect(figmaFileUrl(" figma.com/file/AbC123/Old ")).toBe("https://www.figma.com/file/AbC123/Old");
    expect(figmaFileUrl("https://figma.com/proto/AbC123/Flow")).toBe("https://www.figma.com/proto/AbC123/Flow");
    expect(figmaFileUrl("https://www.figma.com/board/AbC123/Map")).toBe("https://www.figma.com/board/AbC123/Map");
  });
  it("rejects other hosts, non-file pages, plain http and empty values", () => {
    expect(figmaFileUrl("https://evil.com/design/AbC123")).toBeNull();
    expect(figmaFileUrl("https://figma.com.evil.com/design/AbC123")).toBeNull();
    expect(figmaFileUrl("https://www.figma.com/community")).toBeNull();
    expect(figmaFileUrl("http://www.figma.com/design/AbC123")).toBeNull();
    expect(figmaFileUrl("javascript:alert(1)")).toBeNull();
    expect(figmaFileUrl("  ")).toBeNull();
  });
});

describe("figmaEmbedUrl", () => {
  it("wraps the file link into Figma's embed player", () => {
    expect(figmaEmbedUrl("https://www.figma.com/design/AbC123/W")).toBe(
      "https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Fdesign%2FAbC123%2FW",
    );
  });
});
