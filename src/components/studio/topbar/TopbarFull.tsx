"use client";

/***********************************************************************************************
 * TopbarFull.tsx — Regroupement autonome de la TopBar du Studio Modelizia
 *
 * Tous les sous-composants de la TopBar sont compilés dans ce seul fichier pour faciliter
 * le partage du code complet avec Claude en un seul bloc.
 *
 * Les imports suivants sont PRÉSERVÉS tels quels (non dupliqués) afin de rester intacts
 * et fonctionnels dans le projet :
 *   • Stores Zustand      : @/store/graph-store, collab-store, profile-store, focus-store
 *   • Config PartyKit     : @/lib/collab/transport (DEFAULT_ROOM_ID)
 *   • Icônes Lucide       : lucide-react
 *   • Engine / hooks / UI : health-score, normalize, engine, export, image, hooks, shadcn/ui
 ************************************************************************************************/

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

// ── Lucide icons ──────────────────────────────────────────────────────────────
import {
  Activity,
  AlertTriangle,
  Archive,
  Award,
  Check,
  ChevronDown,
  CloudUpload,
  Code2,
  Copy,
  Database,
  FileCode2,
  FileDigit,
  FileJson,
  Frame,
  ImageDown,
  Keyboard,
  LayoutGrid,
  LayoutTemplate,
  Link2,
  LoaderCircle,
  LogIn,
  MapPin,
  MoreHorizontal,
  OctagonAlert,
  Pencil,
  Plus,
  Redo2,
  Search,
  Shapes,
  Share2,
  ShieldCheck,
  TriangleAlert,
  Undo2,
  UserRound,
  Users,
  Wand2,
  Zap,
} from "lucide-react";

// ── Base UI ───────────────────────────────────────────────────────────────────
import { Menu } from "@base-ui/react/menu";

// ── shadcn/ui ─────────────────────────────────────────────────────────────────
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { pushToast } from "@/components/ui/toast";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Kbd, formatShortcut } from "@/components/ui/kbd";

// ── Zustand stores ────────────────────────────────────────────────────────────
import { useGraphStore } from "@/store/graph-store";
import { useCollabStore } from "@/store/collab-store";
import { useProfileStore } from "@/store/profile-store";
import { useFocusStore, toggleCanvasFocus } from "@/store/focus-store";

// ── PartyKit / collab transport ───────────────────────────────────────────────
import { DEFAULT_ROOM_ID } from "@/lib/collab/transport";

// ── Engine ────────────────────────────────────────────────────────────────────
import { computeHealthScore } from "@/lib/engine/health-score";
import { countNormalizations } from "@/lib/engine/normalize";
import {
  parsePrismaSchema,
  parseSqlSchema,
  validateStoredSchema,
  compileToPrisma,
  compileToSql,
} from "@/lib/engine";
import {
  downloadTextFile,
  exportCanvasPng,
  exportCanvasSvg,
  exportProjectZip,
} from "@/lib/export/image";

// ── Hooks ─────────────────────────────────────────────────────────────────────
import { useHealthCelebration } from "@/hooks/use-health-celebration";
import { useCheatsheet } from "@/hooks/use-cheatsheet";

// ── Types / constants externes ────────────────────────────────────────────────
import { AVATAR_COLORS, type CollabRole } from "@/types";
import {
  DEFAULT_USERNAME,
  USERNAME_MAX_LENGTH,
} from "@/store/profile-store";
import type { ParsedSchema } from "@/lib/engine/parser";
import { PRESET_TEMPLATES } from "@/lib/templates/presets";
import { QUICK_STARTERS } from "@/lib/templates/quick-starters";

// ============================================================================
// Types locaux
// ============================================================================

/** Kind of dialog the command palette can request the header to open. */
export type CommandDialogKind =
  | "import"
  | "templates"
  | "export"
  | "issues"
  | "shortcuts";

// ============================================================================
// Styles partagés
// ============================================================================

/** Header project-menu item style. */
const headerMenuItemClass =
  "flex cursor-default items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground outline-none select-none data-highlighted:bg-muted";

/** Collab toolbar dropdown menu item style (h-8 uniforme). */
const collabMenuItemClass =
  "flex h-8 cursor-default items-center gap-2 rounded-md px-2 text-[13px] text-foreground outline-none select-none data-highlighted:bg-muted";

// ============================================================================
// Utilitaires
// ============================================================================

/** Human summary of a one-click normalisation, for the toast body. */
function describeNormalization(summary: {
  addedPk: string[];
  promotedPk: string[];
  fixedFkTypes: string[];
  addedIndexes: string[];
}): string {
  const parts: string[] = [];
  const pkCount = summary.addedPk.length + summary.promotedPk.length;
  if (pkCount) parts.push(`${pkCount} clé(s) primaire(s)`);
  if (summary.fixedFkTypes.length) parts.push(`${summary.fixedFkTypes.length} type(s) FK corrigé(s)`);
  if (summary.addedIndexes.length) parts.push(`${summary.addedIndexes.length} index unique(s)`);
  return parts.join(" · ");
}

/** Color tokens keyed by score band (mirrors health-score-bar.tsx). */
function scoreTone(score: number): { bar: string; text: string; ring: string } {
  if (score >= 90) return { bar: "bg-emerald-500", text: "text-emerald-700", ring: "hover:bg-emerald-500/10" };
  if (score >= 75) return { bar: "bg-sky-500", text: "text-sky-700", ring: "hover:bg-sky-500/10" };
  if (score >= 50) return { bar: "bg-amber-500", text: "text-amber-700", ring: "hover:bg-amber-500/10" };
  return { bar: "bg-rose-500", text: "text-rose-700", ring: "hover:bg-rose-500/10" };
}

