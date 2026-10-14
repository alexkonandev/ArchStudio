"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Copy, Link2, Users } from "lucide-react";
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
import { useCollabStore } from "@/store/collab-store";
import { ROLE_META, Avatar } from "./avatar";
import type { CollabRole } from "@/types";

/** Build the shareable room link from the current origin + roomId. */
const buildShareLink = (roomId: string): string => {
  if (typeof window === "undefined") return `/?room=${roomId}`;
  const url = new URL(window.location.origin);
  url.searchParams.set("room", roomId);
  return url.toString();
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
 */
export function ShareModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const roomId = useCollabStore((s) => s.roomId);
  const status = useCollabStore((s) => s.status);
  const self = useCollabStore((s) => s.self);
  const participants = useCollabStore((s) => s.participants);
  const joinRoom = useCollabStore((s) => s.joinRoom);
  const setRole = useCollabStore((s) => s.setRole);
  const [copied, setCopied] = useState(false);

  const shareLink = useMemo(
    () => buildShareLink(roomId || "default"),
    [roomId],
  );
  const connected = status !== "disconnected";
  const isOwner = self.role === "owner";

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink);
      setCopied(true);
      pushToast("Lien du salon copié", { type: "success" });
    } catch {
      pushToast("Copie impossible — copiez le lien manuellement", {
        type: "warning",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="size-4" /> Partager la session
          </DialogTitle>
          <DialogDescription>
            Invitez votre équipe à rejoindre ce salon. Modifications, verrous et
            commentaires se synchronisent en temps réel entre les onglets.
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

          <div className="flex items-center gap-2">
            <span
              className={cn(
                "size-2 rounded-full",
                connected ? "bg-emerald-500" : "bg-slate-300",
              )}
            />
            <span className="text-xs text-muted-foreground">
              {connected
                ? `Connecté au salon « ${roomId || "default"} »`
                : "Hors ligne"}
            </span>
          </div>

          {!connected && (
            <Button
              className="w-full"
              onClick={() => {
                joinRoom(self.name, self.role, roomId || "default");
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
                placeholder="Votre nom"
                className="h-8 flex-1"
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
