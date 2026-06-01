import { API_BASE_URL, MEDIA_BASE_URL } from "@/lib/api-config";

const CDN_BASE =
  import.meta.env.VITE_CDN_BASE_URL ||
  import.meta.env.VITE_CDN_PUBLIC_BASE_URL ||
  "";

const CDN_HOST_ALLOWLIST = (import.meta.env.VITE_CDN_HOST_ALLOWLIST || "")
  .split(",")
  .map((h: string) => h.trim().toLowerCase())
  .filter(Boolean);

const DEFAULT_CDN_HOST_PATTERNS = [
  "cloudflare.com",
  "cloudflarestorage.com",
  "r2.dev",
  "r2.cloudflarestorage.com",
];

export function isAbsoluteMediaUrl(url: string): boolean {
  const t = url.trim();
  return t.startsWith("http://") || t.startsWith("https://") || t.startsWith("//");
}

export function isCdnHostedUrl(url: string): boolean {
  if (!isAbsoluteMediaUrl(url)) return false;
  try {
    const host = new URL(url.startsWith("//") ? `https:${url}` : url).hostname.toLowerCase();
    if (CDN_HOST_ALLOWLIST.some((h) => host === h || host.endsWith(`.${h}`))) return true;
    return DEFAULT_CDN_HOST_PATTERNS.some((p) => host === p || host.endsWith(`.${p}`));
  } catch {
    return false;
  }
}

/**
 * Resolve media for playback/thumbnails.
 * - Full Cloudflare CDN URLs are kept as-is.
 * - /uploads/... uses VITE_CDN_BASE_URL when set, else API origin.
 */
export function resolveMediaUrl(url?: string | null): string {
  if (!url?.trim()) return "";
  const raw = url.trim();
  if (raw.startsWith("//")) return `https:${raw}`;
  if (isAbsoluteMediaUrl(raw)) return raw;

  const cdn = CDN_BASE.replace(/\/+$/, "");
  if (cdn && raw.startsWith("/uploads/")) {
    return `${cdn}${raw}`;
  }
  const fileOrigin = (MEDIA_BASE_URL || API_BASE_URL || "").replace(/\/$/, "");
  if (raw.startsWith("/")) return `${fileOrigin}${raw}`;
  return `${fileOrigin}/${raw}`;
}
