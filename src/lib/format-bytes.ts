/** Human-readable file size (bytes → KB / MB / GB). */
export function formatFileSize(bytes?: number | null, emptyLabel = "Unknown"): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes <= 0) return emptyLabel;
  const units = ["B", "KB", "MB", "GB", "TB"];
  let i = 0;
  let n = bytes;
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024;
    i += 1;
  }
  const digits = i === 0 ? 0 : n >= 100 ? 0 : 1;
  return `${n.toFixed(digits)} ${units[i]}`;
}
