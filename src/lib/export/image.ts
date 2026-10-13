"use client";

/** Serialize the React Flow viewport to a high-resolution PNG download. */
export async function exportCanvasPng(filename = "archstudio-diagram.png"): Promise<void> {
  const root = document.querySelector(".react-flow") as HTMLElement | null;
  if (!root) throw new Error("Canvas not ready for export.");
  const rect = root.getBoundingClientRect();
  const toPng = await loadToPng();
  if (toPng) {
    const dataUrl = await toPng(root, {
      cacheBust: true,
      pixelRatio: 2,
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
    if (!ctx) throw new Error("Canvas 2D not available.");
    ctx.fillStyle = "#09090b";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    triggerDownload(canvas.toDataURL("image/png"), filename);
  } finally {
    URL.revokeObjectURL(url);
  }
}

const loadToPng = async (): Promise<
  ((node: HTMLElement, opts: Record<string, unknown>) => Promise<string>) | null
> => {
  try {
    // Real dependency (see package.json); dynamic import keeps it out of the
    // initial bundle and avoids referencing `document` during SSR.
    const mod = await import("html-to-image");
    return mod.toPng ?? null;
  } catch {
    return null;
  }
};

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
    img.onerror = (): void => reject(new Error("Failed to rasterize diagram."));
    img.src = url;
  });

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const buildFallbackSvg = (width: number, height: number): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.floor(width)}" height="${Math.floor(height)}"><rect width="100%" height="100%" fill="#09090b"/><text x="24" y="48" fill="#fafafa" font-family="monospace" font-size="16">${esc("ArchStudio diagram")}</text><text x="24" y="72" fill="#a1a1aa" font-family="monospace" font-size="12">${esc("Export the canvas while a diagram is visible.")}</text></svg>`;

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
