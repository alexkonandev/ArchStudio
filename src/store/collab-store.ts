"use client";

import { create } from "zustand";
import type {
  ActivityEntry,
  ActivityKind,
  CollabMessage,
  CollabRole,
  CollabUser,
  Comment,
  ConnectionStatus,
  TableLock,
} from "@/types";
import { AVATAR_COLORS, LOCK_TTL_MS } from "@/types";
import { createId, useGraphStore } from "@/store/graph-store";
import {
  guestUsername,
  HOST_USERNAME,
  USERNAME_MAX_LENGTH,
  useProfileStore,
} from "@/store/profile-store";
import { DEFAULT_ROOM_ID } from "@/lib/collab/transport";

/**
 * Outbound publish hook, registered by the sync adapter (see
 * `@/lib/collab/sync`). The store never imports the adapter directly — it just
 * emits messages through this ref, keeping the dependency one-directional and
 * the store usable without a transport (SSR / tests).
 */
let outbound: ((message: CollabMessage) => void) | null = null;

export function setCollabOutbound(
  fn: ((message: CollabMessage) => void) | null,
): void {
  outbound = fn;
}

/**
 * Whether the local display name currently comes from the automatic French
 * defaults (`Hôte` / `Invité #N`) rather than an explicit user choice. Auto
 * names may be re-assigned on collision (see `applyRemote`) — user-picked
 * names never are.
 */
let selfNameIsAuto = false;

/** Pick a deterministic pastel accent from a stable id. */
export const pickAvatarColor = (id: string): string => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
};

const newUserId = (): string =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `user-${Math.random().toString(36).slice(2)}`;

/** Maximum entries kept in the live activity feed (ring buffer). */
const ACTIVITY_LIMIT = 60;

export interface CollabStore {
  // --- Profile / room -------------------------------------------------------
  self: CollabUser;
  roomId: string;
  status: ConnectionStatus;
  participants: CollabUser[];

  // --- Shared collaborative state ------------------------------------------
  tableLocks: Record<string, TableLock>;
  comments: Comment[];
  activity: ActivityEntry[];
  /** Comment ids this session has already surfaced (unread pastille control). */
  seenCommentIds: string[];
  /** Table currently open in the comment drawer (null = closed). */
  activeCommentTableId: string | null;
  /** Whether the live activity feed sheet is open. */
  activityOpen: boolean;

  // --- Actions --------------------------------------------------------------
  joinRoom: (name?: string, role?: CollabRole, roomId?: string) => void;
  leaveRoom: () => void;
  updatePresence: () => void;
  setRole: (userId: string, role: CollabRole) => void;
  /** Apply an updated profile (pseudo + color) and re-announce presence. */
  applyProfile: (profile: { username: string; userColor: string }) => void;

  lockTable: (tableId: string) => void;
  releaseLock: (tableId: string) => void;
  isTableLockedByOther: (tableId: string) => TableLock | null;
  canEditTable: (tableId: string) => boolean;

  addComment: (tableId: string, text: string) => void;
  resolveComment: (commentId: string, resolved: boolean) => void;
  markThreadSeen: (tableId: string) => void;
  setActiveCommentTableId: (tableId: string | null) => void;
  setActivityOpen: (open: boolean) => void;
  pushActivity: (kind: ActivityKind, message: string, tableId?: string) => void;

  /** Apply a message received from a remote peer (no re-broadcast). */
  applyRemote: (message: CollabMessage) => void;
}

/**
 * Deterministic placeholder identity rendered during SSR + first client paint.
 * The real session identity (stable per-session id, plus a display name that is
 * either the user-configured pseudo or the automatic French default for the
 * room — `Hôte` / `Invité #N`) is resolved lazily on the first `joinRoom`
 * call — which only runs in a client effect (see CollabProvider), so nothing
 * random can cause an SSR hydration mismatch on the avatar stack.
 */
const PLACEHOLDER_ID = "local";
const initialSelf: CollabUser = {
  id: PLACEHOLDER_ID,
  name: "Vous",
  avatarColor: AVATAR_COLORS[0],
  role: "owner",
  lastActivity: 0,
};

