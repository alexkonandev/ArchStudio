import type { Field, FieldType, Relation } from "@/types";
import type { ParsedSchema } from "./parser";
import { createParseId, gridPosition } from "./parser";

const stripSql = (code: string): string =>
  code.replace(/--[^\n]*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");

const unquote = (v: string): string => {
  const t = v.trim();
  if (t.length >= 2 && t.startsWith('"') && t.endsWith('"')) return t.slice(1, -1);
  const parts = t.split(".").map((p) => p.trim().replace(/^"|"$/g, ""));
  return parts[parts.length - 1];
};

const splitTop = (inner: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let s = false;
  let d = false;
  let cur = "";
  for (let i = 0; i < inner.length; i += 1) {
    const ch = inner[i];
    if (ch === "'" && inner[i - 1] !== "'") s = !s;
    else if (ch === '"' && !s) d = !d;
    if (!s && !d) {
      if (ch === "(") depth += 1;
      if (ch === ")") depth = Math.max(0, depth - 1);
      if (ch === "," && depth === 0) {
        parts.push(cur);
        cur = "";
        continue;
      }
    }
    cur += ch;
  }
  if (cur.trim()) parts.push(cur);
  return parts;
};

const sqlType = (raw: string, enums: Set<string>): { type: FieldType; enumName?: string } => {
  const clean = raw.trim().replace(/^"|"$/g, "");
  if (enums.has(clean)) return { type: "Enum", enumName: clean };
  const t = raw.toUpperCase().replace(/\s+/g, " ").trim();
  const first = t.split(" ")[0].split("(")[0];
  if (["INT", "INTEGER", "SMALLINT", "SERIAL", "SMALLSERIAL"].includes(first)) return { type: "Int" };
  if (["BIGINT", "BIGSERIAL", "INT8"].includes(first)) return { type: "BigInt" };
  if (["BOOL", "BOOLEAN"].includes(first)) return { type: "Boolean" };
  if (["FLOAT", "FLOAT4", "FLOAT8", "DOUBLE", "REAL"].includes(first)) return { type: "Float" };
  if (["NUMERIC", "DECIMAL"].includes(first)) return { type: "Decimal" };
  if (first === "DATE") return { type: "Date" };
  if (first === "JSON" || first === "JSONB") return { type: "Json" };
  if (first === "BYTEA") return { type: "Bytes" };
  if (first === "UUID") return { type: "UUID" };
  if (t.includes("TIMESTAMP")) return { type: "DateTime" };
  if (t.includes("SERIAL")) return { type: "Int" };
  return { type: "String" };
};

const normDef = (raw: string): string => {
  const v = raw.trim().replace(/;$/, "");
  if (/^gen_random_uuid\s*\(\s*\)$/i.test(v)) return "uuid()";
  if (/^now\s*\(\s*\)$/i.test(v) || /^current_timestamp$/i.test(v)) return "now()";
  if (/^nextval\s*\(/i.test(v)) return "autoincrement()";
  if (/^null$/i.test(v)) return "";
  if (/^'.*'$/.test(v)) return v.slice(1, -1);
  if (/^".*"$/.test(v)) return v.slice(1, -1);
  return v;
};

const sqlDefault = (rest: string): string => {
  const mm = /\bDEFAULT\s+/i.exec(rest);
  if (!mm) return "";
  const tail = rest.slice(mm.index + mm[0].length).trim();
  if (tail.startsWith("'")) {
    let i = 1;
    while (i < tail.length) {
      if (tail[i] === "'" && tail[i + 1] === "'") {
        i += 2;
        continue;
      }
      if (tail[i] === "'") break;
      i += 1;
    }
    return normDef(tail.slice(0, i + 1));
  }
  const stop = /\b(NOT\s+NULL|NULL|UNIQUE|PRIMARY\s+KEY|REFERENCES|CHECK|CONSTRAINT|COLLATE|GENERATED)\b/i.exec(tail);
  return normDef((stop ? tail.slice(0, stop.index) : tail).split(",")[0]);
};

const sqlOnDelete = (rest: string): Relation["onDelete"] | undefined => {
  const mm = /ON\s+DELETE\s+(CASCADE|RESTRICT|SET\s+NULL|SET\s+DEFAULT|NO\s+ACTION)/i.exec(rest);
  if (!mm) return undefined;
  const v = mm[1].toUpperCase().replace(/\s+/g, "_");
  if (v === "CASCADE" || v === "RESTRICT") return v;
  if (v === "SET_NULL" || v === "SET_DEFAULT" || v === "NO_ACTION") return v;
  return undefined;
};

const mkField = (input: Omit<Field, "id">): Field => ({
  id: createParseId("field"),
  name: input.name,
  type: input.type,
  enumName: input.enumName,
  defaultValue: input.defaultValue ?? "",
  isUpdatedAt: false,
  isUnique: input.isUnique,
  isNullable: input.isNullable,
  nullable: input.isNullable,
  unique: input.isUnique,
  isPrimaryKey: input.isPrimaryKey ?? false,
  isList: false,
});

export function parseSqlSchema(code: string): ParsedSchema {
  const cleaned = stripSql(code);
  const enums: ParsedSchema["enums"] = [];
  const enumRe = /CREATE\s+TYPE\s+(?:"([^"]+)"|([A-Za-z_][A-Za-z0-9_.]*))\s+AS\s+ENUM\s*\(/gi;
  let em: RegExpExecArray | null;
  while ((em = enumRe.exec(cleaned)) !== null) {
    const rawName = em[1] ?? em[2];
    const ps = cleaned.indexOf("(", em.index);
    if (ps === -1) continue;
    let depth = 0;
    let end = -1;
    for (let i = ps; i < cleaned.length; i += 1) {
      if (cleaned[i] === "(") depth += 1;
      if (cleaned[i] === ")") {
        depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) continue;
    const inner = cleaned.slice(ps + 1, end);
    const values: string[] = [];
    const lit = /'((?:''|[^'])*)'|"([^"]*)"/g;
    let lm: RegExpExecArray | null;
    while ((lm = lit.exec(inner)) !== null) values.push((lm[1] ?? lm[2]).replace(/''/g, "'"));
    enums.push({ id: createParseId("enum"), name: unquote(rawName), values });
    enumRe.lastIndex = end + 1;
  }
  const enumNames = new Set(enums.map((e) => e.name));
  return parseTables(cleaned, enums, enumNames);
}

