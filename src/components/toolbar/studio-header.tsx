"use client";

/**
 * StudioHeader.tsx — TopBar du Studio Modelizia (refonte).
 *
 * Trois zones sur une grille `1fr | auto | 1fr` (le centre reste réellement centré) :
 *   • Gauche  : logo, nom du projet (éditable), compteurs tables / relations, menu projet.
 *   • Centre  : undo / redo, disposition, auto-détection, score de santé.
 *   • Droite  : salon + avatars + Partager, Studio de Code, outils secondaires.
 *
 * Fichier autonome (dialogues inclus). Les imports vers stores / engine / hooks sont
 * ceux du projet, inchangés.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";

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
  MoreHorizontal,
  OctagonAlert,
  Palette,
  Pencil,
  Plus,
  Redo2,
  Search,
  Shapes,
  Share2,
  ShieldCheck,
  Trash2,
  TriangleAlert,
  Undo2,
  UserRound,
  Wand2,
  Zap,
} from "lucide-react";

import { Menu } from "@base-ui/react/menu";

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
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Kbd, formatShortcut } from "@/components/ui/kbd";

import { useGraphStore } from "@/store/graph-store";
import { useCollabStore } from "@/store/collab-store";
import {
  useProfileStore,
  DEFAULT_USERNAME,
  USERNAME_MAX_LENGTH,
} from "@/store/profile-store";
import { useFocusStore, toggleCanvasFocus } from "@/store/focus-store";

import { DEFAULT_ROOM_ID } from "@/lib/collab/transport";

import { computeHealthScore } from "@/lib/engine/health-score";
import { countNormalizations } from "@/lib/engine/normalize";
import {
  parsePrismaSchema,
  parseSqlSchema,
  compileToPrisma,
  compileToSql,
} from "@/lib/engine";
import type { ParsedSchema } from "@/lib/engine/parser";
import {
  downloadTextFile,
  exportCanvasPng,
  exportCanvasSvg,
  exportProjectZip,
} from "@/lib/export/image";

import { useHealthCelebration } from "@/hooks/use-health-celebration";
import { useCheatsheet } from "@/hooks/use-cheatsheet";

import { AVATAR_COLORS, type CollabRole } from "@/types";
import { PRESET_TEMPLATES } from "@/lib/templates/presets";
import { QUICK_STARTERS } from "@/lib/templates/quick-starters";

// ============================================================================
// Types & constantes
// ============================================================================

/** Dialogues que la palette de commandes peut demander d'ouvrir. */
export type CommandDialogKind =
  | "import"
  | "templates"
  | "export"
  | "issues"
  | "shortcuts";

type FileAction = "import" | "templates" | "export" | "reset";

const PROJECT_NAME_KEY = "modelizia:project-name";
const DEFAULT_PROJECT_NAME = "Projet sans titre";
const PROJECT_NAME_MAX = 48;

const menuItemClass =
  "flex h-8 cursor-default items-center gap-2 rounded-md px-2 text-[13px] text-foreground outline-none select-none data-highlighted:bg-muted";

const menuPopupClass =
  "min-w-48 rounded-xl border border-border/40 bg-background/90 p-1 shadow-xl backdrop-blur-md";

// ============================================================================
// Utilitaires
// ============================================================================

function describeNormalization(summary: {
  addedPk: string[];
  promotedPk: string[];
  fixedFkTypes: string[];
  addedIndexes: string[];
}): string {
  const parts: string[] = [];
  const pk = summary.addedPk.length + summary.promotedPk.length;
  if (pk) parts.push(`${pk} clé(s) primaire(s)`);
  if (summary.fixedFkTypes.length)
    parts.push(`${summary.fixedFkTypes.length} type(s) FK corrigé(s)`);
  if (summary.addedIndexes.length)
    parts.push(`${summary.addedIndexes.length} index unique(s)`);
  return parts.join(" · ");
}

function scoreTone(score: number): { bar: string; text: string; hover: string } {
  if (score >= 90)
    return { bar: "bg-emerald-500", text: "text-emerald-700", hover: "hover:bg-emerald-500/10" };
  if (score >= 75)
    return { bar: "bg-sky-500", text: "text-sky-700", hover: "hover:bg-sky-500/10" };
  if (score >= 50)
    return { bar: "bg-amber-500", text: "text-amber-700", hover: "hover:bg-amber-500/10" };
  return { bar: "bg-rose-500", text: "text-rose-700", hover: "hover:bg-rose-500/10" };
}

const plural = (n: number, one: string, many = `${one}s`): string =>
  n === 1 ? one : many;

// ============================================================================
// Primitives UI de la barre
// ============================================================================

/** Séparateur vertical discret entre deux groupes d'actions. */
function Divider({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("hidden h-5 w-px shrink-0 bg-border/60 sm:block", className)}
    />
  );
}

/** Bouton icône ghost + tooltip (undo, redo, outils secondaires…). */
function IconAction({
  label,
  shortcut,
  onClick,
  disabled,
  pressed,
  exportHidden,
  className,
  children,
}: {
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
  exportHidden?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Tooltip label={label} shortcut={shortcut} side="bottom">
      <Button
        size="icon"
        variant="ghost"
        className={cn("size-8 text-muted-foreground hover:text-foreground", className)}
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-pressed={pressed}
        data-export-hidden={exportHidden ? "" : undefined}
      >
        {children}
      </Button>
    </Tooltip>
  );
}

