/**
 * Domain model for ArchStudio advanced collaboration & governance.
 *
 * Framework-agnostic types shared by the collaboration store, the
 * BroadcastChannel sync adapter and every collab-aware UI component.
 */

/** RBAC role of a participant inside a room. */
export type CollabRole = "owner" | "editor" | "viewer";

/** Live connection status of the local session. */
export type ConnectionStatus = "connected" | "connecting" | "disconnected";

/** A connected participant (self or a remote peer). */
export interface CollabUser {
  id: string;
  name: string;
  /** Pastel accent (hex) used by the avatar stack + cursors. */
  avatarColor: string;
  role: CollabRole;
  /** Epoch ms of the last presence heartbeat / activity. */
  lastActivity: number;
}

/** A soft edit-lock held on a table while someone is editing it. */
export interface TableLock {
  tableId: string;
  userId: string;
  userName: string;
  /** Epoch ms the lock was (re)asserted; used for staleness pruning. */
  timestamp: number;
}

/** A threaded comment anchored to a table. */
export interface Comment {
  id: string;
  tableId: string;
  authorId: string;
  authorName: string;
  text: string;
  createdAt: number;
  resolved: boolean;
}

/** Kind of team action recorded in the live activity feed. */
export type ActivityKind =
  | "join"
  | "leave"
  | "create"
  | "delete"
  | "rename"
  | "field"
  | "normalize"
  | "comment"
  | "lock"
  | "role";

/** A single entry in the live activity feed. */
export interface ActivityEntry {
  id: string;
  kind: ActivityKind;
  authorId: string;
  authorName: string;
  message: string;
  createdAt: number;
  tableId?: string;
}

/**
 * Wire protocol broadcast over {@link BroadcastChannel} between tabs / windows
 * sharing the same room. Every mutation of shared collab state is expressed as
 * one of these messages so remote peers can converge on the same snapshot.
 */
export type CollabMessage =
  | { type: "presence"; user: CollabUser }
  | { type: "bye"; userId: string }
  | { type: "lock"; lock: TableLock | null }
  | { type: "comment"; comment: Comment }
  | { type: "resolve"; commentId: string; resolved: boolean }
  | { type: "activity"; entry: ActivityEntry }
  | { type: "role"; userId: string; role: CollabRole };

/** Pastel avatar palette (light fills with a matching readable text tone). */
export const AVATAR_COLORS = [
  "#a7f3d0",
  "#bfdbfe",
  "#fbcfe8",
  "#fde68a",
  "#ddd6fe",
  "#fed7aa",
  "#bbf7d0",
  "#c7d2fe",
] as const;

/** Soft-lock time-to-live: a lock with no refresh for this long is released. */
export const LOCK_TTL_MS = 20_000;
/** Presence heartbeat interval between two `presence` broadcasts. */
export const PRESENCE_HEARTBEAT_MS = 2_500;
/** A peer is pruned once silent for this long. */
export const PRESENCE_STALE_MS = 9_000;