// ============================================================================
// Avatar (partagé par CollabToolbar, ProfileModal, ShareModal)
// ============================================================================

/** Role → accent + short French label used across collab UI. */
export const ROLE_META: Record<
  CollabRole,
  { label: string; ring: string; text: string }
> = {
  owner: { label: "Propriétaire", ring: "ring-violet-400", text: "text-violet-700" },
  editor: { label: "Éditeur", ring: "ring-emerald-400", text: "text-emerald-700" },
  viewer: { label: "Lecteur", ring: "ring-slate-300", text: "text-slate-600" },
};

/** Round pastel avatar with initials + a role-colored ring. */
export function Avatar({
  name,
  color,
  role = "editor",
  size = "md",
  className,
}: {
  name: string;
  color: string;
  role?: CollabRole;
  size?: "sm" | "md";
  className?: string;
}) {
  const initials = name
    .split(/[\s·]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-white select-none",
        size === "sm" ? "size-6 text-[10px]" : "size-8 text-xs",
        ROLE_META[role].ring,
        className,
      )}
      style={{ backgroundColor: color }}
      aria-label={name}
    >
      {initials || "?"}
    </span>
  );
}

// ============================================================================
// HealthPill — widget santé du schéma (score, rang, barre, bouton normaliser)
// ============================================================================

/**
 * Compact gamification pill for the Topbar: rank badge + live health score +
 * issue counter. Clicking it opens the validation sheet; the optional
 * {@link onNormalize} action surfaces a "normalise in one click" button
 * whenever the schema can still be improved.
 */
export function HealthPill({
  onOpenIssues,
  onNormalize,
}: {
  onOpenIssues: () => void;
  onNormalize?: () => void;
}) {
  const tables = useGraphStore((s) => s.tables);
  const relations = useGraphStore((s) => s.relations);
  const validationIssues = useGraphStore((s) => s.validationIssues);

  const health = useMemo(
    () => computeHealthScore(tables, relations, validationIssues),
    [tables, relations, validationIssues],
  );
  const tone = scoreTone(health.score);
  const perfect = health.score === 100;
  const canNormalize = onNormalize && health.score < 100 && tables.length > 0;
  // Silent: toasts fire here for the topbar, but the shared confetti canvas
  // lives in the global layout mount — no double burst.
  const celebration = useHealthCelebration({ silent: true });

  const nextRankHint =
    health.score >= 90
      ? "Schéma parfait"
      : health.score >= 75
        ? "Maître des BDD à 90%"
        : health.score >= 50
          ? "Architecte Senior à 75%"
          : "Architecte Junior à 50%";

  return (
    <Tooltip
      label={`${health.score}% — ${health.rank.label} · ${health.errorCount} erreur(s), ${health.warningCount} avertissement(s) · ${nextRankHint}`}
    >
      <div
        className={cn(
          "flex items-center gap-2 rounded-full border border-border px-2 py-1 transition-colors",
          tone.ring,
        )}
      >
      <button
        type="button"
        onClick={onOpenIssues}
        className="flex items-center gap-1.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-label={`Santé du schéma ${health.score}%, ouvrir le rapport`}
      >
        {perfect ? (
          <Award
            key={`pill-award-${celebration.shineKey}`}
            className={cn(
              "size-3.5 text-emerald-600",
              celebration.shineKey > 0 && "badge-shine rounded-full",
            )}
          />
        ) : (
          <ShieldCheck className={cn("size-3.5 transition-colors", tone.text)} />
        )}
        <span
          key={`pill-score-${celebration.popKey}`}
          className={cn(
            "text-xs font-semibold whitespace-nowrap tabular-nums transition-colors",
            tone.text,
            celebration.popKey > 0 && "score-pop inline-block",
          )}
        >
          {health.score}%
        </span>
        <span
          className={cn(
            "hidden h-1.5 w-14 overflow-hidden rounded-full bg-slate-200/80 md:block",
          )}
        >
          <span
            className={cn(
              "block h-full rounded-full transition-all duration-500",
              tone.bar,
              perfect && "progress-shimmer",
            )}
            style={{ width: `${health.score}%` }}
          />
        </span>
        {health.errorCount + health.warningCount > 0 && (
          <span
            className="flex items-center gap-0.5 text-xs font-medium text-amber-600 tabular-nums"
            aria-label={`${health.errorCount + health.warningCount} problèmes`}
          >
            <TriangleAlert className="size-3" />
            {health.errorCount + health.warningCount}
          </span>
        )}
      </button>

      {canNormalize && (
        <Tooltip label="Normaliser en 1 clic (ajoute les PK, corrige les types FK, indexe les uniques)">
          <button
            type="button"
            onClick={onNormalize}
            className="flex items-center gap-1 rounded-full bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
            aria-label="Normaliser le schéma"
          >
            <Zap className="size-3" />
            <span className="hidden lg:inline">Normaliser</span>
          </button>
        </Tooltip>
      )}
    </div>
    </Tooltip>
  );
}

// ============================================================================
// CollabToolbar — bloc collaboration (salon, avatars, présence, profil, partager)
// ============================================================================

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
 *   pencil badge opens the ProfileModal (persisted pseudo + color).
 */
