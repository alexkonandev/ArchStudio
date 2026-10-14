import type { Relation, Table, ValidationIssue } from "@/types";

/**
 * Gamified schema health scoring.
 *
 * Pure & deterministic: the same graph always yields the same score and rank,
 * so it is safe to derive inside a memoised Zustand selector without polluting
 * the persisted store.
 *
 * Scoring model
 * -------------
 * - Start from a perfect 100.
 * - Subtract a heavy penalty per validation *error* and a lighter one per
 *   *warning* (e.g. a table without a primary key, an incoherent FK/PK type).
 * - When the schema has **no errors**, grant a small normalisation bonus that
 *   rewards structural quality (every table PK'd, FK/PK types coherent, unique
 *   non-PK fields indexed). The bonus never pushes the score above 100.
 *
 * The result is clamped to `[0, 100]`.
 */

/** Points removed for each validation error. */
const ERROR_PENALTY = 15;
/** Points removed for each validation warning. */
const WARNING_PENALTY = 8;
/** Maximum additive bonus once the schema is error-free. */
const NORMALIZATION_BONUS_MAX = 8;

export interface HealthRank {
  /** Stable identifier. */
  id: "apprenti" | "junior" | "senior" | "maitre";
  /** Human-facing (French) label shown on the badge. */
  label: string;
  /** Inclusive lower bound for this rank. */
  minScore: number;
}

/** Ranks, ordered from the highest to the lowest. */
export const HEALTH_RANKS: readonly HealthRank[] = [
  { id: "maitre", label: "Maître des BDD", minScore: 90 },
  { id: "senior", label: "Architecte Senior", minScore: 75 },
  { id: "junior", label: "Architecte Junior", minScore: 50 },
  { id: "apprenti", label: "Apprenti Modélisateur", minScore: 0 },
] as const;

export interface HealthScoreResult {
  /** Normalised score in `[0, 100]`. */
  score: number;
  /** Rank derived from {@link score}. */
  rank: HealthRank;
  /** Number of validation errors that fed the score. */
  errorCount: number;
  /** Number of validation warnings that fed the score. */
  warningCount: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** Resolve the rank for a given score (first matching band wins). */
export function rankForScore(score: number): HealthRank {
  return HEALTH_RANKS.find((rank) => score >= rank.minScore) ?? HEALTH_RANKS[HEALTH_RANKS.length - 1];
}

/**
 * Normalisation bonus (0..{@link NORMALIZATION_BONUS_MAX}) rewarding a
 * well-structured schema. Only meaningful once the schema is error-free.
 */
function normalizationBonus(tables: Table[], relations: Relation[]): number {
  if (tables.length === 0) return 0;

  // Every table has a primary key. (+2)
  const allTablesHavePk = tables.every((table) =>
    table.fields.some((field) => field.isPrimaryKey),
  );

  // At least one relation is modelled. (+2)
  const hasRelations = relations.length > 0;

  // Every unique, non-primary-key field is covered by a unique index. (+4)
  const uniqueFieldsIndexed = tables.every((table) => {
    const indexedIds = new Set(
      (table.indexes ?? []).flatMap((index) => index.fieldIds),
    );
    return table.fields.every(
      (field) => !field.isUnique || field.isPrimaryKey || indexedIds.has(field.id),
    );
  });

  let bonus = 0;
  if (allTablesHavePk) bonus += 2;
  if (hasRelations) bonus += 2;
  if (uniqueFieldsIndexed) bonus += 4;

  return Math.min(NORMALIZATION_BONUS_MAX, bonus);
}

/**
 * Compute the gamified health score for a graph snapshot.
 *
 * @param tables   Current tables.
 * @param relations Current relations.
 * @param issues   Validation issues produced by `validateGraph`.
 */
export function computeHealthScore(
  tables: Table[],
  relations: Relation[],
  issues: ValidationIssue[],
): HealthScoreResult {
  let errorCount = 0;
  let warningCount = 0;
  for (const issue of issues) {
    if (issue.severity === "error") errorCount += 1;
    else warningCount += 1;
  }

  const penalty = errorCount * ERROR_PENALTY + warningCount * WARNING_PENALTY;
  // The normalisation bonus only rewards an otherwise-clean schema.
  const bonus = errorCount === 0 ? normalizationBonus(tables, relations) : 0;

  const score = clamp(Math.round(100 - penalty + bonus), 0, 100);

  return {
    score,
    rank: rankForScore(score),
    errorCount,
    warningCount,
  };
}
