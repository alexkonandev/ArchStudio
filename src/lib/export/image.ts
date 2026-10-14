"use client";

import type { SchemaAst } from "@/types";
import { generateCodeFiles } from "@/lib/engine/codegen";
import { compileToPrisma, compileToSql } from "@/lib/engine";

/**
 * Selectors hidden from HD exports: minimap, controls, alignment guides,
 * collab cursors, floating toolbars — only diagram nodes + edges remain.
 */
const HD_EXCLUDE_SELECTORS = [
  ".react-flow__minimap",
  ".react-flow__controls",
  ".react-flow__panel",
  "[data-export-hidden]",
  "[data-collab-cursor]",
].join(", ");

/** Filter passed to html-to-image so the HD capture is a clean diagram. */
function hdFilter(node: unknown): boolean {
  const element = node as HTMLElement | null;
  if (!element || typeof element.matches !== "function") return true;
  try {
    return !element.matches(HD_EXCLUDE_SELECTORS);
  } catch {
    return true;
  }
}

/** Serialize the React Flow viewport to a high-resolution PNG download. */
export async function exportCanvasPng(filename = "archstudio-diagram.png", pixelRatio = 3): Promise<void> {
  const root = document.querySelector(".react-flow") as HTMLElement | null;
  if (!root) throw new Error("Le canvas n'est pas prêt pour l'export.");
  const rect = root.getBoundingClientRect();
  const shot = await loadShot();
  if (shot?.toPng) {
    const dataUrl = await shot.toPng(root, {
      cacheBust: true,
      pixelRatio,
      filter: hdFilter,
      backgroundColor: "#f8fafc",
      width: Math.max(1, Math.floor(rect.width)),
      height: Math.max(1, Math.floor(rect.height)),
    });
    triggerDownload(dataUrl, filename);
    return;
  }
  const svg = buildFallbackSvg(rect.width, rect.height);
  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);
  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(rect.width * 2));
    canvas.height = Math.max(1, Math.floor(rect.height * 2));
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Le contexte Canvas 2D n'est pas disponible.");
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    triggerDownload(canvas.toDataURL("image/png"), filename);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const loadShot = async (): Promise<{
  toPng?: (node: HTMLElement, opts: Record<string, unknown>) => Promise<string>;
  toSvg?: (node: HTMLElement, opts: Record<string, unknown>) => Promise<string>;
} | null> => {
  try {
    // Real dependency (see package.json); dynamic import keeps it out of the
    // initial bundle and avoids referencing `document` during SSR.
    const mod = await import("html-to-image");
    return { toPng: mod.toPng, toSvg: mod.toSvg };
  } catch {
    return null;
  }
};

/** Export the canvas as a clean vector SVG (nodes + edges only). */
export async function exportCanvasSvg(filename = "archstudio-diagram.svg"): Promise<void> {
  const root = document.querySelector(".react-flow") as HTMLElement | null;
  if (!root) throw new Error("Le canvas n'est pas prêt pour l'export.");
  const shot = await loadShot();
  if (shot?.toSvg) {
    const dataUrl = await shot.toSvg(root, {
      cacheBust: true,
      filter: hdFilter,
      backgroundColor: "#f8fafc",
    });
    triggerDownload(dataUrl, filename);
    return;
  }
  const rect = root.getBoundingClientRect();
  downloadTextFile(filename, buildFallbackSvg(rect.width, rect.height), "image/svg+xml;charset=utf-8");
}

/**
 * Full project archive: every generated artifact (Prisma, SQL dialects, TS,
 * Zod, migration report, raw JSON) plus a README — downloaded as one .zip.
 */
export async function exportProjectZip(ast: SchemaAst, filename = "archstudio-project.zip"): Promise<void> {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const files = generateCodeFiles(ast);
  for (const file of files) {
    zip.file(file.filename, file.content);
  }
  // Legacy aliases + raw AST for round-trip imports.
  zip.file("schema.prisma", compileToPrisma(ast));
  zip.file("schema.sql", compileToSql(ast));
  zip.file("schema.json", JSON.stringify(ast, null, 2));
  zip.file(
    "README.md",
    `# ArchStudio — export du projet\n\nGénéré le ${new Date().toISOString()}.\n\n## Contenu\n\n${files.map((f) => `- \`${f.filename}\` — ${f.label}`).join("\n")}\n- \`schema.json\` — AST brut (réimportable via Importer)\n- \`schema.prisma\` / \`schema.sql\` — alias directs\n\n## Reprise\n\nOuvrez le dossier dans ArchStudio via Importer (Prisma / SQL / JSON).\n`,
  );
  const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
  const url = URL.createObjectURL(blob);
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

const triggerDownload = (dataUrl: string, filename: string): void => {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
};

const loadImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = (): void => resolve(img);
    img.onerror = (): void => reject(new Error("Échec de la rastérisation du diagramme."));
    img.src = url;
  });

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const buildFallbackSvg = (width: number, height: number): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.floor(width)}" height="${Math.floor(height)}"><rect width="100%" height="100%" fill="#f8fafc"/><text x="24" y="48" fill="#0f172a" font-family="monospace" font-size="16">${esc("Diagramme ArchStudio")}</text><text x="24" y="72" fill="#64748b" font-family="monospace" font-size="12">${esc("Exportez le canvas lorsqu'un diagramme est visible.")}</text></svg>`;

/** Download a text artifact (JSON / Prisma / SQL). */
export function downloadTextFile(filename: string, content: string, mime = "text/plain;charset=utf-8"): void {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
