import type { CodeFileLanguage } from "@/store/code-workspace-store";

/**
 * Lightweight, framework-free symbol extractor for the Code Studio "Outline"
 * tab. It parses the *text* of the active virtual file (never the graph AST) so
 * the outline stays in sync with manual edits made in Monaco — exactly like a
 * VS Code outline that reflects the buffer, not an external model.
 *
 * Pure function: same content + language -> same symbols in the same order.
 */

/** High-level category of a parsed symbol, used to pick an icon + grouping. */
export type OutlineSymbolKind =
  | "model"
  | "enum"
  | "datasource"
  | "generator"
  | "type"
  | "interface"
  | "const"
  | "table"
  | "heading";

/** A single clickable entry in the Outline tree. */
export interface OutlineSymbol {
  /** Stable key (kind + name + line is unique within a file). */
  id: string;
  /** Display name (e.g. `User`, `Role`, a table name). */
  name: string;
  kind: OutlineSymbolKind;
  /** 1-based line of the declaration, used to reveal it in Monaco. */
  line: number;
  /** Number of direct members (fields / values / properties), when known. */
  members: number;
}

/**
 * Count the non-empty, non-comment, non-attribute lines inside a `{ ... }`
 * block. Tracks brace depth so nested blocks don't terminate the count early.
 */
function countBlockMembers(lines: string[], openIndex: number): number {
  let depth = 0;
  let count = 0;
  for (let i = openIndex; i < lines.length; i++) {
    const line = lines[i];
    const opens = (line.match(/\{/g) ?? []).length;
    const closes = (line.match(/\}/g) ?? []).length;
    // The opening line's braces only seed depth; its content isn't a member.
    if (i > openIndex && depth === 1) {
      const trimmed = line.trim();
      const isNoise =
        trimmed === "" ||
        trimmed.startsWith("//") ||
        trimmed.startsWith("///") ||
        trimmed.startsWith("--") ||
        trimmed.startsWith("@@") ||
        trimmed.startsWith("}");
      if (!isNoise) count += 1;
    }
    depth += opens - closes;
    if (depth <= 0) break;
  }
  return count;
}

/** Find the 1-based line of the closing brace matching the block opened at `openIndex`. */
function findBlockEnd(lines: string[], openIndex: number): number {
  let depth = 0;
  for (let i = openIndex; i < lines.length; i++) {
    depth += (lines[i].match(/\{/g) ?? []).length;
    depth -= (lines[i].match(/\}/g) ?? []).length;
    if (depth <= 0) return i;
  }
  return lines.length - 1;
}

/** Parse a Prisma schema: `model` / `enum` / `datasource` / `generator` blocks. */
function parsePrisma(content: string): OutlineSymbol[] {
  const lines = content.split("\n");
  const symbols: OutlineSymbol[] = [];
  const decl = /^(model|enum|datasource|generator|type|view)\s+([A-Za-z0-9_]+)/;
  for (let i = 0; i < lines.length; i++) {
    const match = decl.exec(lines[i]);
    if (!match) continue;
    const kind = match[1] as OutlineSymbolKind;
    const name = match[2];
    const end = findBlockEnd(lines, i);
    symbols.push({
      id: `${kind}:${name}:${i + 1}`,
      name,
      kind,
      line: i + 1,
      members: countBlockMembers(lines, i),
    });
    // Skip past this block so nested lines are never mis-attributed.
    i = end;
  }
  return symbols;
}