export function CollabToolbar() {
  const self = useCollabStore((s) => s.self);
  const participants = useCollabStore((s) => s.participants);
  const status = useCollabStore((s) => s.status);
  const roomId = useCollabStore((s) => s.roomId);
  const joinRoom = useCollabStore((s) => s.joinRoom);
  const [shareOpen, setShareOpen] = useState(false);
  /** Which view of the session modal to show (share link vs room-id entry). */
  const [shareMode, setShareMode] = useState<"share" | "join">("share");
  const [profileOpen, setProfileOpen] = useState(false);

  // Load the persisted profile once on mount (client-only, idempotent) so the
  // avatar stack shows the configured pseudo before the room joins.
  useEffect(() => {
    useProfileStore.getState().hydrate();
  }, []);

  /** Open the session modal — either the share view or straight to the join field. */
  const openShare = (mode: "share" | "join"): void => {
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
      duration: 3000,
    });
  };

  const connected = status !== "disconnected";
  const visible = participants
    .filter((p) => p.id !== self.id)
    .slice(0, 4);
  const overflow = Math.max(0, participants.length - visible.length);
  const stack = [self, ...visible];

  return (
    <>
      {/* A. Dropdown « Salon : … » */}
      <Menu.Root>
        <Menu.Trigger
          asChild
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-popup-open:bg-muted"
        >
          <Button size="icon" variant="ghost" className="size-8 p-0">
            {roomId || DEFAULT_ROOM_ID}
            <ChevronDown className="size-3 ml-1" />
          </Button>
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner side="bottom" align="start" sideOffset={6}>
            <Menu.Popup className="glass-panel min-w-44 rounded-xl p-1 shadow-xl ring-1 ring-foreground/10 backdrop-blur-md">
              <Menu.Item
                className={collabMenuItemClass}
                onClick={createRoom}
              >
                <Plus className="size-4" /> Créer un nouveau salon
              </Menu.Item>
              <Menu.Item
                className={collabMenuItemClass}
                onClick={() => openShare("join")}
              >
                <LogIn className="size-4" /> Rejoindre un salon
              </Menu.Item>
              <Menu.Item
                className={collabMenuItemClass}
                onClick={() => {
                  navigator.clipboard
                    .writeText(roomId || DEFAULT_ROOM_ID)
                    .then(() => pushToast("ID du salon copié", { type: "success" }));
                }}
              >
                <Copy className="size-4" /> Copier l'ID du salon
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
            {stack.map((user, i) => (
              <span
                key={user.id}
                className="-ml-2 first:ml-0 transition-transform hover:z-10 hover:-translate-y-0.5"
                style={{ zIndex: stack.length - i }}
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

      <ShareModalFull
        open={shareOpen}
        onOpenChange={setShareOpen}
        mode={shareMode}
      />
      <ProfileModalFull open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}

// ============================================================================
// ShareModalFull — modale de lien d'invitation / rejoindre un salon
// ============================================================================

/** Build the shareable `/studio` room link from the browser origin + roomId. */
const buildShareLink = (roomId: string): string => {
  if (typeof window === "undefined") {
    return `/studio?room=${encodeURIComponent(roomId)}`;
  }
  const shareUrl = `${window.location.origin}/studio?room=${encodeURIComponent(roomId)}`;
  return shareUrl;
};

const ROLE_KEYS: CollabRole[] = ["owner", "editor", "viewer"];

/** Role selector used inside ShareModalFull. */
function RoleSelectFull({
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
export function ShareModalFull({
  open,
  onOpenChange,
  mode = "share",
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** `join` opens the dialog directly on the room-id input (topbar action). */
  mode?: "share" | "join";
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

  const copyLink = (): void => {
    navigator.clipboard.writeText(shareLink).then(() => {
      setCopied(true);
      pushToast("Lien copié", { type: "success" });
    });
  };

  const handleJoin = (): void => {
    joinRoom(draftRoom.trim() || self.name, self.role, roomId || DEFAULT_ROOM_ID);
    onOpenChange(false);
    pushToast("Session collaborative démarrée", { type: "success" });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "join" ? "Rejoindre un salon" : "Partager le schéma"}
          </DialogTitle>
          <DialogDescription>
            {mode === "join"
              ? "Saisissez l'ID du salon pour rejoindre une session collaborative."
              : "Invitez des collaborateurs avec ce lien de session."}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {/* Room link */}
          <div className="flex items-center gap-2 border rounded-lg p-3 bg-slate-50">
            <input
              readOnly
              value={shareLink}
              className="flex-1 bg-transparent text-sm text-slate-800 outline-none"
            />
            <Button
              size="sm"
              variant="outline"
              onClick={copyLink}
              className="shrink-0"
            >
              {copied ? (
                <>
                  <Check className="size-4" /> Copié
                </>
              ) : (
                <Copy className="size-4" />
              )}
            </Button>
          </div>

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
              <RoleSelectFull
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
                    <RoleSelectFull
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

          {!connected && (
            <Button
              className="w-full"
              onClick={handleJoin}
            >
              <Link2 className="size-4" /> Démarrer la session
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// ProfileModalFull — modale profil (pseudo + couleur)
// ============================================================================

/**
 * Profile editor (pseudo + accent color), opened from the topbar avatar badge.
 *
 * Pure light Modelizia design system: solid white surface, hairline
 * `slate-200` borders, `slate-800` text. On save the profile is persisted to
 * localStorage AND pushed to the collaboration store, which re-announces
 * presence so peers update the avatar stack + cursors in real time.
 */
export function ProfileModalFull({
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
        className="border border-border bg-card text-foreground ring-border sm:max-w-md"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-slate-800">
            <UserRound className="size-4" /> Mon profil
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Votre pseudo et votre couleur sont visibles par les collaborateurs
            de la salle (curseurs, avatars, activité) et mémorisés pour vos
            prochaines sessions.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
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
              <p className="text-xs text-slate-500">Aperçu — curseur & avatars</p>
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

// ============================================================================
// ImportDialog — import Prisma / SQL / JSON (avec DropZone + CodeBox)
// ============================================================================

const PRISMA_SAMPLE = `model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  posts Post[]
}

model Post {
  id       Int   @id @default(autoincrement())
  title    String
  authorId Int?
  author   User  @relation(fields: [authorId], references: [id])
}`;

const SQL_SAMPLE = `CREATE TYPE \"Role\" AS ENUM ('ADMIN', 'USER');

CREATE TABLE \"User\" (
  \"id\" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  \"email\" TEXT NOT NULL UNIQUE,
  \"role\" \"Role\" NOT NULL DEFAULT 'USER'
);`;

type Format = "prisma" | "sql";

const ACCEPTED_EXTENSIONS = [".prisma", ".sql", ".json", ".txt"] as const;
const ACCEPT_ATTRIBUTE = ACCEPTED_EXTENSIONS.join(",");

const getExtension = (fileName: string): string => {
  const idx = fileName.lastIndexOf(".");
  return idx === -1 ? "" : fileName.slice(idx).toLowerCase();
};

/** Pick a parser tab from the file name, falling back to content sniffing. */
const detectFormat = (fileName: string, content: string): Format => {
  const ext = getExtension(fileName);
  if (ext === ".sql") return "sql";
  if (ext === ".prisma") return "prisma";
  const looksSql =
    /\bCREATE\s+(TABLE|TYPE|SCHEMA)\b/i.test(content) ||
    /\bALTER\s+TABLE\b/i.test(content);
  const looksPrisma =
    /\bmodel\s+[A-Za-z_]/i.test(content) || /\benum\s+[A-Za-z_]/i.test(content);
  if (looksSql && !looksPrisma) return "sql";
  return "prisma";
};

export function ImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const loadSchema = useGraphStore((s) => s.loadSchema);
  const [tab, setTab] = useState<Format>("prisma");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetFeedback = (): void => {
    setError(null);
    setSuccess(null);
  };

  const handleLoadSample = (): void => {
    const sample = tab === "prisma" ? PRISMA_SAMPLE : SQL_SAMPLE;
    setCode(sample);
    parseAndLoad(sample, tab);
  };

  const parseAndLoad = (source?: string, format?: Format): void => {
    const text = source ?? code;
    const activeFormat = format ?? tab;
    resetFeedback();
    if (!text.trim()) {
      setError("Collez d'abord du code — ou déposez un fichier ci-dessus.");
      return;
    }
    try {
      const parsed =
        activeFormat === "prisma" ? parsePrismaSchema(text) : parseSqlSchema(text);
      if (parsed.tables.length === 0) {
        throw new Error("Aucune table trouvée dans le contenu fourni.");
      }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erreur lors de l'import.");
        return;
      }
      loadSchema(parsed);
      setSuccess(`Import réussi : ${parsed.tables.length} table(s) · ${parsed.relations.length} relation(s).`);
    };
  };

  const handleDrop = (files: FileList | null): void => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const format = detectFormat(file.name, content);
      setTab(format);
      parseAndLoad(content, format);
    };
    reader.onerror = () => setError("Impossible de lire le fichier.");
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer un schéma</DialogTitle>
          <DialogDescription>
            Collez du Prisma, du SQL ou du JSON, ou déposez un fichier. L'import
            remplace le canvas actuel (annulable via Ctrl+Z).
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Tabs defaultValue="paste" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="paste" className="text-xs">
                Coller du code
              </TabsTrigger>
              <TabsTrigger value="file" className="text-xs">
                Déposer un fichier
              </TabsTrigger>
            </TabsList>
            <TabsContent value="paste" className="space-y-3">
              <div className="flex items-start gap-3">
                <Tabs value={tab} className="w-full">
                  <TabsList className="flex gap-1">
                    <TabsTrigger value="prisma" className="text-xs">
                      Prisma
                    </TabsTrigger>
                    <TabsTrigger value="sql" className="text-xs">
                      SQL
                    </TabsTrigger>
                  </TabsList>
                  <TabsContent value="prisma" className="mt-2">
                    <CodeBox code={code} setCode={setCode} label="schéma Prisma" />
                  </TabsContent>
                  <TabsContent value="sql" className="mt-2">
                    <CodeBox code={code} setCode={setCode} label="migration SQL" />
                  </TabsContent>
                </Tabs>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleLoadSample} disabled={isReading}>
                  Charger un exemple
                </Button>
                <Button onClick={() => parseAndLoad()} disabled={isReading}>
                  {isReading ? (
                    <>
                      <LoaderCircle className="size-4 animate-spin" />
                      Lecture…
                    </>
                  ) : (
                    "Analyser et charger"
                  )}
                </Button>
              </div>
              {error && (
                <p className="text-xs text-destructive">{error}</p>
              )}
              {success && (
                <p className="text-xs text-emerald-600">{success}</p>
              )}
            </TabsContent>
            <TabsContent value="file" className="space-y-3">
              <DropZone
                onFiles={handleDrop}
                onBrowse={() => fileInputRef.current?.click()}
                isReading={isReading}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPT_ATTRIBUTE}
                className="hidden"
                onChange={(e) => handleDrop(e.target.files)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DropZone({
  onFiles,
  onBrowse,
  isReading,
}: {
  onFiles: (files: FileList | null) => void;
  onBrowse: () => void;
  isReading: boolean;
}) {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-disabled={isReading}
      onClick={() => !isReading && onBrowse()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          if (!isReading) onBrowse();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        if (!isReading) setIsDragging(true);
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        if (!isReading) setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        if (!isReading) onFiles(e.dataTransfer.files);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
        isDragging
          ? "border-primary bg-primary/10"
          : "border-input bg-muted/40 hover:border-ring hover:bg-muted",
        isReading && "pointer-events-none opacity-60",
      )}
    >
      <span
        className={cn(
          "flex size-11 items-center justify-center rounded-full transition-colors",
          isDragging
            ? "bg-primary text-primary-foreground"
            : "bg-background text-muted-foreground",
        )}
      >
        {isReading ? (
          <LoaderCircle className="size-5 animate-spin" />
        ) : (
          <CloudUpload className="size-5" />
        )}
      </span>
      <p className="text-sm font-medium">
        {isReading
          ? "Lecture du fichier…"
          : isDragging
            ? "Déposez pour importer"
            : "Glissez un fichier .prisma, .sql, .json ou .txt ici"}
      </p>
      <p className="text-xs text-muted-foreground">
        ou cliquez pour parcourir · {ACCEPTED_EXTENSIONS.join(", ")}
      </p>
    </div>
  );
}

function CodeBox({ code, setCode, label }: { code: string; setCode: (v: string) => void; label: string }) {
  return (
    <textarea
      value={code}
      onChange={(e) => setCode(e.target.value)}
      placeholder={`Collez votre ${label} ici…`}
      spellCheck={false}
      className="h-64 w-full rounded-lg border border-input bg-white p-3 font-mono text-xs text-slate-700 outline-none focus-visible:border-ring"
    />
  );
}

// ============================================================================
// TemplatesDialog — modèles de schéma
// ============================================================================

export function TemplatesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const applyQuickStarter = useGraphStore((s) => s.applyQuickStarter);
  const [pendingId, setPendingId] = useState<string | null>(null);

  const all = [
    ...QUICK_STARTERS.map((q) => ({
      id: `quick-${q.id}`,
      name: q.name,
      description: q.description,
      schema: q.schema as ParsedSchema,
      tag: "Démarrage",
    })),
    ...PRESET_TEMPLATES.map((t) => ({
      id: `preset-${t.id}`,
      name: t.name,
      description: t.description,
      schema: t.schema as ParsedSchema,
      tag: "Preset",
    })),
  ];

  const pending = all.find((t) => t.id === pendingId) ?? null;

  const confirmLoad = (): void => {
    if (!pending) return;
    // Undoable: single checkpoint inside applyQuickStarter (Ctrl+Z restores).
    applyQuickStarter(pending.schema);
    setPendingId(null);
    onOpenChange(false);
    pushToast(`Modèle « ${pending.name} » chargé`, {
      type: "success",
      description: `${pending.schema.tables.length} table(s) · ${pending.schema.relations.length} relation(s). Annulable via Ctrl+Z.`,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setPendingId(null);
      }}
    >
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Modèles de schéma</DialogTitle>
          <DialogDescription>
            Charger un modèle remplace le canvas actuel. Confirmez avant
            d'appliquer.
          </DialogDescription>
        </DialogHeader>
        {!pending ? (
          <ul className="grid max-h-[60vh] gap-2 overflow-y-auto pr-1">
            {all.map((t) => (
              <li key={t.id} className="rounded-lg border border-border p-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{t.name}</span>
                  <Badge variant="outline" className="ml-1">{t.tag}</Badge>
                  <span className="ml-auto flex gap-1">
                    <Badge variant="secondary">{t.schema.tables.length} tables</Badge>
                    <Badge variant="secondary">{t.schema.relations.length} relations</Badge>
                    <Badge variant="secondary">{t.schema.enums.length} énums</Badge>
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t.description}</p>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {t.schema.tables.map((x) => x.name).join(" · ")}
                </p>
                <Button size="sm" className="mt-2" variant="outline" onClick={() => setPendingId(t.id)}>
                  Aperçu et chargement
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-border p-3">
            <p className="text-sm font-semibold">
              Remplacer le canvas par « {pending.name} » ?
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{pending.description}</p>
            <ul className="mt-2 max-h-48 space-y-1 overflow-y-auto">
              {pending.schema.tables.map((t) => (
                <li key={t.id} className="rounded bg-muted px-2 py-1 font-mono text-[11px]">
                  {t.name} ({t.fields.map((f) => f.name).join(", ")})
                </li>
              ))}
            </ul>
            <DialogFooter>
              <Button variant="outline" onClick={() => setPendingId(null)}>
                Retour
              </Button>
              <Button onClick={confirmLoad}>Remplacer le schéma</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// ExportMenu — export JSON / Prisma / SQL / PNG / SVG / ZIP
// ============================================================================

export function ExportMenu({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const getSchemaAst = useGraphStore((s) => s.getSchemaAst);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const doExport = (kind: "json" | "prisma" | "sql"): void => {
    const ast = getSchemaAst();
    if (kind === "json") {
      downloadTextFile("schema.json", JSON.stringify(ast, null, 2), "application/json");
      setStatus("schema.json téléchargé.");
    } else if (kind === "prisma") {
      downloadTextFile("schema.prisma", compileToPrisma(ast));
      setStatus("schema.prisma téléchargé.");
    } else {
      downloadTextFile("schema.sql", compileToSql(ast));
      setStatus("schema.sql téléchargé.");
    }
    pushToast("Export terminé", { type: "success", description: exportFilename(kind) });
  };

  const runAsync = async (key: string, label: string, task: () => Promise<void>): Promise<void> => {
    setBusy(key);
    try {
      await task();
      setStatus(`${label} téléchargé.`);
      pushToast("Export terminé", { type: "success", description: label });
    } catch (err) {
      const message = err instanceof Error ? err.message : `Échec de l'export ${label}.`;
      setStatus(message);
      pushToast(`Échec de l'export ${label}`, { type: "error", description: message });
    } finally {
      setBusy(null);
    }
  };

  const doPng = (): Promise<void> =>
    runAsync("png", "modelizia-diagram@3x.png", () => exportCanvasPng("modelizia-diagram@3x.png", 3));

  const doSvg = (): Promise<void> =>
    runAsync("svg", "modelizia-diagram.svg", () => exportCanvasSvg());

  const doZip = (): Promise<void> =>
    runAsync("zip", "modelizia-project.zip", () => exportProjectZip(getSchemaAst()));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Exporter le schéma</DialogTitle>
          <DialogDescription>
            Téléchargez le graphe actuel dans le format de votre choix.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Button variant="default" className="justify-start" disabled={busy !== null} onClick={() => void doZip()}>
            <Archive className="size-4" /> {busy === "zip" ? "Compression…" : "Pack projet complet (.zip)"}
          </Button>
          <p className="-mt-1 text-[11px] text-muted-foreground">
            Prisma · SQL ×3 · TypeScript · Zod · rapport MD · JSON + README.
          </p>
          <Button variant="outline" className="justify-start" onClick={() => doExport("json")}>
            <FileJson className="size-4" /> Schéma JSON (.json, réimportable)
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => doExport("prisma")}>
            <FileCode2 className="size-4" /> Fichier Prisma (schema.prisma)
          </Button>
          <Button variant="outline" className="justify-start" onClick={() => doExport("sql")}>
            <FileDigit className="size-4" /> Migration SQL (schema.sql)
          </Button>
          <Button variant="outline" className="justify-start" disabled={busy !== null} onClick={() => void doPng()}>
            <ImageDown className="size-4" /> {busy === "png" ? "Rendu HD…" : "Image PNG HD ×3 (diagramme épuré)"}
          </Button>
          <Button variant="outline" className="justify-start" disabled={busy !== null} onClick={() => void doSvg()}>
            <Shapes className="size-4" /> {busy === "svg" ? "Rendu…" : "Image SVG vectorielle (diagramme épuré)"}
          </Button>
        </div>
        {status && <p className="text-xs text-muted-foreground">{status}</p>}
      </DialogContent>
    </Dialog>
  );
}

/** Filename label for a text export kind (used in the toast body). */
function exportFilename(kind: "json" | "prisma" | "sql"): string {
  return kind === "json"
    ? "schema.json"
    : kind === "prisma"
      ? "schema.prisma"
      : "schema.sql";
}

// ============================================================================
// ResetButton — réinitialisation canvas
// ============================================================================

export function ResetButton({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const resetGraph = useGraphStore((s) => s.resetGraph);
  const [mode, setMode] = useState<"empty" | "seed">("empty");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Réinitialiser le canvas ?</DialogTitle>
          <DialogDescription>
            Cette action remplace le schéma actuel. Elle est irréversible sauf
            si vous l'avez exporté.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Button variant={mode === "empty" ? "default" : "outline"} onClick={() => setMode("empty")}>
            Effacer vers un canvas vide
          </Button>
          <Button variant={mode === "seed" ? "default" : "outline"} onClick={() => setMode("seed")}>
            Recharger le modèle par défaut
          </Button>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            variant="destructive"
            onClick={() => {
              resetGraph(mode);
              onOpenChange(false);
              pushToast(
                mode === "empty" ? "Canvas effacé" : "Modèle par défaut rechargé",
                { type: "info", description: "Exportez avant pour conserver une copie." },
              );
            }}
          >
            Confirmer la réinitialisation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// ShortcutsDialog — cheatsheet raccourcis clavier (avec ShortcutKeys)
// ============================================================================

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
    title: "Catalogue & Inspecteur",
    items: [
      { keys: "Entrée", label: "Créer la table (champ nom du catalogue)" },
      { keys: "mod+d", label: "Dupliquer la table sélectionnée" },
      { keys: "del", label: "Supprimer la sélection" },
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
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const toggleInternal = useCallback(
    () => setInternalOpen((v) => !v),
    [],
  );
  useCheatsheet(toggleInternal);
  // Dual mode: `?` toggles via the internal state, a header "?" button drives
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

// ============================================================================
// StudioHeader — composant principal de la TopBar du Studio
// ============================================================================

/** Human summary of a one-click normalisation, for the toast body. */
function describeNormalizationHeader(summary: {
  addedPk: string[];
  promotedPk: string[];
  fixedFkTypes: string[];
  addedIndexes: string[];
}): string {
  const parts: string[] = [];
  const pkCount = summary.addedPk.length + summary.promotedPk.length;
  if (pkCount) parts.push(`${pkCount} clé(s) primaire(s)`);
  if (summary.fixedFkTypes.length) parts.push(`${summary.fixedFkTypes.length} type(s) FK corrigé(s)`);
  if (summary.addedIndexes.length) parts.push(`${summary.addedIndexes.length} index unique(s)`);
  return parts.join(" · ");
}

export function StudioHeader() {
  const tables = useGraphStore((state) => state.tables);
  const relations = useGraphStore((state) => state.relations);
  const validationIssues = useGraphStore((state) => state.validationIssues);
  const applyAutoLayout = useGraphStore((state) => state.applyAutoLayout);
  const normalizeSchema = useGraphStore((state) => state.normalizeSchema);
  const autoDetectRelations = useGraphStore(
    (state) => state.autoDetectRelations,
  );
  const selectNode = useGraphStore((state) => state.selectNode);
  const hydrateFromStorage = useGraphStore((state) => state.hydrateFromStorage);
  const undo = useGraphStore((state) => state.undo);
  const redo = useGraphStore((state) => state.redo);
  // Reactive subscription: re-render the buttons when history changes.
  const historyVersion = useGraphStore((state) => state.historyVersion);
  const canUndo = useGraphStore((state) => state.canUndo)();
  const canRedo = useGraphStore((state) => state.canRedo)();
  const pushActivity = useCollabStore((state) => state.pushActivity);
  // Live activity feed toggle — rendered far right, with the secondary actions.
  const activityOpen = useCollabStore((state) => state.activityOpen);
  const setActivityOpen = useCollabStore((state) => state.setActivityOpen);
  const focusCanvasOnly = useFocusStore((state) => state.focusCanvasOnly);
  void historyVersion;
  const [issuesOpen, setIssuesOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [fileAction, setFileAction] = useState<
    null | "import" | "templates" | "export" | "reset"
  >(null);

  useEffect(() => {
    hydrateFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Command-palette bus: open any header dialog from ⌘K actions.
  useEffect(() => {
    const onCommand = (event: Event) => {
      const kind = (event as CustomEvent<CommandDialogKind>).detail;
      if (kind === "issues") setIssuesOpen(true);
      else if (kind === "shortcuts") setShortcutsOpen(true);
      else setFileAction(kind);
    };
    window.addEventListener("archstudio:open-dialog", onCommand);
    return () => window.removeEventListener("archstudio:open-dialog", onCommand);
  }, []);

  const errorCount = validationIssues.filter((i) => i.severity === "error").length;
  const warningCount = validationIssues.filter(
    (i) => i.severity === "warning",
  ).length;
  const tableNameOf = (tableId: string) =>
    tables.find((t) => t.id === tableId)?.name ?? tableId;

  const handleNormalize = () => {
    const summary = normalizeSchema();
    if (summary.noop) {
      pushToast("Schéma déjà optimal", {
        type: "success",
        description: "Rien à normaliser.",
      });
      return;
    }
    const count = countNormalizations(summary);
    pushActivity("normalize", `a appliqué la normalisation (${count} corrections)`);
    pushToast(`${count} correction${count === 1 ? "" : "s"} appliquée${count === 1 ? "" : "s"}`, {
      type: "success",
      description: describeNormalizationHeader(summary),
    });
  };

  const handleAutoLayout = () => {
    applyAutoLayout();
    pushActivity("create", `a réorganisé la disposition (${tables.length} tables)`);
    pushToast(
      `${tables.length} table${tables.length === 1 ? "" : "s"} réorganisée${tables.length === 1 ? "" : "s"}`,
      { type: "success", description: "Disposition automatique appliquée." },
    );
  };

  const openFileAction = (action: NonNullable<typeof fileAction>) =>
    setFileAction(action);

  const handleAutoDetect = () => {
    const summary = autoDetectRelations();
    if (summary.created === 0) {
      pushToast("Aucune relation orpheline détectée", {
        type: "info",
        description:
          "Les conventions de nommage n'ont révélé aucune jointure manquante.",
      });
      return;
    }
    pushActivity(
      "create",
      `a auto-détecté ${summary.created} relation${summary.created === 1 ? "" : "s"}`,
    );
    pushToast(
      `${summary.created} relation${summary.created === 1 ? "" : "s"} créée${summary.created === 1 ? "" : "s"}`,
      {
        type: "success",
        description: `${summary.links.slice(0, 3).join(" · ")}${summary.links.length > 3 ? " · …" : ""} · annulable via Ctrl+Z.`,
      },
    );
  };

  return (
    <header
      data-testid="studio-header"
      className="glass-panel flex h-14 shrink-0 items-center justify-between gap-3 border-b backdrop-blur-md px-4"
    >
      {/* ── Zone gauche : logo + projet + menu fichier ── */}
      <div className="flex min-w-0 items-center gap-2">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Modelizia — accueil"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Database className="size-4" />
          </span>
          <h1 className="text-base font-semibold tracking-tight">Modelizia</h1>
        </Link>

        <div className="hidden items-center gap-2 lg:flex">
          <Badge variant="secondary">{tables.length} table{tables.length === 1 ? "" : "s"}</Badge>
          <Badge variant="secondary">{relations.length} relation{relations.length === 1 ? "" : "s"}</Badge>
        </div>

        {/* Menu projet : regroupe les actions fichier pour alléger la topbar. */}
        <Menu.Root>
          <Menu.Trigger
            aria-label="Actions du projet"
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground data-popup-open:bg-muted"
          >
            <MoreHorizontal className="size-4" />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner side="bottom" align="start" sideOffset={6} className="z-50">
              <Menu.Popup className="glass-panel min-w-44 rounded-xl p-1 shadow-xl ring-1 ring-foreground/10 backdrop-blur-md">
                <Menu.Item className={headerMenuItemClass} onClick={() => openFileAction("import")}>
                  Importer
                </Menu.Item>
                <Menu.Item className={headerMenuItemClass} onClick={() => openFileAction("templates")}>
                  <LayoutTemplate className="size-4" /> Modèles
                </Menu.Item>
                <Menu.Item className={headerMenuItemClass} onClick={() => openFileAction("export")}>
                  Exporter
                </Menu.Item>
                <Menu.Item
                  className={cn(headerMenuItemClass, "text-destructive data-highlighted:bg-destructive/10")}
                  onClick={() => openFileAction("reset")}
                >
                  Effacer
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </div>

      {/* ── Zone centrale : outils canvas + score de santé ── */}
      <div className="flex min-w-0 flex-1 items-center justify-center gap-2 px-2">
        <div className="flex shrink-0 items-center gap-1">
          <Tooltip label="Annuler" shortcut="mod+z">
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={undo}
              disabled={!canUndo}
              aria-label="Annuler"
            >
              <Undo2 className="size-4" />
            </Button>
          </Tooltip>
          <Tooltip label="Rétablir" shortcut="mod+shift+z">
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={redo}
              disabled={!canRedo}
              aria-label="Rétablir"
            >
              <Redo2 className="size-4" />
            </Button>
          </Tooltip>
        </div>

        <span aria-hidden className="hidden h-6 w-px shrink-0 bg-border sm:block" />

        <Tooltip label="Disposition automatique" shortcut="A">
          <Button
            size="sm"
            variant="outline"
            onClick={handleAutoLayout}
            className="shrink-0"
          >
            <LayoutGrid className="size-4" />
            <span className="hidden lg:inline">Disposition</span>
          </Button>
        </Tooltip>
        {/* Smart-join : scanne le schéma et connecte les relations orphelines (annulable). */}
        <Tooltip label="Auto-détecter les relations (annulable)" side="bottom">
          <Button size="sm" variant="outline" onClick={handleAutoDetect} className="shrink-0">
            <Wand2 className="size-4" />
            <span className="hidden lg:inline">Auto-détecter</span>
          </Button>
        </Tooltip>

        <span aria-hidden className="hidden h-6 w-px shrink-0 bg-border sm:block" />

        <HealthPill
          onOpenIssues={() => setIssuesOpen(true)}
          onNormalize={handleNormalize}
        />
      </div>

      {/* ── Zone droite : code + collaboration + utilitaires ── */}
      <div className="flex shrink-0 items-center gap-2">
        <Button
          size="sm"
          variant="default"
          nativeButton={false}
          render={<Link href="/studio/code" />}
          className="shrink-0"
        >
          <Code2 className="size-4" />
          <span className="hidden md:inline">Studio de Code</span>
        </Button>

        <span aria-hidden className="hidden h-6 w-px shrink-0 bg-border sm:block" />

        {/* Bloc session : dropdown salon | avatars + « N en ligne » | Partager. */}
        <CollabToolbar />

        <span aria-hidden className="hidden h-6 w-px shrink-0 bg-border sm:block" />

        {/* Outils secondaires : recherche, focus, raccourcis, activité. */}
        <div className="flex items-center gap-1">
          <Tooltip label="Palette de commandes" shortcut="mod+k" side="bottom">
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={() =>
                window.dispatchEvent(
                  new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }),
                )
              }
              aria-label="Palette de commandes (Ctrl+K)"
            >
              <Search className="size-4" />
            </Button>
          </Tooltip>

          <Tooltip label="Focus Graphe — plein écran canvas" shortcut="shift+z" side="bottom">
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={toggleCanvasFocus}
              aria-pressed={focusCanvasOnly}
              aria-label="Basculer le Focus Graphe (Shift+Z)"
            >
              <Frame className="size-4" />
            </Button>
          </Tooltip>

          <Tooltip label="Raccourcis clavier" shortcut="?" side="bottom">
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={() => setShortcutsOpen(true)}
              aria-label="Raccourcis clavier"
            >
              <Keyboard className="size-4" />
            </Button>
          </Tooltip>

          {/* Journal d'activité : notifications de session, tout à droite. */}
          <Tooltip label="Journal d'activité" side="bottom">
            <Button
              size="icon"
              variant="ghost"
              className="size-8"
              onClick={() => setActivityOpen(true)}
              aria-label="Journal d'activité"
              aria-pressed={activityOpen}
              data-export-hidden
            >
              <Activity className="size-4" />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Controlled dialogs opened from the grouped menu. */}
      <ImportDialog
        open={fileAction === "import"}
        onOpenChange={(open) => setFileAction(open ? "import" : null)}
      />
      <TemplatesDialog
        open={fileAction === "templates"}
        onOpenChange={(open) => setFileAction(open ? "templates" : null)}
      />
      <ExportMenu
        open={fileAction === "export"}
        onOpenChange={(open) => setFileAction(open ? "export" : null)}
      />
      <ResetButton
        open={fileAction === "reset"}
        onOpenChange={(open) => setFileAction(open ? "reset" : null)}
      />

      <Sheet open={issuesOpen} onOpenChange={setIssuesOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Rapport de validation</SheetTitle>
            <SheetDescription>
              {errorCount} erreur{errorCount === 1 ? "" : "s"}, {warningCount}{" "}
              avertissement{warningCount === 1 ? "" : "s"} détecté
              {errorCount + warningCount === 1 ? "" : "s"} dans le graphe.
            </SheetDescription>
          </SheetHeader>
          <ul className="flex flex-col gap-2 overflow-y-auto p-4">
            {validationIssues.length === 0 && (
              <li className="rounded-lg border border-border p-3 text-xs text-muted-foreground">
                Le graphe est sain. Aucune erreur ni avertissement.
              </li>
            )}
            {validationIssues.map((issue) => (
              <li
                key={issue.id}
                className="rounded-lg border border-border p-3"
              >
                <div className="flex items-center gap-2">
                  {issue.severity === "error" ? (
                    <OctagonAlert className="size-4 shrink-0 text-destructive" />
                  ) : (
                    <AlertTriangle className="size-4 shrink-0 text-amber-500" />
                  )}
                  <Badge
                    variant={issue.severity === "error" ? "destructive" : "secondary"}
                  >
                    {issue.severity === "error" ? "erreur" : "avertissement"}
                  </Badge>
                  <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                    {tableNameOf(issue.target.tableId)}
                  </span>
                </div>
                <p className="mt-2 text-xs">{issue.message}</p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={() => {
                    selectNode(issue.target.tableId);
                    setIssuesOpen(false);
                  }}
                >
                  Aller à {tableNameOf(issue.target.tableId)}
                </Button>
              </li>
            ))}
          </ul>
        </SheetContent>
      </Sheet>

      {/* Global keyboard cheatsheet, opened with `?` or the header button. */}
      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </header>
  );
}
