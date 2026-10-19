"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Link2, LogIn, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { pushToast } from "@/components/ui/toast";
import { DEFAULT_ROOM_ID } from "@/lib/collab/transport";
import { useCollabStore } from "@/store/collab-store";
import { USERNAME_MAX_LENGTH } from "@/store/profile-store";
import { ROLE_META, Avatar } from "./avatar";
import type { CollabRole } from "@/types";

/** Build the shareable `/studio` room link from the browser origin + roomId. */
const buildShareLink = (roomId: string): string => {
  if (typeof window === "undefined") {
    return `/studio?room=${encodeURIComponent(roomId)}`;
  }
  const shareUrl = `${window.location.origin}/studio?room=${encodeURIComponent(roomId)}`;
  return shareUrl;
};

const ROLE_KEYS = Object.keys(ROLE_META) as CollabRole[];

function RoleSelect({
  value,
  onChange,
  className,
}: {
  value: CollabRole;
  onChange: (role: CollabRole) => void;
  className?: string;
}) {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as CollabRole)}>
      <SelectTrigger className={className}>
        {ROLE_META[value].label}
      </SelectTrigger>
      <SelectContent>
        {ROLE_KEYS.map((r) => (
          <SelectItem key={r} value={r}>
            {ROLE_META[r].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * Share / join dialog: generates the room link, lets the local user set their
 * display name + role, and lists participants with an owner-only role switcher.
 *
 * `mode="join"` (opened from the topbar's « Rejoindre un salon ») adapts the
 * title/description and moves focus straight onto the room-id input.
 */
export type ShareModalMode = "share" | "join";

export function ShareModal({
  open,
  onOpenChange,
  mode = "share",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `join` opens the dialog directly on the room-id input (topbar action). */
  mode?: ShareModalMode;
}) {
  const roomId = useCollabStore((s) => s.roomId);
  const status = useCollabStore((s) => s.status);
  const self = useCollabStore((s) => s.self);
  const participants = useCollabStore((s) => s.participants);
  const joinRoom = useCollabStore((s) => s.joinRoom);
  const setRole = useCollabStore((s) => s.setRole);
  const [copied, setCopied] = useState(false);
  /** Room id typed in the "Rejoindre ou créer un salon" field. */
  const [draftRoom, setDraftRoom] = useState("");

  const shareLink = useMemo(
    () => buildShareLink(roomId || DEFAULT_ROOM_ID),
    [roomId],
  );
  const connected = status !== "disconnected";
  const isOwner = self.role === "owner";

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  // « Rejoindre un salon » (topbar) opens the dialog directly on the room-id
  // field: Base UI moves focus into the popup on mount, so re-focus the input
  // on the next frame — only in join mode, only while the dialog is open.
  useEffect(() => {
    if (!open || mode !== "join") return;
    const frame = requestAnimationFrame(() => {
      document.getElementById("collab-join-room")?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [open, mode]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      pushToast("Lien du salon copié !", { type: "success" });
    } catch {
      pushToast("Copie impossible — copiez le lien manuellement", {
        type: "warning",
      });
    }
  };

  /**
   * Join (or create) a room typed by the user.
   *
   * 1. The store switches to the new room (`joinRoom` — the roomId is the 3rd
   *    argument, the profile name/role are kept); the CollabProvider rebinds
   *    the transport (BroadcastChannel / WebSocket) to it.
   * 2. The URL is kept in sync via `history.pushState` — no page reload. Next.js
   *    patches the History API: it copies its internal history state onto the
   *    new entry (a `null` `data` is fine) and re-renders `useSearchParams()`
   *    consumers.
   * 3. A toast confirms the switch.
   */
  const joinFromInput = (): void => {
    const nextRoom = draftRoom.trim();
    if (!nextRoom) return;
    joinRoom(undefined, undefined, nextRoom);
    window.history.pushState(
      null,
      "",
      `/studio?room=${encodeURIComponent(nextRoom)}`,
    );
    pushToast(`Salon rejoint : ${nextRoom}`, { type: "success" });
    setDraftRoom("");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === "join" ? (
              <>
                <LogIn className="size-4" /> Rejoindre un salon
              </>
            ) : (
              <>
                <Users className="size-4" /> Partager la session
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {mode === "join"
              ? "Saisissez l'identifiant du salon à rejoindre : le schéma, la présence et les verrous se synchronisent immédiatement avec les autres participants."
              : "Invitez votre équipe à rejoindre ce salon. Modifications, verrous et commentaires se synchronisent en temps réel entre les onglets."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">
              Lien du salon
            </label>
            <div className="flex gap-2">
              <Input readOnly value={shareLink} className="font-mono text-xs" />
              <Tooltip label={copied ? "Copié !" : "Copier le lien"} side="top">
                <Button
                  size="icon"
                  variant="outline"
                  onClick={copyLink}
                  aria-label="Copier le lien du salon"
                >
                  {copied ? (
                    <Check className="size-4 text-emerald-600" />
                  ) : (
                    <Copy className="size-4" />
                  )}
                </Button>
              </Tooltip>
            </div>
          </div>

          {/* Manual room entry: switch to (or create) any room by its id. */}
          <div className="space-y-1.5">
            <label
              htmlFor="collab-join-room"
              className="text-xs font-medium text-muted-foreground"
            >
              Rejoindre ou créer un salon
            </label>
            <div className="flex gap-2">
              <Input
                id="collab-join-room"
                value={draftRoom}
                onChange={(event) => setDraftRoom(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    joinFromInput();
                  }
                }}
                placeholder="Ex: projet-beta"
                maxLength={64}
                className="font-mono text-xs"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={joinFromInput}
                disabled={draftRoom.trim().length === 0}
              >
                <Link2 className="size-4" /> Rejoindre
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "size-2 rounded-full",
                connected ? "bg-emerald-500" : "bg-slate-300",
              )}
            />
            <span className="text-xs text-muted-foreground">
              {connected
                ? `Connecté au salon « ${roomId || DEFAULT_ROOM_ID} »`
                : "Hors ligne"}
            </span>
          </div>

          {!connected && (
            <Button
              className="w-full"
              onClick={() => {
                joinRoom(self.name, self.role, roomId || DEFAULT_ROOM_ID);
                onOpenChange(false);
                pushToast("Session collaborative démarrée", {
                  type: "success",
                });
              }}
            >
              <Link2 className="size-4" /> Démarrer la session
            </Button>
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Votre profil
            </p>
            <div className="flex items-center gap-2">
              <Avatar name={self.name} color={self.avatarColor} role={self.role} />
              <Input
                value={self.name}
                onChange={(e) => joinRoom(e.target.value, self.role, roomId)}
                placeholder="Votre pseudo"
                maxLength={USERNAME_MAX_LENGTH}
                className="h-8 flex-1 border-slate-200 text-slate-800"
              />
              <RoleSelect
                value={self.role}
                onChange={(r) => setRole(self.id, r)}
                className="h-8 w-32"
              />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Participants ({participants.length + (connected ? 1 : 0)})
            </p>
            <ul className="max-h-40 space-y-1.5 overflow-y-auto">
              <li className="flex items-center gap-2 rounded-md px-1.5 py-1">
                <Avatar
                  name={self.name}
                  color={self.avatarColor}
                  role={self.role}
                  size="sm"
                />
                <span className="truncate text-sm">{self.name}</span>
                <span className={cn("ml-auto text-xs", ROLE_META[self.role].text)}>
                  {ROLE_META[self.role].label} (vous)
                </span>
              </li>
              {participants.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center gap-2 rounded-md px-1.5 py-1"
                >
                  <Avatar
                    name={p.name}
                    color={p.avatarColor}
                    role={p.role}
                    size="sm"
                  />
                  <span className="truncate text-sm">{p.name}</span>
                  {isOwner ? (
                    <RoleSelect
                      value={p.role}
                      onChange={(r) => setRole(p.id, r)}
                      className="ml-auto h-7 w-28 text-xs"
                    />
                  ) : (
                    <span className={cn("ml-auto text-xs", ROLE_META[p.role].text)}>
                      {ROLE_META[p.role].label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
