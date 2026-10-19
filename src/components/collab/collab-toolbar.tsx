"use client";

import { useEffect, useState } from "react";
import {
  ChevronDown,
  Copy,
  LogIn,
  MapPin,
  Pencil,
  Plus,
  Share2,
} from "lucide-react";
import { Menu } from "@base-ui/react/menu";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { pushToast } from "@/components/ui/toast";
import { DEFAULT_ROOM_ID } from "@/lib/collab/transport";
import { useCollabStore } from "@/store/collab-store";
import { useProfileStore } from "@/store/profile-store";
import { Avatar } from "./avatar";
import { ShareModal, type ShareModalMode } from "./share-modal";
import { ProfileModal } from "./profile-modal";

/** Compact item style (h-8 uniforme) for the salon dropdown menu. */
const menuItemClass =
  "flex h-8 cursor-default items-center gap-2 rounded-md px-2 text-[13px] text-foreground outline-none select-none data-highlighted:bg-muted";

/**
 * Topbar collaboration widget — one unified, light session block:
 *
 * `[ Salon ▾ | avatars + « N en ligne » | profil | Partager ]`
 *
 * - **Dropdown « Salon : … »** — badge showing the active roomId; the menu
 *   offers « Créer un nouveau salon » (mints a unique `salon-xxxxxx` roomId,
 *   `joinRoom` rebinds the transport, URL synced via `history.pushState`),
 *   « Rejoindre un salon » (opens the ShareModal straight on the room-id
 *   input, `mode="join"`) and « Copier l'ID du salon » (clipboard + toast).
 * - **« Partager »** — the single primary action; opens the ShareModal with
 *   the invite link + participants.
 * - The presence cluster (avatars **or** status) opens the same modal; the
 *   pencil badge opens the ProfileModal (persisted pseudo + color). The
 *   secondary header tools (search, focus, shortcuts, activity) stay in
 *   `StudioHeader`, right of a discreet vertical divider.
 */
