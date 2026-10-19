"use client";

import { useState } from "react";
import { Check, Palette, UserRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { pushToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { AVATAR_COLORS } from "@/types";
import {
  DEFAULT_USERNAME,
  USERNAME_MAX_LENGTH,
  useProfileStore,
} from "@/store/profile-store";
import { useCollabStore } from "@/store/collab-store";
import { Avatar } from "./avatar";

/**
 * Profile editor (pseudo + accent color), opened from the topbar avatar badge.
 *
 * Pure light Modelizia design system: solid white surface, hairline
 * `slate-200` borders, `slate-800` text. On save the profile is persisted to
 * localStorage AND pushed to the collaboration store, which re-announces
 * presence so peers update the avatar stack + cursors in real time.
 */
export function ProfileModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const role = useCollabStore((s) => s.self.role);
  const [draftName, setDraftName] = useState("");
  const [draftColor, setDraftColor] = useState<string>(AVATAR_COLORS[0]);

  // Re-seed the draft from the persisted profile each time the modal opens.
  // Render-phase adjustment (React's "adjusting state when a prop changes"
  // pattern) instead of an effect: no cascading render, no setState-in-effect.
  // The profile store is already hydrated by the topbar before any open.
  const [seededOpen, setSeededOpen] = useState(open);
  if (open !== seededOpen) {
    setSeededOpen(open);
    if (open) {
      const profile = useProfileStore.getState();
      // Seed with the live session name when the user never picked a pseudo
      // (automatic `Hôte` / `Invité #N` default) so the draft shows what peers
      // currently see; an explicit choice always wins.
      setDraftName(
        profile.hasCustomUsername
          ? profile.username
          : useCollabStore.getState().self.name,
      );
      setDraftColor(profile.userColor);
    }
  }

  const trimmedName = draftName.trim();
  const canSave = trimmedName.length > 0;

  const save = (): void => {
    if (!canSave) return;
    const username = trimmedName.slice(0, USERNAME_MAX_LENGTH);
    // 1) Persist to localStorage.
    useProfileStore.getState().setProfile({ username, userColor: draftColor });
    // 2) Propagate to the live session (presence re-broadcast, lock badges…).
    useCollabStore.getState().applyProfile({ username, userColor: draftColor });
    pushToast("Profil mis à jour", {
      type: "success",
      description: "Pseudo et couleur appliqués à votre curseur et vos avatars.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="border border-slate-200 bg-white text-slate-800 ring-slate-200 sm:max-w-md"
        // `.glass-panel` (unlayered CSS) outranks Tailwind background
        // utilities — the inline style guarantees the exact solid-white
        // light-mode surface required by the design system.
        style={{ backgroundColor: "#ffffff" }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <UserRound className="size-4" /> Mon profil
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Votre pseudo et votre couleur sont visibles par les collaborateurs
            de la salle (curseurs, avatars, activité) et mémorisés sur cet
            appareil.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-4">
          {/* Live avatar preview */}
          <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <Avatar
              name={trimmedName || DEFAULT_USERNAME}
              color={draftColor}
              role={role}
            />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-800">
                {trimmedName || DEFAULT_USERNAME}
              </p>
              <p className="text-xs text-slate-500">
                Aperçu — curseur &amp; avatars
              </p>
            </div>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-700">Pseudo</span>
            <Input
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  save();
                }
              }}
              maxLength={USERNAME_MAX_LENGTH}
              placeholder={DEFAULT_USERNAME}
              className="border-slate-200 text-slate-800 placeholder:text-slate-400 focus-visible:border-slate-400"
            />
            <span className="text-xs text-slate-400">
              {trimmedName.length}/{USERNAME_MAX_LENGTH}
            </span>
          </label>

          <div className="flex flex-col gap-1.5 text-sm">
            <span className="flex items-center gap-1.5 font-medium text-slate-700">
              <Palette className="size-3.5" /> Couleur
            </span>
            <div
              className="flex flex-wrap gap-2"
              role="radiogroup"
              aria-label="Couleur du profil"
            >
              {AVATAR_COLORS.map((color) => {
                const selected = color === draftColor;
                return (
                  <button
                    key={color}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    aria-label={`Couleur ${color}`}
                    onClick={() => setDraftColor(color)}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full transition-transform hover:scale-110",
                      "outline-none focus-visible:ring-2 focus-visible:ring-slate-400",
                      selected
                        ? "ring-2 ring-slate-800 ring-offset-2 ring-offset-white"
                        : "ring-1 ring-slate-200",
                    )}
                    style={{ backgroundColor: color }}
                  >
                    {selected && (
                      <Check className="size-4 text-slate-800" aria-hidden />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-slate-200 pt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Annuler
            </Button>
            <Button size="sm" onClick={save} disabled={!canSave}>
              Enregistrer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

