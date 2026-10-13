export const lowerFirst = (value: string): string =>
  value.length === 0 ? value : value.charAt(0).toLowerCase() + value.slice(1);

export const upperFirst = (value: string): string =>
  value.length === 0 ? value : value.charAt(0).toUpperCase() + value.slice(1);

/** Prisma-safe identifier (MVP): trims, keeps [A-Za-z0-9_], prefixes digits. */
export const sanitizeIdentifier = (value: string): string => {
  const cleaned = value.trim().replace(/[^A-Za-z0-9_]/g, "_") || "Untitled";
  return /^[0-9]/.test(cleaned) ? `_${cleaned}` : cleaned;
};
