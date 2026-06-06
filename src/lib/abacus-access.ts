/** Label for assigned ceiling (max category + level). */
export function formatAbacusCeilingLabel(category: string, level: string): string {
  if (!category && !level) return '—';
  if (!level) return category;
  return `${category} · ${level}`;
}

/** Full unlocked access from API accessSummary, with ceiling fallback. */
export function formatAbacusAccessDisplay(
  accessSummary?: string,
  category?: string,
  level?: string,
): string {
  if (accessSummary?.trim()) return accessSummary.trim();
  return formatAbacusCeilingLabel(category || '', level || '');
}
