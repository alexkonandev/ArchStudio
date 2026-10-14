"use client";

import { useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { editor, languages } from "monaco-editor";
import type { Monaco } from "@monaco-editor/react";
import { Loader2 } from "lucide-react";
import type { CodeFileLanguage } from "@/store/code-workspace-store";
import { installMonacoEnvironment } from "@/lib/monaco/monaco-environment";
import { cn } from "@/lib/utils";

/** Monaco's Monarch language definition shape (see `monaco-editor`). */
type MonacoLanguage = languages.IMonarchLanguage;

/**
 * Monaco Editor wrapper for the Code Studio.
 *
 * Monaco touches `window` / `document` the moment it mounts, which would throw
 * during SSR / prerender. We therefore load it client-only via
 * `next/dynamic({ ssr: false })` (see the Next.js lazy-loading guide) — the
 * lightweight skeleton below streams instantly while the editor chunk is
 * bundled and initialised on the client. Monaco is served from our own origin
 * (see the loader configuration below), never a CDN.
 */
const MonacoReact = dynamic(
  async () => {
    // Must run before `loader.config(...)`: without a `MonacoEnvironment`,
    // Monaco resolves its workers through an unbundled `blob:` bootstrap that
    // 404s under Turbopack and rejects with a raw `ErrorEvent`
    // (`⨯ unhandledRejection: [object ErrorEvent]`). Declaring one makes
    // `getWorker` throw synchronously, which Monaco catches and turns into its
    // main-thread fallback — no promise, so no unhandled rejection.
    // See `@/lib/monaco/monaco-environment` for the full rationale.
    installMonacoEnvironment();

    const [reactMod, monaco] = await Promise.all([
      import("@monaco-editor/react"),
      import("monaco-editor"),
    ]);
    // By default `@monaco-editor/react` loads Monaco from a CDN
    // (`cdn.jsdelivr.net`). That request is blocked by our strict CSP and
    // fails offline, leaving the editor stuck on "Loading…" with a
    // "Monaco initialization: error: {}" console message. Hand the locally
    // bundled `monaco-editor` package to the loader instead so it initialises
    // synchronously from our own origin. This only runs client-side
    // (`ssr: false`), so the ESM/CSS imports are bundled rather than executed
    // under Node SSR.
    reactMod.loader.config({ monaco });
    return { default: reactMod.default };
  },
  { ssr: false, loading: () => <EditorSkeleton /> },
);

/** Map a {@link CodeFileLanguage} hint to a Monaco language id. */
const MONACO_LANGUAGE: Record<CodeFileLanguage, string> = {
  prisma: "prisma",
  sql: "sql",
  typescript: "typescript",
  markdown: "markdown",
};

export interface MonacoCodeEditorProps {
  /** Controlled buffer content. */
  value: string;
  /** Editor language hint (drives syntax highlighting). */
  language: CodeFileLanguage;
  /** Stable model path — keeps a separate undo stack / markers per file. */
  path: string;
  /** Fired on every edit with the new buffer value. */
  onChange: (value: string) => void;
  /** 1-based line numbers to emphasise (e.g. the hovered diagnostic's table). */
  highlightLines?: number[];
  /** When it changes, scroll this 1-based line into the centre. */
  revealLine?: number;
  /** Disable editing (read-only preview). */
  readOnly?: boolean;
  /** Receives the live editor instance so the shell can trigger "format". */
  onReady?: (instance: editor.IStandaloneCodeEditor) => void;
  className?: string;
}

/** Elegant light placeholder shown until the Monaco chunk resolves. */
function EditorSkeleton() {
  return (
    <div className="flex h-full w-full flex-col gap-3 bg-muted p-4">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        Chargement de Monaco…
      </div>
      <div className="flex-1 space-y-2 opacity-40">
        {Array.from({ length: 12 }).map((_, i) => (
          <div
            key={i}
            className="h-3 rounded bg-slate-300/60"
            style={{ width: `${40 + ((i * 37) % 55)}%` }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Minimal Monarch tokenizer for Prisma schemas. Monaco has no built-in Prisma
 * grammar, so we declare the block keywords (`model` / `enum` / …), field
 * types, attributes (`@id`, `@relation(...)`) and comments. Kept intentionally
 * small — it only needs to colour tokens, not to validate.
 */
const PRISMA_LANGUAGE: MonacoLanguage = {
  tokenizer: {
    root: [
      [/\/\/\/.*$/, "comment.doc"],
      [/\/\/.*$/, "comment"],
      [/"""/, { token: "string", next: "@tripleString" }],
      [/"([^"\\]|\\.)*$/, "string.invalid"],
      [/"/, { token: "string", next: "@string" }],
      [
        /\b(datasource|generator|model|enum|type|view)\b/,
        "keyword",
      ],
      [
        /\b(Int|BigInt|String|Boolean|Float|Decimal|DateTime|Date|Json|Bytes|UUID|Unsupported)\b/,
        "type",
      ],
      [/@[A-Za-z]\w*/, "attribute"],
      [/[A-Za-z_]\w*/, "identifier"],
      [/[{}()[\]]/, "@brackets"],
      [/\d+(\.\d+)?/, "number"],
      [/[=?:]/, "operator"],
    ],
    string: [
      [/[^\\"]+/, "string"],
      [/\\./, "string.escape"],
      [/"/, { token: "string", next: "@pop" }],
    ],
    tripleString: [
      [/[^"]+/, "string"],
      [/"""/, { token: "string", next: "@pop" }],
      [/"/, "string"],
    ],
  },
};

/**
 * `beforeMount`: register the custom Prisma grammar exactly once, before the
 * editor instantiates. Monaco has no built-in Prisma support, so we declare it
 * here for syntax highlighting. Idempotent guards make React StrictMode's
 * double-invoke safe.
 */
function configureMonaco(monaco: Monaco): void {
  if (!monaco.languages.getLanguages().some((lang: languages.ILanguageExtensionPoint) => lang.id === "prisma")) {
    monaco.languages.register({ id: "prisma", extensions: [".prisma"] });
    monaco.languages.setMonarchTokensProvider("prisma", PRISMA_LANGUAGE);
  }
}

/** CSS class applied to whole-line highlight decorations (see globals.css). */
const HIGHLIGHT_CLASS = "archstudio-highlight-line";

/**
 * Controlled Monaco surface for a single VFS file. The editor instance is
 * captured on mount (exposed to the shell via {@link MonacoCodeEditorProps.onReady}
 * for the "format" action) and reused to apply highlight decorations + reveal
 * lines driven by the diagnostics panel.
 */
export function MonacoCodeEditor({
  value,
  language,
  path,
  onChange,
  highlightLines,
  revealLine,
  readOnly = false,
  onReady,
  className,
}: MonacoCodeEditorProps) {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const decorationsRef = useRef<string[]>([]);

  const handleMount = useCallback(
    (instance: editor.IStandaloneCodeEditor, monaco: Monaco) => {
      editorRef.current = instance;
      onReady?.(instance);

      // Bind Cmd/Ctrl+Shift+I to the built-in document formatter so the
      // "Format" quick action has a keyboard twin (mirrors VS Code).
      instance.addCommand(
        monaco.KeyMod.Shift | monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyI,
        () => void instance.getAction("editor.action.formatDocument")?.run(),
      );
    },
    [onReady],
  );

  const handleChange = useCallback(
    (next: string | undefined) => {
      onChange(next ?? "");
    },
    [onChange],
  );

  // Emphasise whole lines (e.g. the table block behind a hovered diagnostic).
  useEffect(() => {
    const instance = editorRef.current;
    if (!instance) return;
    if (!highlightLines || highlightLines.length === 0) {
      decorationsRef.current = instance.deltaDecorations(decorationsRef.current, []);
      return;
    }
    decorationsRef.current = instance.deltaDecorations(
      decorationsRef.current,
      highlightLines.map((lineNumber) => ({
        range: {
          startLineNumber: lineNumber,
          startColumn: 1,
          endLineNumber: lineNumber,
          endColumn: 1,
        },
        options: { isWholeLine: true, className: HIGHLIGHT_CLASS },
      })),
    );
  }, [highlightLines, value]);

  // Reveal a specific line when the diagnostics panel requests it.
  useEffect(() => {
    const instance = editorRef.current;
    if (!instance || !revealLine) return;
    instance.revealLineInCenter(revealLine);
    instance.setPosition({ lineNumber: revealLine, column: 1 });
  }, [revealLine]);

  return (
    <MonacoReact
      className={cn("h-full w-full overflow-hidden", className)}
      theme="vs"
      language={MONACO_LANGUAGE[language]}
      path={path}
      value={value}
      beforeMount={configureMonaco}
      onMount={handleMount}
      onChange={handleChange}
      options={{
        readOnly,
        automaticLayout: true,
        minimap: { enabled: true, scale: 1, size: "proportional" },
        fontSize: 13,
        fontFamily:
          '"JetBrains Mono", "Fira Code", ui-monospace, SFMono-Regular, Menlo, monospace',
        fontLigatures: true,
        lineHeight: 20,
        lineNumbersMinChars: 3,
        padding: { top: 12, bottom: 12 },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        renderLineHighlight: "all",
        renderWhitespace: "selection",
        bracketPairColorization: { enabled: true },
        guides: { bracketPairs: true, indentation: true },
        tabSize: 2,
        wordWrap: "on",
        fixedOverflowWidgets: true,
        scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
        contextmenu: true,
        quickSuggestions: false,
      }}
    />
  );
}