export function CollabToolbar() {
  const self = useCollabStore((s) => s.self);
  const participants = useCollabStore((s) => s.participants);
  const status = useCollabStore((s) => s.status);
  const roomId = useCollabStore((s) => s.roomId);
  const joinRoom = useCollabStore((s) => s.joinRoom);
  const [shareOpen, setShareOpen] = useState(false);
  /** Which view of the session modal to show (share link vs room-id entry). */
  const [shareMode, setShareMode] = useState<ShareModalMode>("share");
  const [profileOpen, setProfileOpen] = useState(false);

  // Load the persisted profile once on mount (client-only, idempotent) so the
  // avatar stack shows the configured pseudo before the room joins.
  useEffect(() => {
    useProfileStore.getState().hydrate();
  }, []);

  /** Open the session modal — either the share view or straight to the join field. */
  const openShare = (mode: ShareModalMode): void => {
    setShareMode(mode);
    setShareOpen(true);
  };

  /**
   * « Créer un salon » : mint a fresh unique roomId, switch the store to it
   * (`joinRoom` rebinds the BroadcastChannel / WebSocket to the new room key)
   * and keep the URL in sync via `history.pushState` — no page reload, exactly
   * like the Share modal's manual room entry.
   */
  const createRoom = (): void => {
    const nextRoom = `salon-${Math.random().toString(36).substring(2, 8)}`;
    joinRoom(undefined, undefined, nextRoom);
    window.history.pushState(
      null,
      "",
      `/studio?room=${encodeURIComponent(nextRoom)}`,
    );
    pushToast(`Salon créé : ${nextRoom}`, {
      type: "success",
      description: "Ouvrez « Partager » pour copier le lien d'invitation.",
    });
  };

  const connected = status !== "disconnected";
  /** Active room shown in the badge — falls back to the default room pre-join. */
  const activeRoom = roomId || DEFAULT_ROOM_ID;
  // Self first, then peers; cap the visible stack with a "+n" overflow chip.
  const stack = [self, ...participants];
  const MAX_VISIBLE = 4;
  const visible = stack.slice(0, MAX_VISIBLE);
  const overflow = stack.length - visible.length;

  /** « Copier l'ID du salon » — écrit l'ID actif dans le presse-papier. */
  const copyRoomId = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(activeRoom);
      pushToast("ID du salon copié !", {
        type: "success",
        description: activeRoom,
      });
    } catch {
      pushToast("Copie impossible — copiez l'ID manuellement", {
        type: "warning",
      });
    }
  };

  return (
    <>
      {/* ── Bloc session unifié & épuré : salon ▾ | présence | partager ── */}
      <div
        className="flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/80 py-1 pr-1 pl-2 shadow-sm backdrop-blur"
        data-export-hidden
      >
        {/* A. Dropdown « Salon : … » — créer / rejoindre / copier l'ID. */}
        <Menu.Root>
          <Menu.Trigger
            aria-label={`Salon actif : ${activeRoom} — actions du salon`}
            className="flex h-7 max-w-24 items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 text-xs font-medium text-slate-700 outline-none transition-colors hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-ring data-popup-open:bg-slate-100 lg:max-w-40"
          >
            <MapPin className="size-3.5 shrink-0 text-slate-500" aria-hidden />
            <span className="hidden shrink-0 text-slate-500 sm:inline">
              Salon :
            </span>
            <span className="truncate font-mono" title={activeRoom}>
              {activeRoom}
            </span>
            <ChevronDown
              className="size-3 shrink-0 text-slate-400"
              aria-hidden
            />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner
              side="bottom"
              align="center"
              sideOffset={6}
              className="z-50"
            >
              <Menu.Popup className="glass-panel min-w-56 rounded-xl p-1 shadow-xl ring-1 ring-foreground/10 backdrop-blur-md">
                <p className="px-2 pt-1.5 pb-1 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
                  Salon actif · <span className="font-mono">{activeRoom}</span>
                </p>
                <span aria-hidden className="mx-1 block h-px bg-border" />
                <Menu.Item className={menuItemClass} onClick={createRoom}>
                  <Plus className="size-3.5 text-slate-500" aria-hidden />
                  Créer un nouveau salon
                </Menu.Item>
                <Menu.Item
                  className={menuItemClass}
                  onClick={() => openShare("join")}
                >
                  <LogIn className="size-3.5 text-slate-500" aria-hidden />
                  Rejoindre un salon
                </Menu.Item>
                <span aria-hidden className="mx-1 block h-px bg-border" />
                <Menu.Item
                  className={menuItemClass}
                  onClick={() => void copyRoomId()}
                >
                  <Copy className="size-3.5 text-slate-500" aria-hidden />
                  Copier l&apos;ID du salon
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>

        <span aria-hidden className="h-5 w-px bg-slate-200" />

        {/* B. Présence : avatars + « N en ligne », puis badge profil. */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => openShare("share")}
            aria-label="Gérer la session collaborative (salon & participants)"
            className="flex items-center gap-2 rounded-full pr-1 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex items-center">
              {visible.map((user, i) => (
                <span
                  key={user.id}
                  className="-ml-2 first:ml-0 transition-transform hover:z-10 hover:-translate-y-0.5"
                  style={{ zIndex: visible.length - i }}
                >
                  <Avatar
                    name={user.name}
                    color={user.avatarColor}
                    role={user.role}
                    size="sm"
                  />
                </span>
              ))}
              {overflow > 0 && (
                <span className="-ml-2 flex size-6 items-center justify-center rounded-full bg-slate-200 text-[10px] font-semibold text-slate-600 ring-2 ring-white">
                  +{overflow}
                </span>
              )}
            </span>
            <span
              className={cn(
                "hidden items-center gap-1 text-xs font-medium xl:flex",
                connected ? "text-emerald-600" : "text-muted-foreground",
              )}
            >
              <span
                className={cn(
                  "size-1.5 rounded-full",
                  connected ? "bg-emerald-500" : "bg-slate-300",
                )}
              />
              {connected ? `${stack.length} en ligne` : "Hors ligne"}
            </span>
          </button>

          {/* Profile badge: edit the persisted pseudo + accent color anytime. */}
          <Tooltip label="Mon profil — pseudo & couleur" side="bottom">
            <button
              type="button"
              onClick={() => {
                useProfileStore.getState().hydrate();
                setProfileOpen(true);
              }}
              aria-label="Modifier mon profil"
              className="relative flex items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Avatar
                name={self.name}
                color={self.avatarColor}
                role={self.role}
                size="sm"
              />
              <span className="-right-1 -bottom-1 absolute flex size-3.5 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm">
                <Pencil className="size-2" aria-hidden />
              </span>
            </button>
          </Tooltip>
        </div>

        <span aria-hidden className="h-5 w-px bg-slate-200" />

        {/* C. Action principale unique : Partager — modale de lien d'invitation. */}
        <Button
          size="sm"
          variant="outline"
          className="rounded-full"
          onClick={() => openShare("share")}
        >
          <Share2 className="size-4" />
          <span>Partager</span>
        </Button>
      </div>

      <ShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        mode={shareMode}
      />
      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
