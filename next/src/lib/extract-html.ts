/**
 * Pulls the actual HTML document out of an agent's possibly chatty response.
 * Agents sometimes wrap output in ```html ... ``` fences or prepend explanation.
 */
export function extractHtml(streamed: string): string {
  if (!streamed) return "";

  // 1. Strip leading ```html fence (and trailing ```)
  const fence = streamed.match(/```(?:html|HTML)?\s*([\s\S]*?)```/);
  if (fence) {
    const inner = fence[1].trim();
    if (inner.startsWith("<")) return inner;
  }

  // 2. Find <!DOCTYPE html ... </html>.
  // When the agent emits multiple documents in one stream (observed with
  // `claude --include-partial-messages`: the model can restart mid-stream
  // and re-emit `<!DOCTYPE html>`, leaving an aborted first doc plus a
  // second fresh doc), keep ONLY the last complete document. Anything
  // before the final DOCTYPE is a partial artifact the browser would
  // otherwise glue onto the rendered output and break the layout.
  const doctypeRegex = /<!DOCTYPE\s+html/gi;
  const doctypeMatches = [...streamed.matchAll(doctypeRegex)];
  if (doctypeMatches.length > 0) {
    const lastStart = doctypeMatches[doctypeMatches.length - 1].index!;
    const after = streamed.slice(lastStart);
    const closeIdx = after.lastIndexOf("</html>");
    if (closeIdx !== -1) {
      return streamed.slice(
        lastStart,
        lastStart + closeIdx + "</html>".length,
      );
    }
    // streaming, partial — return from last doctype to end
    return streamed.slice(lastStart);
  }

  // 3. Find <html> ... </html>
  const htmlStart = streamed.search(/<html[\s>]/i);
  if (htmlStart !== -1) {
    const closeIdx = streamed.lastIndexOf("</html>");
    if (closeIdx !== -1) {
      return streamed.slice(htmlStart, closeIdx + "</html>".length);
    }
    return streamed.slice(htmlStart);
  }

  // 4. If it begins with < (root element), trust it
  if (streamed.trimStart().startsWith("<")) {
    return streamed;
  }

  // 5. Wrap whatever we got in a minimal scaffold so something renders
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><script src="https://cdn.tailwindcss.com"></script></head><body class="p-8 font-sans"><pre class="whitespace-pre-wrap">${escape(
    streamed,
  )}</pre></body></html>`;
}

function escape(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * For previews while the stream is still arriving — make sure we always
 * produce a closing </body></html> so the iframe can render incrementally.
 */
export function previewHtml(streamed: string): string {
  const html = extractHtml(streamed);
  if (!html) return "";
  if (/<\/html>/i.test(html)) return html;
  return html + "\n</body>\n</html>";
}
