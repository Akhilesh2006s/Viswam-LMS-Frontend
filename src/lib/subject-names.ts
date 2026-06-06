/** Parse Super Admin style subject keys, e.g. Chemistry_10 → class "10", plain "Chemistry". */

export function extractClassNumberFromSubjectName(name: string): string | null {
  const base = String(name || '').split('__deleted__')[0].trim();
  const match = base.match(/_(\d+)$/);
  return match ? match[1] : null;
}

/** True when subject was soft-deleted in Super Admin (name contains __deleted__). */
export function isSoftDeletedSubjectName(name: string): boolean {
  return String(name || '').includes('__deleted__');
}

export function extractPlainSubjectName(name: string): string {
  const base = String(name || '').split('__deleted__')[0].trim();
  const match = base.match(/^(.+?)_\d+$/);
  return match ? match[1] : base;
}

/** Human-readable label for teacher cards, class rows, etc. (BIO → Biology, Biology_7 → Biology). */
export function formatSubjectDisplayLabel(name: string): string {
  const raw = (name || '').trim();
  if (!raw) return '';
  const plain = extractPlainSubjectName(raw).trim();
  const lower = plain.toLowerCase();
  const classNum = extractClassNumberFromSubjectName(raw);

  if (lower === 'bio' || lower === 'biology') {
    return classNum ? `Biology (Class ${classNum})` : 'Biology';
  }

  if (classNum && plain) {
    const titled = plain.charAt(0).toUpperCase() + plain.slice(1);
    return `${titled} (Class ${classNum})`;
  }

  return plain;
}

export function normalizeSubjectDisplayKey(name: string): string {
  const plain = extractPlainSubjectName(name || '').trim().toLowerCase();
  if (plain === 'bio' || plain === 'biology') return 'biology';
  if (plain === 'math' || plain === 'maths' || plain === 'mat' || plain === 'mathematics') {
    return 'math';
  }
  return plain;
}

/** Stable key for deduping catalog rows (e.g. Biology_8). */
export function subjectPickerNameKey(name: string): string {
  return String(name || '').split('__deleted__')[0].trim().toLowerCase();
}

/** Uniq key for pickers: plain subject + class when name has _N suffix (Biology_8 → biology::8). */
export function subjectPickerUniqKey(name: string, code?: string): string {
  const raw = String(name || code || '')
    .split('__deleted__')[0]
    .trim();
  if (!raw) return '';
  const classNum = extractClassNumberFromSubjectName(raw);
  const plain = extractPlainSubjectName(raw).toLowerCase();
  if (classNum) return `${plain}::${classNum}`;
  return subjectPickerNameKey(raw);
}

function normalizeSubjectRecordId(id: string): string {
  const s = String(id || '').trim();
  if (/^[a-f0-9]{24}$/i.test(s)) return s.toLowerCase();
  return s;
}

/**
 * One row per Mongo id, then one row per catalog name/class (fixes duplicate Biology_8 in pickers).
 */
export function dedupeSubjectsForPicker<
  T extends { id?: string; _id?: string; name?: string; code?: string },
>(subjects: T[]): T[] {
  const byId = new Map<string, T>();
  for (const row of subjects) {
    const id = normalizeSubjectRecordId(String(row.id || row._id || ''));
    if (!id || byId.has(id)) continue;
    byId.set(id, row);
  }
  const byUniq = new Map<string, T>();
  for (const row of byId.values()) {
    const uniq = subjectPickerUniqKey(row.name || '', row.code);
    if (!uniq) {
      const id = normalizeSubjectRecordId(String(row.id || row._id || ''));
      if (id && !byUniq.has(id)) byUniq.set(id, row);
      continue;
    }
    if (!byUniq.has(uniq)) byUniq.set(uniq, row);
  }
  return [...byUniq.values()].sort((a, b) =>
    String(a.name || '').localeCompare(String(b.name || '')),
  );
}

/** Active catalog row (not soft-deleted / inactive). */
export function isActiveCatalogSubject(subject: {
  name?: string;
  isActive?: boolean;
}): boolean {
  if (subject.isActive === false) return false;
  if (isSoftDeletedSubjectName(subject.name || '')) return false;
  return true;
}

export function getSubjectClassLabel(subject: {
  name?: string;
  classNumber?: string;
}): string | null {
  if (subject.classNumber != null && String(subject.classNumber).trim() !== '') {
    return String(subject.classNumber).trim();
  }
  return extractClassNumberFromSubjectName(subject.name || '');
}

/** When Subject has no classNumber / _N suffix, use class from linked prep content (common for 11–12). */
export function inferClassNumberFromPrepContent(
  items: Array<{ classNumber?: string }> | undefined
): string | null {
  if (!items || !Array.isArray(items)) return null;
  for (const item of items) {
    const cn =
      item?.classNumber != null && String(item.classNumber).trim() !== ''
        ? String(item.classNumber).trim()
        : null;
    if (cn) return cn;
  }
  return null;
}

/** Admin Learning Paths: subject row may only have class on Content documents (e.g. Class 11 Chemistry). */
export function getLearningPathClassLabel(subject: {
  name?: string;
  classNumber?: string;
  asliPrepContent?: Array<{ classNumber?: string }>;
}): string | null {
  const fromSubject = getSubjectClassLabel(subject);
  if (fromSubject) return fromSubject;
  return inferClassNumberFromPrepContent(subject.asliPrepContent);
}
