"use client";

import { ListTree, Settings2, Stethoscope, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import type { OutlineSymbol } from "@/lib/engine/outline";
import type { CodegenOptions, RightSidebarTab } from "@/store/code-workspace-store";
import { OutlinePanel } from "./outline-panel";
import { ConfigPanel } from "./config-panel";
import { DiagnosticsPanel } from "./diagnostics-panel";

/** Tab metadata: icon + label + accessible description. */
const TABS: { id: RightSidebarTab; label: string; icon: LucideIcon; hint: string }[] = [
  { id: "outline", label: "Outline", icon: ListTree, hint: "Explorateur de symboles" },
  { id: "config", label: "Config", icon: Settings2, hint: "Paramètres du schéma" },
  { id: "diagnostics", label: "Diagnostics", icon: Stethoscope, hint: "Santé & robustesse" },
];

/**
 * Modular right sidebar for the Code Studio: a segmented (pill) tab strip over
 * three interchangeable panels — Outline (symbol explorer), Config (generation
 * settings) and Diagnostics (health / robustness). The active tab lives in the
 * workspace Zustand store so it survives file switches.
 *
 * Fixed width is owned by the parent (`w-96`), so this never overlaps Monaco.
 * Pure light design: white surface, `slate-200` borders, `slate-100` track with
 * a `bg-white shadow-sm` active pill.
 */
export function RightSidebar({
  activeTab,
  onTabChange,
  symbols,
  onRevealLine,
  codegenOptions,
  onCodegenChange,
  diagnostics,
}: {
  activeTab: RightSidebarTab;
  onTabChange: (tab: RightSidebarTab) => void;
  symbols: OutlineSymbol[];
  onRevealLine: (line: number) => void;
  codegenOptions: CodegenOptions;
  onCodegenChange: (patch: Partial<CodegenOptions>) => void;
  diagnostics: React.ComponentProps<typeof DiagnosticsPanel>;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-white">
      {/* Segmented tab strip */}
      <div className="shrink-0 border-b border-slate-200 p-2">
        <div
          role="tablist"
          aria-label="Panneau latéral du studio"
          className="flex items-center gap-1 rounded-lg bg-slate-100 p-1"
        >
          {TABS.map((tab) => {
            const active = tab.id === activeTab;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                aria-controls={`panel-${tab.id}`}
                id={`tab-${tab.id}`}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all",
                  active
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-800",
                )}
              >
                <Icon className="size-3.5 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active panel */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <div
          role="tabpanel"
          id="panel-outline"
          aria-labelledby="tab-outline"
          hidden={activeTab !== "outline"}
          className="h-full"
        >
          {activeTab === "outline" && (
            <OutlinePanel symbols={symbols} onReveal={onRevealLine} />
          )}
        </div>
        <div
          role="tabpanel"
          id="panel-config"
          aria-labelledby="tab-config"
          hidden={activeTab !== "config"}
          className="h-full"
        >
          {activeTab === "config" && (
            <ConfigPanel options={codegenOptions} onChange={onCodegenChange} />
          )}
        </div>
        <div
          role="tabpanel"
          id="panel-diagnostics"
          aria-labelledby="tab-diagnostics"
          hidden={activeTab !== "diagnostics"}
          className="h-full"
        >
          {activeTab === "diagnostics" && <DiagnosticsPanel {...diagnostics} />}
        </div>
      </div>
    </div>
  );
}
