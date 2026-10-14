import { Database, Frame, MessageSquare, Layers, MousePointer2, ShieldCheck, Wand2 } from "lucide-react";

function MockNode({ className, title, color, rows, highlight = false }: { className?: string; title: string; color: string; rows: readonly string[]; highlight?: boolean }) {
  const dot = color === "indigo" ? "bg-indigo-500" : color === "sky" ? "bg-sky-500" : "bg-fuchsia-500";
  return (
    <div className={`absolute rounded-xl border border-slate-200 bg-white/95 p-2 shadow-md backdrop-blur-sm ${highlight ? "ring-2 ring-indigo-400" : ""} ${className ?? ""}`}>
      <div className="flex items-center gap-1.5 border-b border-slate-100 pb-1.5">
        <span className={`size-2 rounded-full ${dot}`} />
        <span className="text-xs font-semibold text-slate-700">{title}</span>
      </div>
      <ul className="mt-1.5 space-y-1">
        {rows.map((r) => (
          <li key={r} className="truncate rounded bg-slate-50 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">{r}</li>
        ))}
      </ul>
    </div>
  );
}

export function CanvasPreview() {
  return (
    <section id="demo" className="mx-auto max-w-6xl scroll-mt-20 px-4 pb-10 sm:px-6">
      <div className="relative">
        <div className="glass-panel relative overflow-hidden rounded-2xl border shadow-2xl">
          <div className="flex items-center gap-3 border-b border-border/60 px-4 py-2.5">
            <span className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Database className="size-4" />
            </span>
            <span className="text-sm font-semibold">Mon schéma</span>
            <span className="ml-2 hidden items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-600 sm:inline-flex">
              <ShieldCheck className="size-3.5" /> 96 % · Maître des BDD
            </span>
            <span className="ml-auto flex items-center gap-1.5">
              <span className="hidden size-7 items-center justify-center rounded-md border border-border text-muted-foreground sm:flex"><MousePointer2 className="size-3.5" /></span>
              <span className="hidden size-7 items-center justify-center rounded-md border border-border text-muted-foreground sm:flex"><Frame className="size-3.5" /></span>
            </span>
          </div>
          <div className="relative h-72 bg-[radial-gradient(theme(colors.slate.200/0.8)_1px,transparent_1px)] [background-size:16px_16px] sm:h-80">
            <MockNode className="left-[8%] top-8 w-40 sm:left-[12%]" title="User" color="indigo" rows={["id · uuid", "email · text", "name · text"]} />
            <MockNode className="left-1/2 top-1/2 w-40 -translate-x-1/2 -translate-y-1/2" title="Post" color="sky" rows={["id · uuid", "title · text", "authorId · uuid"]} highlight />
            <MockNode className="right-[8%] top-10 w-36 sm:right-[12%]" title="Comment" color="fuchsia" rows={["id · uuid", "body · text", "postId · uuid"]} />
            <svg aria-hidden className="pointer-events-none absolute inset-0 h-full w-full" fill="none">
              <path d="M150 70 C 260 70, 300 150, 360 150" stroke="currentColor" className="text-slate-300" strokeWidth="2" strokeDasharray="5 5" />
              <path d="M520 60 C 470 90, 470 120, 440 150" stroke="currentColor" className="text-slate-300" strokeWidth="2" strokeDasharray="5 5" />
            </svg>
            <div className="absolute left-1/2 top-1/2 z-10 flex -translate-x-1/2 translate-y-8 items-center gap-0.5 rounded-lg border border-slate-200 bg-white/90 p-1 shadow-lg backdrop-blur-md">
              <span className="flex size-6 items-center justify-center rounded text-slate-500"><Wand2 className="size-3.5" /></span>
              <span className="flex size-6 items-center justify-center rounded text-slate-500"><Layers className="size-3.5" /></span>
              <span className="flex size-6 items-center justify-center rounded text-slate-500"><MessageSquare className="size-3.5" /></span>
            </div>
            <div className="absolute bottom-4 right-4 flex flex-col overflow-hidden rounded-lg border border-slate-200 bg-white/90 shadow-md">
              <span className="flex size-7 items-center justify-center text-slate-500">+</span>
              <span className="h-px bg-slate-200" />
              <span className="flex size-7 items-center justify-center text-slate-500">−</span>
            </div>
          </div>
        </div>
        <div className="pointer-events-none absolute right-10 top-24 hidden items-center gap-1 sm:flex">
          <MousePointer2 className="size-4 text-fuchsia-500" />
          <span className="rounded-md bg-fuchsia-500 px-1.5 py-0.5 text-[10px] font-medium text-white">Alice</span>
        </div>
        <div className="pointer-events-none absolute bottom-16 left-8 hidden items-center gap-1 sm:flex">
          <MousePointer2 className="size-4 text-sky-500" />
          <span className="rounded-md bg-sky-500 px-1.5 py-0.5 text-[10px] font-medium text-white">Bob</span>
        </div>
      </div>
    </section>
  );
}