/** Parse SQL DDL: `CREATE TABLE` and `CREATE TYPE ... AS ENUM` statements. */
function parseSql(content: string): OutlineSymbol[] {
  const lines = content.split("\n");
  const symbols: OutlineSymbol[] = [];
  const table = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?["'`]?([A-Za-z0-9_]+)["'`]?\s*\(/i;
  const enumType = /CREATE\s+TYPE\s+["'`]?([A-Za-z0-9_]+)["'`]?\s+AS\s+ENUM/i;
  for (let i = 0; i < lines.length; i++) {
    const t = table.exec(lines[i]);
    if (t) {
      // Count columns until the closing `)` of the column list.
      let members = 0;
      for (let j = i; j < lines.length; j++) {
        const trimmed = lines[j].trim();
        if (j > i && trimmed.startsWith(")")) break;
        if (j > i && trimmed !== "" && !trimmed.startsWith("--")) members += 1;
      }
      symbols.push({
        id: `table:${t[1]}:${i + 1}`,
        name: t[1],
        kind: "table",
        line: i + 1,
        members,
      });
      continue;
    }
    const e = enumType.exec(lines[i]);
    if (e) {
      symbols.push({
        id: `enum:${e[1]}:${i + 1}`,
        name: e[1],
        kind: "enum",
        line: i + 1,
        members: (lines[i].match(/'/g) ?? []).length >> 1,
      });
    }
  }
  return symbols;
}


/** Parse TypeScript: `export interface` / `export type` / `export const`. */
function parseTypeScript(content: string): OutlineSymbol[] {
  const lines = content.split("\n");
  const symbols: OutlineSymbol[] = [];
  const iface = /^export\s+interface\s+([A-Za-z0-9_]+)/;
  const typeAlias = /^export\s+type\s+([A-Za-z0-9_]+)/;
  const constDecl = /^export\s+const\s+([A-Za-z0-9_]+)/;
  for (let i = 0; i < lines.length; i++) {
    const ifaceMatch = iface.exec(lines[i]);
    if (ifaceMatch) {
      symbols.push({
        id: `interface:${ifaceMatch[1]}:${i + 1}`,
        name: ifaceMatch[1],
        kind: "interface",
        line: i + 1,
        members: countBlockMembers(lines, i),
      });
      i = findBlockEnd(lines, i);
      continue;
    }
    const typeMatch = typeAlias.exec(lines[i]);
    if (typeMatch) {
      // A string-literal union: count `|` separators + 1 as members.
      const members = (lines[i].match(/\|/g) ?? []).length + 1;
      symbols.push({
        id: `type:${typeMatch[1]}:${i + 1}`,
        name: typeMatch[1],
        kind: "type",
        line: i + 1,
        members: lines[i].includes("|") ? members : 0,
      });
      continue;
    }
    const constMatch = constDecl.exec(lines[i]);
    if (constMatch) {
      const blockHere = /\{/.test(lines[i]);
      symbols.push({
        id: `const:${constMatch[1]}:${i + 1}`,
        name: constMatch[1],
        kind: "const",
        line: i + 1,
        members: blockHere ? countBlockMembers(lines, i) : countBlockMembers(lines, i + 1),
      });
      continue;
    }
  }
  return symbols;
}

/** Parse Markdown: ATX headings (`#` … `######`). */
function parseMarkdown(content: string): OutlineSymbol[] {
  return content
    .split("\n")
    .map((line, index) => ({ line, index }))
    .filter(({ line }) => /^#{1,6}\s+\S/.test(line))
    .map(({ line, index }) => {
      const level = (line.match(/^#+/) ?? ["#"])[0].length;
      const name = line.replace(/^#+\s+/, "").trim();
      return {
        id: `heading:${index + 1}`,
        name,
        kind: "heading" as OutlineSymbolKind,
        line: index + 1,
        members: level,
      };
    });
}

/**
 * Extract the outline symbols for a file, dispatching on its editor language.
 * Unknown languages yield an empty list (the Outline tab shows a hint instead).
 */
export function parseOutline(content: string, language: CodeFileLanguage): OutlineSymbol[] {
  switch (language) {
    case "prisma":
      return parsePrisma(content);
    case "sql":
      return parseSql(content);
    case "typescript":
      return parseTypeScript(content);
    case "markdown":
      return parseMarkdown(content);
    default:
      return [];
  }
}