// ============================================================================
// Avatar
// ============================================================================

export const ROLE_META: Record<
  CollabRole,
  { label: string; ring: string; text: string }
> = {
  owner: { label: "Propriétaire", ring: "ring-violet-400", text: "text-violet-700" },
  editor: { label: "Éditeur", ring: "ring-emerald-400", text: "text-emerald-700" },
  viewer: { label: "Lecteur", ring: "ring-slate-300", text: "text-slate-600" },
};

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
        "flex shrink-0 items-center justify-center rounded-full font-semibold ring-2 ring-background select-none",
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
// Zone gauche — nom du projet éditable
// ============================================================================

/**
 * Nom de projet éditable en ligne (Entrée / blur = valider, Échap = annuler).
 * Persisté dans localStorage ; lecture au montage pour éviter tout mismatch SSR.
 */
function ProjectName() {
  const [name, setName] = useState(DEFAULT_PROJECT_NAME);
  const [draft, setDraft] = useState(DEFAULT_PROJECT_NAME);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(PROJECT_NAME_KEY);
      if (saved?.trim()) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setName(saved);
        setDraft(saved);
      }
    } catch {
      /* stockage indisponible : on garde le défaut */
    }
  }, []);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commit = (): void => {
    const next = draft.trim().slice(0, PROJECT_NAME_MAX) || DEFAULT_PROJECT_NAME;
    setName(next);
    setDraft(next);
    setEditing(false);
    try {
      window.localStorage.setItem(PROJECT_NAME_KEY, next);
    } catch {
      /* ignore */
    }
  };

  const cancel = (): void => {
    setDraft(name);
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        maxLength={PROJECT_NAME_MAX}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") cancel();
        }}
        aria-label="Nom du projet"
        className="h-7 w-40 min-w-0 rounded-md border border-border/60 bg-background px-2 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:w-52"
      />
    );
  }

  return (
    <Tooltip label="Renommer le projet" side="bottom">
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="group flex h-7 max-w-40 min-w-0 items-center gap-1.5 rounded-md px-2 text-sm font-medium text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 sm:max-w-56"
        aria-label={`Projet : ${name}. Cliquer pour renommer`}
      >
        <span className="truncate">{name}</span>
        <Pencil className="size-3 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
      </button>
    </Tooltip>
  );
}

// ============================================================================
// Zone centrale — HealthPill
// ============================================================================

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
  const canNormalize = Boolean(onNormalize) && !perfect && tables.length > 0;
  const issueCount = health.errorCount + health.warningCount;
  // `silent` : le confetti global vit dans le layout, pas de double animation.
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
    <div
      className={cn(
        "flex items-center gap-1 rounded-full border border-border/40 py-0.5 pr-0.5 pl-2 transition-colors",
        tone.hover,
      )}
    >
      <Tooltip
        label={`${health.score}% — ${health.rank.label} · ${health.errorCount} erreur(s), ${health.warningCount} avertissement(s) · ${nextRankHint}`}
        side="bottom"
      >
        <button
          type="button"
          onClick={onOpenIssues}
          className="flex h-6 items-center gap-1.5 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          aria-label={`Santé du schéma ${health.score}%, ouvrir le rapport`}
        >
          {perfect ? (
            <Award
              key={`award-${celebration.shineKey}`}
              className={cn(
                "size-3.5 text-emerald-600",
                celebration.shineKey > 0 && "badge-shine rounded-full",
              )}
            />
          ) : (
            <ShieldCheck className={cn("size-3.5 transition-colors", tone.text)} />
          )}
          <span
            key={`score-${celebration.popKey}`}
            className={cn(
              "text-xs font-semibold whitespace-nowrap tabular-nums transition-colors",
              tone.text,
              celebration.popKey > 0 && "score-pop inline-block",
            )}
          >
            {health.score}%
          </span>
          <span className="hidden h-1.5 w-14 overflow-hidden rounded-full bg-muted md:block">
            <span
              className={cn(
                "block h-full rounded-full transition-all duration-500",
                tone.bar,
                perfect && "progress-shimmer",
              )}
              style={{ width: `${health.score}%` }}
            />
          </span>
          {issueCount > 0 && (
            <span
              className="flex items-center gap-0.5 text-xs font-medium text-amber-600 tabular-nums"
              aria-label={`${issueCount} problème${issueCount === 1 ? "" : "s"}`}
            >
              <TriangleAlert className="size-3" />
              {issueCount}
            </span>
          )}
        </button>
      </Tooltip>

      {canNormalize ? (
        <Tooltip
          label="Normaliser en 1 clic (PK, types FK, index uniques)"
          side="bottom"
        >
          <button
            type="button"
            onClick={onNormalize}
            className="flex h-6 items-center gap-1 rounded-full bg-primary/10 px-2 text-xs font-medium text-primary transition-colors hover:bg-primary/20 focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
            aria-label="Normaliser le schéma"
          >
            <Zap className="size-3" />
            <span className="hidden xl:inline">Normaliser</span>
          </button>
        </Tooltip>
      ) : (
        <span className="w-1.5" aria-hidden />
      )}
    </div>
  );
}

