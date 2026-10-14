"use client";

import { useEffect } from "react";
import { CodeStudio } from "@/components/code-studio/code-studio";
import { useGraphStore } from "@/store/graph-store";

/**
 * Dedicated `/studio/code` route: a full-screen IDE-style workspace over the
 * shared graph schema. The Zustand store is a persisted singleton, so the
 * schema edited on the canvas (`/studio`) is available here and vice-versa. We
 * hydrate from localStorage on mount so a direct visit reflects the latest
 * saved schema.
 */
export default function CodeStudioPage() {
  const hydrateFromStorage = useGraphStore((state) => state.hydrateFromStorage);

  useEffect(() => {
    hydrateFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      <CodeStudio />
    </div>
  );
}