export const useCollabStore = create<CollabStore>((set, get) => {
  const broadcast = (message: CollabMessage): void => {
    outbound?.(message);
  };

  const logActivity = (
    kind: ActivityKind,
    message: string,
    tableId?: string,
  ): void => {
    const self = get().self;
    const entry: ActivityEntry = {
      id: createId("act"),
      kind,
      authorId: self.id,
      authorName: self.name,
      message,
      createdAt: Date.now(),
      tableId,
    };
    set((state) => ({
      activity: [entry, ...state.activity].slice(0, ACTIVITY_LIMIT),
    }));
    if (get().status !== "disconnected") broadcast({ type: "activity", entry });
  };

  /** Human-readable table name for activity/comment messages (falls back to id). */
  const tableNameOf = (tableId: string): string =>
    useGraphStore
      .getState()
      .tables.find((t) => t.id === tableId)?.name ?? tableId;

  /**
   * Concise French default for the next join: the first participant of an
   * (apparently) empty room is the `Hôte`; everyone else gets the lowest free
   * `Invité #N`, based on the participants currently active in the session.
   */
  const pickAutoUsername = (): string => {
    const active = get().participants;
    if (active.length === 0) return HOST_USERNAME;
    const taken = new Set(active.map((p) => p.name));
    let n = 1;
    while (taken.has(guestUsername(n))) n += 1;
    return guestUsername(n);
  };

  return {
    self: initialSelf,
    roomId: "",
    status: "disconnected",
    participants: [],
    tableLocks: {},
    comments: [],
    activity: [],
    seenCommentIds: [],
    activeCommentTableId: null,
    activityOpen: false,

    joinRoom: (name, role, roomId) => {
      // Resolve the persisted profile (idempotent client-side hydration): the
      // user's configured pseudo + color replace the old random first names.
      useProfileStore.getState().hydrate();
      const profile = useProfileStore.getState();
      const typedName = name?.trim().slice(0, USERNAME_MAX_LENGTH);
      // A typed name (Share modal / onboarding) becomes the persisted profile.
      if (typedName) profile.setUsername(typedName);

      const current = get().self;
      // Lazily mint the stable per-session id on first join (client-only,
      // post-hydration) so SSR output stays deterministic. The id only drives
      // presence/echo bookkeeping — never the displayed name.
      const id = current.id === PLACEHOLDER_ID ? newUserId() : current.id;
      // Display name: an explicit typed name wins, then a persisted custom
      // pseudo, otherwise the automatic French default for this room
      // (`Hôte` for the creator, `Invité #N` for everyone else).
      const autoName = pickAutoUsername();
      const next: CollabUser = {
        id,
        name:
          typedName ||
          (profile.hasCustomUsername ? profile.username : autoName),
        avatarColor: profile.userColor || pickAvatarColor(id),
        role: role ?? current.role,
        lastActivity: Date.now(),
      };
      selfNameIsAuto = !typedName && !profile.hasCustomUsername;
      // Strict room scoping: the transport channel key (BroadcastChannel name /
      // WebSocket `?room=`) derives from this id — blanks fall back to the
      // current room, then to the shared default room (same resolution as
      // `resolveRoomId`), never to an empty channel key.
      set({
        self: next,
        roomId: roomId || get().roomId || DEFAULT_ROOM_ID,
        status: "connecting",
        participants: [],
      });
      // Announce ourselves so peers add us and reply with their presence, then
      // ask for the current schema: the peers already in the room (the "host")
      // answer with a `sync_state` snapshot so the newcomer is caught up
      // without a reload. On the very first join the wire may not be open yet —
      // `startCollabSync` re-emits both once it is (see `sync.ts`).
      broadcast({ type: "presence", user: next });
      broadcast({ type: "sync_request" });
    },

    leaveRoom: () => {
      const self = get().self;
      broadcast({ type: "bye", userId: self.id });
      set({ status: "disconnected", participants: [], tableLocks: {} });
    },

    updatePresence: () => {
      if (get().status === "disconnected") return;
      const self = get().self;
      const now = Date.now();
      // Refresh + re-broadcast any locks we still own so a long editing session
      // keeps its lock alive (deselect / tab-close / TTL still release it).
      const locks = get().tableLocks;
      let touched = false;
      const refreshedLocks: Record<string, TableLock> = {};
      for (const [id, lock] of Object.entries(locks)) {
        if (lock.userId === self.id) {
          const fresh: TableLock = { ...lock, timestamp: now };
          refreshedLocks[id] = fresh;
          broadcast({ type: "lock", lock: fresh });
          touched = true;
        } else {
          refreshedLocks[id] = lock;
        }
      }
      const refreshed: CollabUser = { ...self, lastActivity: now };
      set({
        self: refreshed,
        ...(touched ? { tableLocks: refreshedLocks } : {}),
      });
      broadcast({ type: "presence", user: refreshed });
    },

    setRole: (userId, role) => {
      const state = get();
      if (state.self.id === userId) {
        const updated: CollabUser = {
          ...state.self,
          role,
          lastActivity: Date.now(),
        };
        set({ self: updated });
        broadcast({ type: "presence", user: updated });
        return;
      }
      set({
        participants: state.participants.map((p) =>
          p.id === userId ? { ...p, role } : p,
        ),
      });
      broadcast({ type: "role", userId, role });
    },

    applyProfile: ({ username, userColor }) => {
      const state = get();
      const trimmed = username.trim().slice(0, USERNAME_MAX_LENGTH);
      const next: CollabUser = {
        ...state.self,
        ...(trimmed ? { name: trimmed } : {}),
        avatarColor: userColor,
        lastActivity: Date.now(),
      };
      // An explicit pseudo replaces any automatic `Hôte` / `Invité #N` default.
      if (trimmed) selfNameIsAuto = false;
      // Keep owned soft-locks in sync so lock badges show the new pseudo too.
      const tableLocks = Object.fromEntries(
        Object.entries(state.tableLocks).map(
          ([tableId, lock]): [string, TableLock] =>
            lock.userId === next.id
              ? [tableId, { ...lock, userName: next.name }]
              : [tableId, lock],
        ),
      );
      set({ self: next, tableLocks });
      if (state.status === "disconnected") return;
      // Re-announce presence so peers update our name/color on their stacks
      // and cursors; refresh our locks alongside.
      broadcast({ type: "presence", user: next });
      for (const lock of Object.values(tableLocks)) {
        if (lock.userId === next.id) broadcast({ type: "lock", lock });
      }
    },

    lockTable: (tableId) => {
      const self = get().self;
      const existing = get().tableLocks[tableId];
      // Don't steal a fresh lock owned by someone else.
      if (
        existing &&
        existing.userId !== self.id &&
        Date.now() - existing.timestamp < LOCK_TTL_MS
      ) {
        return;
      }
      const lock: TableLock = {
        tableId,
        userId: self.id,
        userName: self.name,
        timestamp: Date.now(),
      };
      set((state) => ({ tableLocks: { ...state.tableLocks, [tableId]: lock } }));
      broadcast({ type: "lock", lock });
    },

    releaseLock: (tableId) => {
      const self = get().self;
      const existing = get().tableLocks[tableId];
      if (!existing || existing.userId !== self.id) return;
      set((state) => {
        const next = { ...state.tableLocks };
        delete next[tableId];
        return { tableLocks: next };
      });
      broadcast({ type: "lock", lock: null });
    },

    isTableLockedByOther: (tableId) => {
      const lock = get().tableLocks[tableId];
      if (!lock || lock.userId === get().self.id) return null;
      if (Date.now() - lock.timestamp >= LOCK_TTL_MS) return null;
      return lock;
    },

    canEditTable: (tableId) => {
      // Viewers never edit, even their own selection.
      if (get().self.role === "viewer") return false;
      return !get().isTableLockedByOther(tableId);
    },

    addComment: (tableId, text) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const self = get().self;
      const comment: Comment = {
        id: createId("cmt"),
        tableId,
        authorId: self.id,
        authorName: self.name,
        text: trimmed,
        createdAt: Date.now(),
        resolved: false,
      };
      set((state) => ({
        comments: [...state.comments, comment],
        seenCommentIds: [...state.seenCommentIds, comment.id],
      }));
      broadcast({ type: "comment", comment });
      logActivity(
        "comment",
        `a commenté sur « ${tableNameOf(tableId)} »`,
        tableId,
      );
    },

    resolveComment: (commentId, resolved) => {
      set((state) => ({
        comments: state.comments.map((c) =>
          c.id === commentId ? { ...c, resolved } : c,
        ),
      }));
      broadcast({ type: "resolve", commentId, resolved });
    },

    markThreadSeen: (tableId) => {
      const ids = get()
        .comments.filter((c) => c.tableId === tableId)
        .map((c) => c.id);
      set((state) => {
        const merged = new Set([...state.seenCommentIds, ...ids]);
        return { seenCommentIds: [...merged] };
      });
    },

    setActiveCommentTableId: (tableId) => {
      set({ activeCommentTableId: tableId });
      if (tableId) get().markThreadSeen(tableId);
    },

    setActivityOpen: (open) => set({ activityOpen: open }),

    pushActivity: (kind, message, tableId) => logActivity(kind, message, tableId),

    applyRemote: (message) => {
      const state = get();
      switch (message.type) {
        case "presence": {
          if (message.user.id === state.self.id) return;
          set((s) => ({
            status: "connected",
            participants: [
              ...s.participants.filter((p) => p.id !== message.user.id),
              { ...message.user, lastActivity: Date.now() },
            ],
          }));
          // Auto-name collision: two sessions opening an empty room at the same
          // time can both pick `Hôte` before seeing each other. The tie-break is
          // deterministic — the greater session id yields, taking the lowest
          // free `Invité #N`, and re-announces. User-picked names never yield.
          const after = get();
          if (
            selfNameIsAuto &&
            message.user.name === after.self.name &&
            after.self.id > message.user.id
          ) {
            const taken = new Set([
              ...after.participants.map((p) => p.name),
              after.self.name,
            ]);
            let n = 1;
            while (taken.has(guestUsername(n))) n += 1;
            const renamed: CollabUser = {
              ...after.self,
              name: guestUsername(n),
              lastActivity: Date.now(),
            };
            set({ self: renamed });
            broadcast({ type: "presence", user: renamed });
          }
          return;
        }
        case "bye": {
          set((s) => ({
            participants: s.participants.filter((p) => p.id !== message.userId),
            tableLocks: Object.fromEntries(
              Object.entries(s.tableLocks).filter(
                ([, lock]) => lock.userId !== message.userId,
              ),
            ),
          }));
          return;
        }
        case "lock": {
          if (!message.lock) {
            // A `null` lock means the owner released; drop the first foreign lock.
            set((s) => {
              const foreign = Object.entries(s.tableLocks).find(
                ([, lock]) => lock.userId !== s.self.id,
              );
              if (!foreign) return s;
              const next = { ...s.tableLocks };
              delete next[foreign[0]];
              return { tableLocks: next };
            });
            return;
          }
          const lock = message.lock;
          set((s) => ({ tableLocks: { ...s.tableLocks, [lock.tableId]: lock } }));
          return;
        }
        case "comment": {
          if (state.comments.some((c) => c.id === message.comment.id)) return;
          set((s) => ({ comments: [...s.comments, message.comment] }));
          return;
        }
        case "resolve": {
          set((s) => ({
            comments: s.comments.map((c) =>
              c.id === message.commentId ? { ...c, resolved: message.resolved } : c,
            ),
          }));
          return;
        }
        case "activity": {
          if (state.activity.some((a) => a.id === message.entry.id)) return;
          set((s) => ({
            activity: [message.entry, ...s.activity].slice(0, ACTIVITY_LIMIT),
          }));
          return;
        }
        case "role": {
          if (message.userId === state.self.id) return;
          set((s) => ({
            participants: s.participants.map((p) =>
              p.id === message.userId ? { ...p, role: message.role } : p,
            ),
          }));
          return;
        }
        default:
          return;
      }
    },
  };
});