// ============================================================================
// Zone droite — collaboration
// ============================================================================

const STATUS_META = {
  connected: { dot: "bg-emerald-500", label: "Connecté" },
  connecting: { dot: "bg-amber-400 animate-pulse", label: "Connexion…" },
  disconnected: { dot: "bg-slate-300", label: "Hors ligne" },
} as const;

/**
 * `[ salon ▾ ] [ avatars + N en ligne ] [ profil ] [ Partager ]`
 */
export function CollabToolbar() {
  const self = useCollabStore((s) => s.self);
  const participants = useCollabStore((s) => s.participants);
  const status = useCollabStore((s) => s.status);
  const roomId = useCollabStore((s) => s.roomId);
  const joinRoom = useCollabStore((s) => s.joinRoom);

  const [shareOpen, setShareOpen] = useState(false);
  const [shareMode, setShareMode] = useState<"share" | "join">("share");
  const [profileOpen, setProfileOpen] = useState(false);

  useEffect(() => {
    useProfileStore.getState().hydrate();
  }, []);

  const currentRoom = roomId || DEFAULT_ROOM_ID;
  const statusMeta = STATUS_META[status];
  const connected = status === "connected";

  const openShare = (mode: "share" | "join"): void => {
    setShareMode(mode);
    setShareOpen(true);
  };

  const openProfile = (): void => {
    useProfileStore.getState().hydrate();
    setProfileOpen(true);
  };

  const createRoom = (): void => {
    const nextRoom = `salon-${Math.random().toString(36).substring(2, 8)}`;
    joinRoom(undefined, undefined, nextRoom);
    window.history.pushState(null, "", `/studio?room=${encodeURIComponent(nextRoom)}`);
    pushToast(`Salon créé : ${nextRoom}`, { type: "success", duration: 3000 });
  };

  const copyRoomId = (): void => {
    navigator.clipboard
      .writeText(currentRoom)
      .then(() => pushToast("ID du salon copié", { type: "success" }))
      .catch(() => pushToast("Copie impossible", { type: "error" }));
  };

  const others = participants.filter((p) => p.id !== self.id);
  const visible = others.slice(0, 3);
  const overflow = Math.max(0, others.length - visible.length);
  const stack = [self, ...visible];
  const onlineCount = others.length + 1;

  return (
    <>
      {/* Salon */}
      <Menu.Root>
        <Menu.Trigger
          aria-label={`Salon ${currentRoom} — ${statusMeta.label}`}
          className="flex h-8 max-w-44 items-center gap-2 rounded-full border border-border/40 px-2.5 text-xs font-medium text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50 data-popup-open:bg-muted"
        >
          <span className={cn("size-1.5 shrink-0 rounded-full", statusMeta.dot)} />
          <span className="hidden truncate sm:inline">{currentRoom}</span>
          <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner side="bottom" align="end" sideOffset={6} className="z-50">
            <Menu.Popup className={menuPopupClass}>
              <div className="px-2 pt-1.5 pb-1 text-[11px] text-muted-foreground">
                {statusMeta.label} · <span className="font-mono">{currentRoom}</span>
              </div>
              <Menu.Item className={menuItemClass} onClick={createRoom}>
                <Plus className="size-4" /> Créer un nouveau salon
              </Menu.Item>
              <Menu.Item className={menuItemClass} onClick={() => openShare("join")}>
                <LogIn className="size-4" /> Rejoindre un salon
              </Menu.Item>
              <Menu.Item className={menuItemClass} onClick={copyRoomId}>
                <Copy className="size-4" /> Copier l&apos;ID du salon
              </Menu.Item>
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>

      {/* Présence */}
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => openShare("share")}
          aria-label="Gérer la session collaborative"
          className="flex items-center gap-2 rounded-full pr-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <span className="flex items-center">
            {stack.map((user, i) => (
              <span
                key={user.id}
                className="-ml-2 transition-transform first:ml-0 hover:z-10 hover:-translate-y-0.5"
                style={{ zIndex: stack.length - i }}
              >
                <Avatar name={user.name} color={user.avatarColor} role={user.role} size="sm" />
              </span>
            ))}
            {overflow > 0 && (
              <span className="-ml-2 flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-semibold text-muted-foreground ring-2 ring-background">
                +{overflow}
              </span>
            )}
          </span>
          <span
            className={cn(
              "hidden text-xs font-medium xl:inline",
              connected ? "text-emerald-600" : "text-muted-foreground",
            )}
          >
            {connected ? `${onlineCount} en ligne` : statusMeta.label}
          </span>
        </button>

        <Tooltip label="Mon profil — pseudo & couleur" side="bottom">
          <button
            type="button"
            onClick={openProfile}
            aria-label="Modifier mon profil"
            className="relative flex items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <Avatar name={self.name} color={self.avatarColor} role={self.role} size="sm" />
            <span className="absolute -right-1 -bottom-1 flex size-3.5 items-center justify-center rounded-full border border-border/60 bg-background text-muted-foreground shadow-sm">
              <Pencil className="size-2" aria-hidden />
            </span>
          </button>
        </Tooltip>
      </div>

      <Button
        size="sm"
        variant="outline"
        className="rounded-full"
        onClick={() => openShare("share")}
      >
        <Share2 className="size-4" />
        <span className="hidden sm:inline">Partager</span>
      </Button>

      <ShareModal
        open={shareOpen}
        onOpenChange={setShareOpen}
        mode={shareMode}
        onEditProfile={() => {
          setShareOpen(false);
          openProfile();
        }}
      />
      <ProfileModal open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}

