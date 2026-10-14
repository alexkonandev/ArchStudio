"use client";

import { useState } from "react";
import { Share2, Activity as ActivityIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useCollabStore } from "@/store/collab-store";
import { Avatar } from "./avatar";
import { ShareModal } from "./share-modal";

/**
 * Topbar collaboration widget: an overlapping avatar stack (self + peers, with
 * role tooltips) plus share / activity buttons. Clicking the stack opens the
 * ShareModal; the lightning icon toggles the live activity feed.
 */
export function CollabToolbar() {
  const self = useCollabStore((s) => s.self);
  const participants = useCollabStore((s) => s.participants);
  const status = useCollabStore((s) => s.status);
  const activityOpen = useCollabStore((s) => s.activityOpen);
  const setActivityOpen = useCollabStore((s) => s.setActivityOpen);
  const [shareOpen, setShareOpen] = useState(false);

  const connected = status !== "disconnected";
  // Self first, then peers; cap the visible stack with a "+n" overflow chip.
  const stack = [self, ...participants];
  const MAX_VISIBLE = 4;
  const visible = stack.slice(0, MAX_VISIBLE);
  const overflow = stack.length - visible.length;

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShareOpen(true)}
          aria-label="Gérer la session collaborative"
          className="flex items-center"
          data-export-hidden
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
        </button>

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

        <Button
          size="icon"
          variant="ghost"
          className="size-8"
          onClick={() => setActivityOpen(true)}
          aria-label="Journal d'activité"
          aria-pressed={activityOpen}
          data-export-hidden
        >
          <ActivityIcon className="size-4" />
        </Button>

        <Button
          size="sm"
          variant="outline"
          onClick={() => setShareOpen(true)}
          data-export-hidden
        >
          <Share2 className="size-4" />
          <span className="hidden lg:inline">Partager</span>
        </Button>
      </div>

      <ShareModal open={shareOpen} onOpenChange={setShareOpen} />
    </>
  );
}
