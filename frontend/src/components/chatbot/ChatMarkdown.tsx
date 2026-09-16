import { Fragment } from "react";

/** Renders **bold** and `code` spans inside a single line of text. */
function renderInline(text: string, keyPrefix: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);

  return parts.map((part, i) => {
    const key = `${keyPrefix}-${i}`;
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={key}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={key}
          className="rounded bg-black/10 px-1 py-0.5 text-[0.85em] dark:bg-white/10"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <Fragment key={key}>{part}</Fragment>;
  });
}

/**
 * Minimal Markdown renderer purpose-built for the chatbot's replies
 * in the narrow chat panel: bold text, inline code, and bullet /
 * numbered lists. Intentionally does not support headings, tables,
 * links, or code blocks - the system prompt tells the model not to
 * use those in this surface. Kept dependency-free (no react-markdown)
 * since the supported subset is small and fixed.
 */
export default function ChatMarkdown({ content }: { content: string }) {
  const lines = content.replace(/\r\n/g, "\n").split("\n");

  const blocks: { type: "ul" | "ol" | "p"; lines: string[] }[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);

    if (bullet) {
      const last = blocks[blocks.length - 1];
      if (last?.type === "ul") {
        last.lines.push(bullet[1]);
      } else {
        blocks.push({ type: "ul", lines: [bullet[1]] });
      }
    } else if (numbered) {
      const last = blocks[blocks.length - 1];
      if (last?.type === "ol") {
        last.lines.push(numbered[1]);
      } else {
        blocks.push({ type: "ol", lines: [numbered[1]] });
      }
    } else if (line.trim() === "") {
      // Blank line: just a paragraph/list break, no empty block needed.
      continue;
    } else {
      const last = blocks[blocks.length - 1];
      if (last?.type === "p") {
        last.lines.push(line);
      } else {
        blocks.push({ type: "p", lines: [line] });
      }
    }
  }

  return (
    <div className="space-y-2">
      {blocks.map((block, bi) => {
        if (block.type === "ul") {
          return (
            <ul key={bi} className="list-disc space-y-1 pl-5">
              {block.lines.map((item, li) => (
                <li key={li}>{renderInline(item, `${bi}-${li}`)}</li>
              ))}
            </ul>
          );
        }
        if (block.type === "ol") {
          return (
            <ol key={bi} className="list-decimal space-y-1 pl-5">
              {block.lines.map((item, li) => (
                <li key={li}>{renderInline(item, `${bi}-${li}`)}</li>
              ))}
            </ol>
          );
        }
        return (
          <p key={bi}>
            {block.lines.map((line, li) => (
              <Fragment key={li}>
                {li > 0 && <br />}
                {renderInline(line, `${bi}-${li}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </div>
  );
}