// ============================================================================
// ShareModal
// ============================================================================

const buildShareLink = (roomId: string): string => {
  const path = `/studio?room=${encodeURIComponent(roomId)}`;
  return typeof window === "undefined" ? path : `${window.location.origin}${path}`;
};

const ROLE_KEYS: CollabRole[] = ["owner", "editor", "viewer"];

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
      <SelectTrigger className={className}>{ROLE_META[value].label}</SelectTrigger>
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

export function ShareModal({
  open,
  onOpenChange,
  mode = "share",
  onEditProfile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: "share" | "join";
  onEditProfile?: () => void;
}) {
  const roomId = useCollabStore((s) => s.roomId);
  const status = useCollabStore((s) => s.status);
  const self = useCollabStore((s) => s.self);
  const participants = useCollabStore((s) => s.participants);
  const joinRoom = useCollabStore((s) => s.joinRoom);
  const setRole = useCollabStore((s) => s.setRole);

  const [copied, setCopied] = useState(false);
  const [draftRoom, setDraftRoom] = useState("");

  const currentRoom = roomId || DEFAULT_ROOM_ID;
  const shareLink = useMemo(() => buildShareLink(currentRoom), [currentRoom]);
  const connected = status === "connected";
  const isOwner = self.role === "owner";
  const others = participants.filter((p) => p.id !== self.id);

  useEffect(() => {
    if (!copied) return;
    const t = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(t);
  }, [copied]);

  const copyLink = (): void => {
    navigator.clipboard
      .writeText(shareLink)
      .then(() => {
        setCopied(true);
        pushToast("Lien copié", { type: "success" });
      })
      .catch(() => pushToast("Copie impossible", { type: "error" }));
  };

  const joinTarget = (target: string): void => {
    joinRoom(undefined, undefined, target);
    window.history.pushState(null, "", `/studio?room=${encodeURIComponent(target)}`);
  };

  const handleJoinDraft = (): void => {
    const target = draftRoom.trim();
    if (!target) return;
    joinTarget(target);
    setDraftRoom("");
    onOpenChange(false);
    pushToast(`Salon rejoint : ${target}`, { type: "success" });
  };

  const handleStart = (): void => {
    joinTarget(currentRoom);
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
          {mode === "join" && (
            <div className="flex items-center gap-2">
              <Input
                autoFocus
                value={draftRoom}
                onChange={(e) => setDraftRoom(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleJoinDraft();
                }}
                placeholder="salon-xxxxxx"
                aria-label="ID du salon"
                className="h-9 flex-1 font-mono text-sm"
              />
              <Button onClick={handleJoinDraft} disabled={!draftRoom.trim()}>
                <LogIn className="size-4" /> Rejoindre
              </Button>
            </div>
          )}

          <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-muted/40 p-2 pl-3">
            <input
              readOnly
              value={shareLink}
              aria-label="Lien d'invitation"
              className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            />
            <Button size="sm" variant="outline" onClick={copyLink} className="shrink-0">
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
              Participants ({others.length + 1})
            </p>
            <ul className="max-h-48 space-y-1 overflow-y-auto">
              <li className="flex items-center gap-2 rounded-md px-1.5 py-1">
                <Avatar name={self.name} color={self.avatarColor} role={self.role} size="sm" />
                <span className="truncate text-sm">{self.name}</span>
                <span className={cn("ml-auto text-xs", ROLE_META[self.role].text)}>
                  {ROLE_META[self.role].label} (vous)
                </span>
                {onEditProfile && (
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-6"
                    onClick={onEditProfile}
                    aria-label="Modifier mon profil"
                  >
                    <Pencil className="size-3" />
                  </Button>
                )}
              </li>
              {others.map((p) => (
                <li key={p.id} className="flex items-center gap-2 rounded-md px-1.5 py-1">
                  <Avatar name={p.name} color={p.avatarColor} role={p.role} size="sm" />
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

          {!connected && mode !== "join" && (
            <Button className="w-full" onClick={handleStart}>
              <Link2 className="size-4" /> Démarrer la session
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// ProfileModal
// ============================================================================

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

  // Re-seed du brouillon à chaque ouverture (ajustement d'état en phase de rendu).
  const [seededOpen, setSeededOpen] = useState(open);
  if (open !== seededOpen) {
    setSeededOpen(open);
    if (open) {
      const profile = useProfileStore.getState();
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
    useProfileStore.getState().setProfile({ username, userColor: draftColor });
    useCollabStore.getState().applyProfile({ username, userColor: draftColor });
    pushToast("Profil mis à jour", {
      type: "success",
      description: "Pseudo et couleur appliqués à votre curseur et vos avatars.",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserRound className="size-4" /> Mon profil
          </DialogTitle>
          <DialogDescription>
            Votre pseudo et votre couleur sont visibles par les collaborateurs
            (curseurs, avatars, activité) et mémorisés pour vos prochaines sessions.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/40 p-3">
            <Avatar name={trimmedName || DEFAULT_USERNAME} color={draftColor} role={role} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{trimmedName || DEFAULT_USERNAME}</p>
              <p className="text-xs text-muted-foreground">Aperçu — curseur & avatars</p>
            </div>
          </div>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium">Pseudo</span>
            <Input
              value={draftName}
              onChange={(e) => setDraftName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  save();
                }
              }}
              maxLength={USERNAME_MAX_LENGTH}
              placeholder={DEFAULT_USERNAME}
            />
            <span className="text-xs text-muted-foreground">
              {trimmedName.length}/{USERNAME_MAX_LENGTH}
            </span>
          </label>

          <div className="flex flex-col gap-1.5 text-sm">
            <span className="flex items-center gap-1.5 font-medium">
              <Palette className="size-3.5" /> Couleur
            </span>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Couleur du profil">
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
                      "flex size-8 items-center justify-center rounded-full transition-transform outline-none hover:scale-110 focus-visible:ring-2 focus-visible:ring-ring",
                      selected
                        ? "ring-2 ring-foreground ring-offset-2 ring-offset-background"
                        : "ring-1 ring-border",
                    )}
                    style={{ backgroundColor: color }}
                  >
                    {selected && <Check className="size-4 text-slate-800" aria-hidden />}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 border-t border-border/40 pt-3">
            <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
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
// ImportDialog
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

const SQL_SAMPLE = `CREATE TYPE "Role" AS ENUM ('ADMIN', 'USER');

CREATE TABLE "User" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "email" TEXT NOT NULL UNIQUE,
  "role" "Role" NOT NULL DEFAULT 'USER'
);`;

type Format = "prisma" | "sql";

const ACCEPTED_EXTENSIONS = [".prisma", ".sql", ".json", ".txt"] as const;
const ACCEPT_ATTRIBUTE = ACCEPTED_EXTENSIONS.join(",");

const getExtension = (fileName: string): string => {
  const idx = fileName.lastIndexOf(".");
  return idx === -1 ? "" : fileName.slice(idx).toLowerCase();
};

const detectFormat = (fileName: string, content: string): Format => {
  const ext = getExtension(fileName);
  if (ext === ".sql") return "sql";
  if (ext === ".prisma") return "prisma";
  const looksSql =
    /\bCREATE\s+(TABLE|TYPE|SCHEMA)\b/i.test(content) ||
    /\bALTER\s+TABLE\b/i.test(content);
  const looksPrisma =
    /\bmodel\s+[A-Za-z_]/i.test(content) || /\benum\s+[A-Za-z_]/i.test(content);
  return looksSql && !looksPrisma ? "sql" : "prisma";
};

export function ImportDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const loadSchema = useGraphStore((s) => s.loadSchema);
  const [format, setFormat] = useState<Format>("prisma");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isReading, setIsReading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const parseAndLoad = (source: string, activeFormat: Format): void => {
    setError(null);
    setSuccess(null);
    if (!source.trim()) {
      setError("Collez d'abord du code — ou déposez un fichier.");
      return;
    }
    let parsed: ParsedSchema;
    try {
      parsed =
        activeFormat === "prisma" ? parsePrismaSchema(source) : parseSqlSchema(source);
      if (parsed.tables.length === 0) {
        throw new Error("Aucune table trouvée dans le contenu fourni.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur lors de l'import.");
      return;
    }
    loadSchema(parsed);
    setSuccess(
      `Import réussi : ${parsed.tables.length} table(s) · ${parsed.relations.length} relation(s).`,
    );
  };

  const handleLoadSample = (): void => {
    const sample = format === "prisma" ? PRISMA_SAMPLE : SQL_SAMPLE;
    setCode(sample);
    parseAndLoad(sample, format);
  };

  const handleFiles = (files: FileList | null): void => {
    if (!files || files.length === 0) return;
    const file = files[0];
    const reader = new FileReader();
    setIsReading(true);
    reader.onload = (event) => {
      const content = String(event.target?.result ?? "");
      const detected = detectFormat(file.name, content);
      setFormat(detected);
      setCode(content);
      setIsReading(false);
      parseAndLoad(content, detected);
    };
    reader.onerror = () => {
      setIsReading(false);
      setError("Impossible de lire le fichier.");
    };
    reader.readAsText(file);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importer un schéma</DialogTitle>
          <DialogDescription>
            Collez du Prisma ou du SQL, ou déposez un fichier. L&apos;import remplace
            le canvas actuel (annulable via Ctrl+Z).
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="paste" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="paste" className="text-xs">
              Coller du code
            </TabsTrigger>
            <TabsTrigger value="file" className="text-xs">
              Déposer un fichier
            </TabsTrigger>
          </TabsList>

          <TabsContent value="paste" className="mt-3 space-y-3">
            <Tabs value={format} onValueChange={(v) => setFormat(v as Format)}>
              <TabsList className="flex gap-1">
                <TabsTrigger value="prisma" className="text-xs">
                  Prisma
                </TabsTrigger>
                <TabsTrigger value="sql" className="text-xs">
                  SQL
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <CodeBox
              code={code}
              setCode={setCode}
              label={format === "prisma" ? "schéma Prisma" : "migration SQL"}
            />
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleLoadSample} disabled={isReading}>
                Charger un exemple
              </Button>
              <Button onClick={() => parseAndLoad(code, format)} disabled={isReading}>
                {isReading ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" /> Lecture…
                  </>
                ) : (
                  "Analyser et charger"
                )}
              </Button>
            </div>
            {error && <p className="text-xs text-destructive">{error}</p>}
            {success && <p className="text-xs text-emerald-600">{success}</p>}
          </TabsContent>

          <TabsContent value="file" className="mt-3 space-y-3">
            <DropZone
              onFiles={handleFiles}
              onBrowse={() => fileInputRef.current?.click()}
              isReading={isReading}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_ATTRIBUTE}
              className="hidden"
              onChange={(e) => {
                handleFiles(e.target.files);
                e.target.value = "";
              }}
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
            {success && <p className="text-xs text-emerald-600">{success}</p>}
          </TabsContent>
        </Tabs>
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
            : "Glissez un fichier .prisma, .sql ou .txt ici"}
      </p>
      <p className="text-xs text-muted-foreground">
        ou cliquez pour parcourir · {ACCEPTED_EXTENSIONS.join(", ")}
      </p>
    </div>
  );
}

function CodeBox({
  code,
  setCode,
  label,
}: {
  code: string;
  setCode: (v: string) => void;
  label: string;
}) {
  return (
    <textarea
      value={code}
      onChange={(e) => setCode(e.target.value)}
      placeholder={`Collez votre ${label} ici…`}
      spellCheck={false}
      aria-label={label}
      className="h-64 w-full rounded-lg border border-input bg-background p-3 font-mono text-xs outline-none focus-visible:border-ring"
    />
  );
}

// ============================================================================
// TemplatesDialog
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

  const all = useMemo(
    () => [
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
    ],
    [],
  );

  const pending = all.find((t) => t.id === pendingId) ?? null;

  const confirmLoad = (): void => {
    if (!pending) return;
    applyQuickStarter(pending.schema); // un seul checkpoint : Ctrl+Z restaure
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
            Charger un modèle remplace le canvas actuel. Confirmez avant d&apos;appliquer.
          </DialogDescription>
        </DialogHeader>

        {!pending ? (
          <ul className="grid max-h-[60vh] gap-2 overflow-y-auto pr-1">
            {all.map((t) => (
              <li key={t.id} className="rounded-lg border border-border/60 p-3">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold">{t.name}</span>
                  <Badge variant="outline">{t.tag}</Badge>
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
                <Button
                  size="sm"
                  className="mt-2"
                  variant="outline"
                  onClick={() => setPendingId(t.id)}
                >
                  Aperçu et chargement
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-lg border border-border/60 p-3">
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
            <DialogFooter className="mt-3">
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
// ExportMenu
// ============================================================================

type TextExport = "json" | "prisma" | "sql";

const TEXT_EXPORT_FILENAME: Record<TextExport, string> = {
  json: "schema.json",
  prisma: "schema.prisma",
  sql: "schema.sql",
};

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

  const doExport = (kind: TextExport): void => {
    const ast = getSchemaAst();
    const filename = TEXT_EXPORT_FILENAME[kind];
    if (kind === "json") {
      downloadTextFile(filename, JSON.stringify(ast, null, 2), "application/json");
    } else if (kind === "prisma") {
      downloadTextFile(filename, compileToPrisma(ast));
    } else {
      downloadTextFile(filename, compileToSql(ast));
    }
    setStatus(`${filename} téléchargé.`);
    pushToast("Export terminé", { type: "success", description: filename });
  };

  const runAsync = async (
    key: string,
    label: string,
    task: () => Promise<void>,
  ): Promise<void> => {
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
          <Button
            className="justify-start"
            disabled={busy !== null}
            onClick={() =>
              void runAsync("zip", "modelizia-project.zip", () =>
                exportProjectZip(getSchemaAst()),
              )
            }
          >
            <Archive className="size-4" />
            {busy === "zip" ? "Compression…" : "Pack projet complet (.zip)"}
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
          <Button
            variant="outline"
            className="justify-start"
            disabled={busy !== null}
            onClick={() =>
              void runAsync("png", "modelizia-diagram@3x.png", () =>
                exportCanvasPng("modelizia-diagram@3x.png", 3),
              )
            }
          >
            <ImageDown className="size-4" />
            {busy === "png" ? "Rendu HD…" : "Image PNG HD ×3 (diagramme épuré)"}
          </Button>
          <Button
            variant="outline"
            className="justify-start"
            disabled={busy !== null}
            onClick={() =>
              void runAsync("svg", "modelizia-diagram.svg", () => exportCanvasSvg())
            }
          >
            <Shapes className="size-4" />
            {busy === "svg" ? "Rendu…" : "Image SVG vectorielle (diagramme épuré)"}
          </Button>
        </div>
        {status && <p className="text-xs text-muted-foreground">{status}</p>}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// ResetButton
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
            Cette action remplace le schéma actuel. Elle est irréversible sauf si
            vous l&apos;avez exporté.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <Button
            variant={mode === "empty" ? "default" : "outline"}
            aria-pressed={mode === "empty"}
            onClick={() => setMode("empty")}
          >
            Effacer vers un canvas vide
          </Button>
          <Button
            variant={mode === "seed" ? "default" : "outline"}
            aria-pressed={mode === "seed"}
            onClick={() => setMode("seed")}
          >
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
// ShortcutsDialog
// ============================================================================

interface ShortcutGroup {
  title: string;
  items: { keys: string; label: string }[];
}

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
      { keys: "Échap", label: "Quitter le Focus Graphe / désélectionner" },
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
      { keys: "mod+k", label: "Palette de commandes" },
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

export function ShortcutsDialog({
  open,
  onOpenChange,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const toggleInternal = useCallback(() => setInternalOpen((v) => !v), []);
  useCheatsheet(toggleInternal);

  // Double mode : `?` pilote l'état interne, le bouton de la barre les props.
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
        <div className="grid max-h-[65vh] gap-4 overflow-y-auto pr-1">
          {GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {group.title}
              </h3>
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <li
                    key={item.keys + item.label}
                    className="flex items-center justify-between gap-3 rounded-md px-2 py-1 text-sm odd:bg-muted/40"
                  >
                    <span>{item.label}</span>
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
// StudioHeader — composant principal
// ============================================================================

export function StudioHeader() {
  const tables = useGraphStore((s) => s.tables);
  const relations = useGraphStore((s) => s.relations);
  const validationIssues = useGraphStore((s) => s.validationIssues);
  const applyAutoLayout = useGraphStore((s) => s.applyAutoLayout);
  const normalizeSchema = useGraphStore((s) => s.normalizeSchema);
  const autoDetectRelations = useGraphStore((s) => s.autoDetectRelations);
  const selectNode = useGraphStore((s) => s.selectNode);
  const hydrateFromStorage = useGraphStore((s) => s.hydrateFromStorage);
  const undo = useGraphStore((s) => s.undo);
  const redo = useGraphStore((s) => s.redo);
  // Abonnement réactif : re-render des boutons quand l'historique change.
  const historyVersion = useGraphStore((s) => s.historyVersion);
  const canUndo = useGraphStore((s) => s.canUndo)();
  const canRedo = useGraphStore((s) => s.canRedo)();
  void historyVersion;

  const pushActivity = useCollabStore((s) => s.pushActivity);
  const activityOpen = useCollabStore((s) => s.activityOpen);
  const setActivityOpen = useCollabStore((s) => s.setActivityOpen);
  const focusCanvasOnly = useFocusStore((s) => s.focusCanvasOnly);

  const [issuesOpen, setIssuesOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [fileAction, setFileAction] = useState<FileAction | null>(null);

  useEffect(() => {
    hydrateFromStorage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Bus de la palette de commandes (⌘K) : ouvre n'importe quel dialogue.
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

  const { errorCount, warningCount } = useMemo(
    () => ({
      errorCount: validationIssues.filter((i) => i.severity === "error").length,
      warningCount: validationIssues.filter((i) => i.severity === "warning").length,
    }),
    [validationIssues],
  );

  const tableNameOf = (tableId: string): string =>
    tables.find((t) => t.id === tableId)?.name ?? tableId;

  const handleNormalize = (): void => {
    const summary = normalizeSchema();
    if (summary.noop) {
      pushToast("Schéma déjà optimal", { type: "success", description: "Rien à normaliser." });
      return;
    }
    const count = countNormalizations(summary);
    pushActivity("normalize", `a appliqué la normalisation (${count} corrections)`);
    pushToast(
      `${count} correction${count === 1 ? "" : "s"} appliquée${count === 1 ? "" : "s"}`,
      { type: "success", description: describeNormalization(summary) },
    );
  };

  const handleAutoLayout = (): void => {
    applyAutoLayout();
    pushActivity("create", `a réorganisé la disposition (${tables.length} tables)`);
    pushToast(
      `${tables.length} table${tables.length === 1 ? "" : "s"} réorganisée${tables.length === 1 ? "" : "s"}`,
      { type: "success", description: "Disposition automatique appliquée." },
    );
  };

  const handleAutoDetect = (): void => {
    const summary = autoDetectRelations();
    if (summary.created === 0) {
      pushToast("Aucune relation orpheline détectée", {
        type: "info",
        description: "Les conventions de nommage n'ont révélé aucune jointure manquante.",
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
      className="sticky top-0 z-40 grid h-14 shrink-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-3 border-b border-border/40 bg-background/80 px-3 backdrop-blur-md sm:px-4"
    >
      {/* ── Zone gauche : logo · projet · compteurs · menu projet ── */}
      <div className="flex min-w-0 items-center gap-1.5">
        <Link
          href="/"
          aria-label="Modelizia — accueil"
          className="flex shrink-0 items-center gap-2 rounded-lg pr-1 outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Database className="size-4" />
          </span>
          <span className="hidden text-base font-semibold tracking-tight xl:inline">
            Modelizia
          </span>
        </Link>

        <Divider />
        <ProjectName />

        <div className="hidden items-center gap-1.5 lg:flex">
          <Badge variant="secondary" className="tabular-nums">
            {tables.length} {plural(tables.length, "table")}
          </Badge>
          <Badge variant="secondary" className="tabular-nums">
            {relations.length} {plural(relations.length, "relation")}
          </Badge>
        </div>

        <Menu.Root>
          <Menu.Trigger
            aria-label="Actions du projet"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 data-popup-open:bg-muted"
          >
            <MoreHorizontal className="size-4" />
          </Menu.Trigger>
          <Menu.Portal>
            <Menu.Positioner side="bottom" align="start" sideOffset={6} className="z-50">
              <Menu.Popup className={menuPopupClass}>
                <Menu.Item className={menuItemClass} onClick={() => setFileAction("import")}>
                  <CloudUpload className="size-4" /> Importer
                </Menu.Item>
                <Menu.Item className={menuItemClass} onClick={() => setFileAction("templates")}>
                  <LayoutTemplate className="size-4" /> Modèles
                </Menu.Item>
                <Menu.Item className={menuItemClass} onClick={() => setFileAction("export")}>
                  <ImageDown className="size-4" /> Exporter
                </Menu.Item>
                <div role="separator" className="my-1 h-px bg-border/60" />
                <Menu.Item
                  className={cn(menuItemClass, "text-destructive data-highlighted:bg-destructive/10")}
                  onClick={() => setFileAction("reset")}
                >
                  <Trash2 className="size-4" /> Effacer
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </div>

      {/* ── Zone centrale : historique · layout · auto-détection · santé ── */}
      <div className="flex items-center justify-center gap-1.5">
        <IconAction label="Annuler" shortcut="mod+z" onClick={undo} disabled={!canUndo}>
          <Undo2 className="size-4" />
        </IconAction>
        <IconAction label="Rétablir" shortcut="mod+shift+z" onClick={redo} disabled={!canRedo}>
          <Redo2 className="size-4" />
        </IconAction>

        <Divider />

        <Tooltip label="Disposition automatique" shortcut="A" side="bottom">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleAutoLayout}
            disabled={tables.length === 0}
            aria-label="Disposition automatique"
            className="text-muted-foreground hover:text-foreground"
          >
            <LayoutGrid className="size-4" />
            <span className="hidden xl:inline">Disposition</span>
          </Button>
        </Tooltip>
        <Tooltip label="Auto-détecter les relations (annulable)" side="bottom">
          <Button
            size="sm"
            variant="ghost"
            onClick={handleAutoDetect}
            disabled={tables.length < 2}
            aria-label="Auto-détecter les relations"
            className="text-muted-foreground hover:text-foreground"
          >
            <Wand2 className="size-4" />
            <span className="hidden xl:inline">Auto-détecter</span>
          </Button>
        </Tooltip>

        <Divider />

        <HealthPill onOpenIssues={() => setIssuesOpen(true)} onNormalize={handleNormalize} />
      </div>

      {/* ── Zone droite : collaboration · code · outils secondaires ── */}
      <div className="flex min-w-0 items-center justify-end gap-2">
        <CollabToolbar />

        <Divider />

        <Button
          size="sm"
          nativeButton={false}
          render={<Link href="/studio/code" />}
          className="shrink-0"
        >
          <Code2 className="size-4" />
          <span className="hidden md:inline">Studio de Code</span>
        </Button>

        <Divider />

        <div className="flex items-center gap-0.5">
          <IconAction
            label="Palette de commandes"
            shortcut="mod+k"
            onClick={() =>
              window.dispatchEvent(
                new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true }),
              )
            }
          >
            <Search className="size-4" />
          </IconAction>
          <IconAction
            label="Focus Graphe — plein écran canvas"
            shortcut="shift+z"
            onClick={toggleCanvasFocus}
            pressed={focusCanvasOnly}
            className={cn("hidden md:inline-flex", focusCanvasOnly && "bg-muted text-foreground")}
          >
            <Frame className="size-4" />
          </IconAction>
          <IconAction
            label="Raccourcis clavier"
            shortcut="?"
            onClick={() => setShortcutsOpen(true)}
            className="hidden lg:inline-flex"
          >
            <Keyboard className="size-4" />
          </IconAction>
          <IconAction
            label="Journal d'activité"
            onClick={() => setActivityOpen(true)}
            pressed={activityOpen}
            exportHidden
            className={cn(activityOpen && "bg-muted text-foreground")}
          >
            <Activity className="size-4" />
          </IconAction>
        </div>
      </div>

      {/* ── Dialogues contrôlés ── */}
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
              <li className="rounded-lg border border-border/60 p-3 text-xs text-muted-foreground">
                Le graphe est sain. Aucune erreur ni avertissement.
              </li>
            )}
            {validationIssues.map((issue) => (
              <li key={issue.id} className="rounded-lg border border-border/60 p-3">
                <div className="flex items-center gap-2">
                  {issue.severity === "error" ? (
                    <OctagonAlert className="size-4 shrink-0 text-destructive" />
                  ) : (
                    <AlertTriangle className="size-4 shrink-0 text-amber-500" />
                  )}
                  <Badge variant={issue.severity === "error" ? "destructive" : "secondary"}>
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

      <ShortcutsDialog open={shortcutsOpen} onOpenChange={setShortcutsOpen} />
    </header>
  );
}