function parseTables(cleaned: string, enums: ParsedSchema["enums"], enumNames: Set<string>): ParsedSchema {
  const tableRe = /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?((?:"[^"]+"|[A-Za-z_][A-Za-z0-9_]*)(?:\s*\.\s*(?:"[^"]+"|[A-Za-z_][A-Za-z0-9_]*))?)\s*\(/gi;
  const blocks: { name: string; inner: string }[] = [];
  let tm: RegExpExecArray | null;
  while ((tm = tableRe.exec(cleaned)) !== null) {
    const ps = cleaned.indexOf("(", tm.index);
    if (ps === -1) continue;
    let depth = 0;
    let s = false;
    let d = false;
    let end = -1;
    for (let i = ps; i < cleaned.length; i += 1) {
      const ch = cleaned[i];
      if (ch === "'" && cleaned[i - 1] !== "'") s = !s;
      else if (ch === '"' && !s) d = !d;
      if (s || d) continue;
      if (ch === "(") depth += 1;
      if (ch === ")") {
        depth -= 1;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end === -1) continue;
    blocks.push({ name: tm[1], inner: cleaned.slice(ps + 1, end) });
    tableRe.lastIndex = end + 1;
  }
  if (blocks.length === 0) throw new Error('No `CREATE TABLE` found. Paste DDL like `CREATE TABLE "User" (...)`.');
  return buildTables(blocks, enums, enumNames);
}

function buildTables(blocks: { name: string; inner: string }[], enums: ParsedSchema["enums"], enumNames: Set<string>): ParsedSchema {
  const tables: ParsedSchema["tables"] = [];
  const pending: { from: string; cols: string[]; to: string; onDelete?: Relation["onDelete"] }[] = [];
  const pkByTable = new Map<string, Set<string>>();
  const uqByTable = new Map<string, Set<string>>();
  blocks.forEach((block, ti) => {
    const tableName = unquote(block.name);
    const cols: { name: string; type: FieldType; enumName?: string; pk: boolean; nullable: boolean; unique: boolean; def: string }[] = [];
    for (const rawDef of splitTop(block.inner)) {
      const def = rawDef.trim().replace(/;$/, "");
      if (!def) continue;
      const up = def.toUpperCase();
      const isC = up.startsWith("PRIMARY KEY") || up.startsWith("UNIQUE") || up.startsWith("FOREIGN KEY") || up.startsWith("CONSTRAINT") || up.startsWith("CHECK");
      if (isC) {
        const pk = /PRIMARY\s+KEY\s*\(([^)]+)\)/i.exec(def);
        if (pk) {
          const set = pkByTable.get(tableName) ?? new Set<string>();
          for (const c of pk[1].split(",")) set.add(unquote(c));
          pkByTable.set(tableName, set);
          continue;
        }
        const uq = /UNIQUE\s*\(([^)]+)\)/i.exec(def);
        if (uq) {
          const set = uqByTable.get(tableName) ?? new Set<string>();
          for (const c of uq[1].split(",")) set.add(unquote(c));
          uqByTable.set(tableName, set);
          continue;
        }
        const fk = /FOREIGN\s+KEY\s*\(([^)]+)\)\s+REFERENCES\s+((?:"[^"]+"|[A-Za-z_][A-Za-z0-9_]*)(?:\s*\.\s*(?:"[^"]+"|[A-Za-z_][A-Za-z0-9_]*))?)/i.exec(def);
        if (fk) pending.push({ from: tableName, cols: fk[1].split(",").map((c) => unquote(c)), to: unquote(fk[2]), onDelete: sqlOnDelete(def) });
        continue;
      }
      const cm = /^(?:"([^"]+)"|([A-Za-z_][A-Za-z0-9_]*))\s+([\s\S]+)$/.exec(def);
      if (!cm) continue;
      const colName = cm[1] ?? cm[2];
      const rest = cm[3].trim();
      const stop = /\b(PRIMARY\s+KEY|NOT\s+NULL|\bNULL\b|UNIQUE\b|DEFAULT\b|REFERENCES\b|CHECK\b|CONSTRAINT\b|COLLATE\b|GENERATED\b)\b/i.exec(rest);
      const mapped = sqlType((stop ? rest.slice(0, stop.index) : rest).trim() || "TEXT", enumNames);
      const isPk = /\bPRIMARY\s+KEY\b/i.test(rest);
      const ref = /\bREFERENCES\s+((?:"[^"]+"|[A-Za-z_][A-Za-z0-9_]*)(?:\s*\.\s*(?:"[^"]+"|[A-Za-z_][A-Za-z0-9_]*))?)/i.exec(rest);
      const notNull = /\bNOT\s+NULL\b/i.test(rest);
      cols.push({ name: colName, type: mapped.type, enumName: mapped.enumName, pk: isPk, nullable: isPk ? false : !notNull, unique: /\bUNIQUE\b/i.test(rest), def: /GENERATED\s+.*AS\s+IDENTITY/i.test(rest) ? "autoincrement()" : sqlDefault(rest) });
      if (ref) pending.push({ from: tableName, cols: [colName], to: unquote(ref[1]), onDelete: sqlOnDelete(rest) });
    }
    const pkSet = pkByTable.get(tableName);
    const uqSet = uqByTable.get(tableName);
    tables.push({
      id: createParseId("table"),
      name: tableName,
      position: gridPosition(ti),
      fields: cols.map((c) => {
        const pk = c.pk || (pkSet?.has(c.name) ?? false);
        const nu = pk ? false : c.nullable;
        const uq = c.unique || (uqSet?.has(c.name) ?? false);
        return mkField({ name: c.name, type: c.type, enumName: c.enumName, defaultValue: c.def, isUpdatedAt: false, isUnique: uq, isNullable: nu, isPrimaryKey: pk, nullable: nu, unique: uq, isList: false });
      }),
    });
  });
  const relations: ParsedSchema["relations"] = [];
  const seen = new Set<string>();
  const findT = (n: string) => tables.find((t) => t.name === n) ?? tables.find((t) => t.name.toLowerCase() === n.toLowerCase());
  for (const p of pending) {
    const from = findT(p.from);
    const to = findT(p.to);
    if (!from || !to || from.id === to.id) continue;
    for (const cn of p.cols) {
      const fk = from.fields.find((f) => f.name === cn);
      const key = `${from.id}->${to.id}:${fk?.id ?? cn}`;
      if (seen.has(key)) continue;
      seen.add(key);
      relations.push({ id: createParseId("rel"), name: `${from.name}${to.name}`, type: fk?.isUnique ? "one-to-one" : "one-to-many", fromTableId: from.id, toTableId: to.id, fromFieldId: fk?.id, onDelete: p.onDelete ?? "CASCADE" });
    }
  }
  return { tables, relations, enums };
}
