/** Internal default when the API requires a section field (one class per grade). */
export const DEFAULT_CLASS_SECTION = "A";

/** Display label for a school class (no section suffix). */
export function formatClassLabel(classNumber: string | number, _section?: string): string {
  const n = String(classNumber ?? "")
    .trim()
    .replace(/^class\s+/i, "")
    .replace(/[^0-9-]/g, "");
  const digits = n.replace(/\D/g, "") || n;
  if (!digits) return "Class";
  return `Class ${digits}`;
}

/** Card/list title — never show stored section suffixes like "Class 1-A". */
export function getClassDisplayTitle(classNumber: string | number, storedName?: string): string {
  const fromNumber = formatClassLabel(classNumber);
  const raw = String(storedName || "").trim();
  if (!raw) return fromNumber;
  if (/^class\s+\d+/i.test(raw) && /[-][A-Za-z]\s*$/i.test(raw)) {
    return fromNumber;
  }
  if (/^class\s+\d+[-][A-Za-z]+$/i.test(raw.replace(/\s/g, ""))) {
    return fromNumber;
  }
  return fromNumber;
}
