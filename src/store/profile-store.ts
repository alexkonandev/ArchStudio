"use client";

import { create } from "zustand";
import { AVATAR_COLORS } from "@/types";

/**
 * Persistent user profile store (localStorage-backed).
 *
 * Replaces the old randomly generated first names: the identity shown on
 * avatars, remote cursors and presence broadcasts is whatever the user
 * configures here — a display name (`username`) and an accent color
 * (`userColor`) shared with every peer over the collaboration transport.
 *
 * SSR safety: the store starts from deterministic defaults and is hydrated
 * lazily in client effects (`hydrate()` is idempotent and also runs from
 * `joinRoom` / the profile modal), so server HTML and the first client render
 * always match — no hydration mismatch on the avatar stack.
 */
export const PROFILE_STORAGE_KEY = "modelizia_profile_v1";

/**
 * Concise French defaults for live sessions (never random first names): the
 * room creator shows up as `Hôte`, every later joiner as the lowest free
 * `Invité #1`, `Invité #2`, … These are SESSION-scoped — assigned by
 * `collab-store.joinRoom` on every join, never persisted. Only a pseudo
 * explicitly picked by the user is stored as `username`.
 */
export const HOST_USERNAME = "Hôte";
export const GUEST_USERNAME_PREFIX = "Invité #";

/** Sequential guest pseudo — `Invité #1`, `Invité #2`, … */
export const guestUsername = (index: number): string =>
  `${GUEST_USERNAME_PREFIX}${index}`;

/** Fallback when a stored/typed pseudo is empty (also the modal placeholder). */
export const DEFAULT_USERNAME = HOST_USERNAME;

/** Upper bound for the display name (chars), enforced on read + write. */
export const USERNAME_MAX_LENGTH = 24;

export interface UserProfile {
  username: string;
  userColor: string;
}

export interface ProfileStore extends UserProfile {
  /** Whether localStorage has been read for this session. */
  hydrated: boolean;
  /**
   * True once the user explicitly picked a pseudo (persisted). When false the
   * live session uses the automatic French defaults (`Hôte` / `Invité #N`,
   * see `collab-store.joinRoom`) instead of the stored fallback.
   */
  hasCustomUsername: boolean;
  /** Idempotent client-side hydration from localStorage. */
  hydrate: () => void;
  setUsername: (name: string) => void;
  setUserColor: (color: string) => void;
  setProfile: (patch: Partial<UserProfile>) => void;
}

const isAvatarColor = (value: unknown): value is string =>
  typeof value === "string" && (AVATAR_COLORS as readonly string[]).includes(value);

const sanitizeUsername = (value: unknown): string => {
  if (typeof value !== "string") return DEFAULT_USERNAME;
  const trimmed = value.trim().slice(0, USERNAME_MAX_LENGTH);
  return trimmed || DEFAULT_USERNAME;
};

/** Write the profile to localStorage (best-effort: storage may be unavailable). */
const persistProfile = (username: string, userColor: string): void => {
  try {
    if (typeof window === "undefined" || !("localStorage" in window)) return;
    window.localStorage.setItem(
      PROFILE_STORAGE_KEY,
      JSON.stringify({ version: 1, username, userColor }),
    );
  } catch {
    // Storage full / private mode: the profile still works in memory.
  }
};

export const useProfileStore = create<ProfileStore>((set, get) => ({
  username: DEFAULT_USERNAME,
  userColor: AVATAR_COLORS[0],
  hydrated: false,
  hasCustomUsername: false,

  hydrate: () => {
    if (get().hydrated) return;
    if (typeof window === "undefined" || !("localStorage" in window)) {
      set({ hydrated: true });
      return;
    }
    try {
      const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
      if (raw) {
        const parsed: unknown = JSON.parse(raw);
        if (parsed && typeof parsed === "object") {
          const record = parsed as Record<string, unknown>;
          set({
            username: sanitizeUsername(record.username),
            userColor: isAvatarColor(record.userColor)
              ? record.userColor
              : AVATAR_COLORS[0],
            // A stored username was explicitly chosen by the user (nothing
            // else ever persists one) — keep the automatic defaults off.
            hasCustomUsername: true,
            hydrated: true,
          });
          return;
        }
      }
    } catch {
      // Corrupt JSON / storage error: fall back to defaults.
    }
    set({ hydrated: true });
  },

  setUsername: (name) => {
    const username = typeof name === "string" ? name.slice(0, USERNAME_MAX_LENGTH) : DEFAULT_USERNAME;
    // Persisting marks the store as hydrated so a later `hydrate()` never
    // clobbers an edit made before the first read.
    persistProfile(username, get().userColor);
    set({ username, hydrated: true, hasCustomUsername: true });
  },

  setUserColor: (color) => {
    if (!isAvatarColor(color)) return;
    persistProfile(get().username, color);
    set({ userColor: color, hydrated: true });
  },

  setProfile: (patch) => {
    const username =
      patch.username !== undefined
        ? sanitizeUsername(patch.username)
        : get().username;
    const userColor = isAvatarColor(patch.userColor)
      ? patch.userColor
      : get().userColor;
    persistProfile(username, userColor);
    set({
      username,
      userColor,
      hydrated: true,
      // An explicit username turns off the automatic `Hôte` / `Invité #N`
      // defaults for good (color-only edits keep the current mode).
      hasCustomUsername: patch.username !== undefined || get().hasCustomUsername,
    });
  },
}));
