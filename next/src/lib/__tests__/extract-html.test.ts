import { describe, expect, it } from "vitest";
import { extractHtml, previewHtml } from "../extract-html";

describe("extractHtml", () => {
  it("extracts fenced HTML", () => {
    expect(extractHtml("```html\n<html><body>ok</body></html>\n```")).toBe(
      "<html><body>ok</body></html>",
    );
  });

  it("extracts a full document from chatty output", () => {
    const source = "Here you go:\n<!DOCTYPE html><html><body>ok</body></html>\nDone.";
    expect(extractHtml(source)).toBe("<!DOCTYPE html><html><body>ok</body></html>");
  });

  it("wraps plain text in a previewable scaffold", () => {
    const html = extractHtml("hello <world>");
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("hello &lt;world&gt;");
  });

  it("keeps only the last document when the agent re-emits DOCTYPE mid-stream", () => {
    // Reproduces the Claude CLI mid-stream restart bug: the model emits a
    // partial first document, then re-starts with a fresh <!DOCTYPE html>.
    // The earlier artifact (cut off mid-attribute) must NOT bleed into the
    // rendered output — only the second document survives.
    const source =
      "<!DOCTYPE html><html><body>" +
      "<ol><li class=\"flex gap<!DOCTYPE html>" +
      "<html><body><main>SECOND DOC body only</main>";
    const out = extractHtml(source);
    expect(out.startsWith("<!DOCTYPE html>")).toBe(true);
    expect(out).toContain("SECOND DOC");
    expect(out).not.toContain("class=\"flex gap<!DOCTYPE");
  });
});

describe("previewHtml", () => {
  it("closes partial streamed HTML for iframe rendering", () => {
    expect(previewHtml("<html><body><main>streaming")).toContain("</body>\n</html>");
  });
});
