"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Kbd, formatShortcut } from "@/components/ui/kbd";
import { useCheatsheet } from "@/hooks/use-cheatsheet";
import { useState } from "react";

interface ShortcutGroup {
  title: string;
  items: { keys: string; label: string }[];
}

/** Single source of truth for the cheatsheet: only real, implemented shortcuts. */
const GROUPS: ShortcutGroup[] = [
  {
    title: "Canvas",
    items: [
      { keys: "mod+z", label: "Annuler" },
      { keys: "mod+shift+z", label: "Rétablir" },
      { keys: "V", label: "Outil sélection" },
      { keys: "H", label: "Outil main (pan)" },
      { keys: "Espace", label: "Pan temporaire (maintenir)" },
      { keys: "mod+d", label: "Dupliquer la table sélectionnée" },
      { keys: "del", label: "Supprimer la sélection" },
      { keys: "shift+z", label: "Focus Graphe (plein écran canvas)" },
      { keys: "Échap", label: "Quitter le Focus Graphe" },
      { keys: "Échap", label: "Désélectionner" },
    ],
  },
  {
    title: "Navigation & aide",
    items: [
      { keys: "?", label: "Ouvrir cette aide" },
      { keys: "mod+s", label: "Télécharger le fichier actif (Code Studio)" },
    ],
  },
  {
    title: "Code Studio",
    items: [
      { keys: "mod+z", label: "Annuler (historique global du schéma)" },
      { keys: "mod+shift+z", label: "Rétablir (historique global du schéma)" },
      { keys: "alt+z", label: "Basculer le mode Zen" },
      { keys: "Échap", label: "Quitter le mode Zen" },
    ],
  },
];

function ShortcutKeys({ keys }: { keys: string }) {
  return (
    <span className="flex shrink-0 items-center gap-0.5">
      {formatShortcut(keys).map((key) => (
        <Kbd key={key}>{key}</Kbd>
      ))}
    </span>
  );
}

/**
 * Keyboard cheatsheet modal. Opened globally with `?` (see {@link useCheatsheet})
 * and also renderable in a controlled mode for a header "?" button.
 */
export function ShortcutsDialog({
  open,
  onOpenChange,
}: {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  useCheatsheet(setInternalOpen);
  // Dual mode: `?` opens via the internal state, a header "?" button drives
  // the controlled props. Closing syncs both so the dialog never sticks open.
  const isOpen = (open ?? false) || internalOpen;
  const setOpen = (value: boolean) => {
    onOpenChange?.(value);
    setInternalOpen(value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Raccourcis clavier</DialogTitle>
          <DialogDescription>
            Gagnez du temps avec ces raccourcis. Appuyez sur <Kbd>?</Kbd> pour
            rouvrir cette aide.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {group.title}
              </h3>
              <ul className="space-y-1.5">
                {group.items.map((item) => (
                  <li
                    key={item.keys + item.label}
                    className="flex items-center justify-between gap-3 rounded-md px-2 py-1 text-sm odd:bg-muted/40"
                  >
                    <span className="text-foreground">{item.label}</span>
                    <ShortcutKeys keys={item.keys} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
