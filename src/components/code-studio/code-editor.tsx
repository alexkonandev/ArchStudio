"use client";

import { useMemo } from "react";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import ghcolors from "react-syntax-highlighter/dist/esm/styles/prism/ghcolors";
import graphql from "react-syntax-highlighter/dist/esm/languages/prism/graphql";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import markdown from "react-syntax-highlighter/dist/esm/languages/prism/markdown";
import type { CodeFile } from "@/lib/engine/codegen";

/** The set of languages a rendered {@link CodeFile} can use. */
type EditorLanguage = CodeFile["language"];

// Register only the grammars we actually render to keep the bundle light.
SyntaxHighlighter.registerLanguage("graphql", graphql);
SyntaxHighlighter.registerLanguage("sql", sql);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("markdown", markdown);

/**
 * Map a {@link CodeFile} language hint to a registered Prism grammar.
 * Prisma schemas share GraphQL's block/field syntax, so they reuse `graphql`.
 */
const GRAMMAR: Record<EditorLanguage, string> = {
  prisma: "graphql",
  sql: "sql",
  typescript: "typescript",
  markdown: "markdown",
};

const CODE_FONT =
  '"Consolas", "Bitstream Vera Sans Mono", "Courier New", ui-monospace, SFMono-Regular, Menlo, monospace';

/**
 * Read-only, syntax-highlighted code surface (GitHub-Light palette) with a
 * sticky line-number gutter, per-line hover highlight and smooth scrolling.
 * Pure presentational component.
 */
export function CodeEditor({
  content,
  language,
  highlightLines,
}: {
  content: string;
  language: EditorLanguage;
  /** 1-based line numbers to visually emphasize (e.g. the alert's table). */
  highlightLines?: number[];
}) {
  const lineCount = useMemo(() => content.split("\n").length, [content]);
  const highlight = useMemo(() => new Set(highlightLines ?? []), [highlightLines]);

  return (
    <div className="glass-panel flex h-full min-h-0 flex-col overflow-hidden rounded-lg border shadow-sm backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-border bg-muted/40 px-4 py-1.5">
        <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          {language}
        </span>
        <span className="text-[10px] text-muted-foreground">
          {lineCount} ligne{lineCount === 1 ? "" : "s"}
        </span>
      </div>
      <div className="min-h-0 flex-1 overflow-auto">
        <SyntaxHighlighter
          language={GRAMMAR[language]}
          style={ghcolors}
          showLineNumbers
          showInlineLineNumbers
          wrapLines
          wrapLongLines={false}
          lineProps={(lineNumber) => ({
            style: { display: "flex" },
            className: highlight.has(lineNumber)
              ? "bg-amber-200/50"
              : "hover:bg-slate-100/70",
          })}
          lineNumberStyle={{
            display: "inline-block",
            minWidth: "2.5em",
            flexShrink: 0,
            paddingRight: "1em",
            paddingLeft: "0.75rem",
            textAlign: "right",
            userSelect: "none",
            position: "sticky",
            left: 0,
            background: "#ffffff",
            borderRight: "1px solid #e2e8f0",
          }}
          customStyle={{
            margin: 0,
            padding: "0.75rem 0",
            background: "transparent",
            border: "none",
            borderRadius: 0,
            overflow: "visible",
          }}
          codeTagProps={{
            style: {
              display: "block",
              fontFamily: CODE_FONT,
              fontSize: "0.875rem",
              lineHeight: "1.5rem",
              background: "transparent",
              padding: 0,
            },
          }}
        >
          {content}
        </SyntaxHighlighter>
      </div>
    </div>
  );
}

