// API config
// - Development: use local/non-SSL backend if needed
// - Production: MUST use HTTPS API endpoint (no mixed content)

import { isCdnHostedUrl, resolveMediaUrl } from "./media-url";

/**
 * Production on Vercel: same-origin `/api` (vercel.json → DigitalOcean).
 * HTTP API URLs in env are ignored in production to prevent mixed-content blocks.
 */
const PRODUCTION_API_PROXY = "";
const PRODUCTION_ABACUS_PROXY = "/abacus-api";

function resolveProductionApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL_PROD?.trim() ?? "";
  if (fromEnv.startsWith("https://")) return fromEnv.replace(/\/$/, "");
  return PRODUCTION_API_PROXY;
}

function resolveProductionAbacusBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_ABACUS_API_URL_PROD?.trim() ?? "";
  if (fromEnv.startsWith("https://")) return fromEnv.replace(/\/$/, "");
  if (fromEnv.startsWith("http://")) return PRODUCTION_ABACUS_PROXY;
  return PRODUCTION_ABACUS_PROXY;
}

const DEV_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const API_BASE_URL =
  import.meta.env.MODE === "production"
    ? resolveProductionApiBaseUrl()
    : DEV_URL.replace(/\/$/, "");

/**
 * Origin for /uploads/... files (DigitalOcean). API calls may use '' (Vercel /api proxy).
 */
export const MEDIA_BASE_URL =
  import.meta.env.VITE_MEDIA_BASE_URL?.trim().replace(/\/$/, "") ||
  DEV_URL.replace(/\/$/, "") ||
  "http://206.189.179.75:5000";

/** Standalone Abacus API (port 5001 locally). Same DB, separate server. */
export const ABACUS_API_BASE_URL =
  import.meta.env.MODE === "production"
    ? resolveProductionAbacusBaseUrl()
    : (import.meta.env.VITE_ABACUS_API_URL || "http://localhost:5001").replace(
        /\/$/,
        "",
      );

/** PDFs on our hosts can load in an iframe without the student proxy. */
export function isOurBackendPdfUrl(url: string): boolean {
  if (isCdnHostedUrl(url)) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    const mediaHost = (() => {
      try {
        return new URL(MEDIA_BASE_URL).hostname;
      } catch {
        return "";
      }
    })();
    const apiHost = (() => {
      try {
        return API_BASE_URL ? new URL(API_BASE_URL).hostname : "";
      } catch {
        return "";
      }
    })();
    return (
      host === mediaHost ||
      host === apiHost ||
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "206.189.179.75"
    );
  } catch {
    return true;
  }
}

/** Domains known to block datacenter IPs — serve directly to browser */
const DIRECT_FETCH_DOMAINS = [
  "ncert.nic.in",
  "ncertbooks.prashanthellina.com",
];

export function shouldFetchDirectly(url: string): boolean {
  try {
    const host = new URL(url).hostname;
    return DIRECT_FETCH_DOMAINS.some((d) => host === d || host.endsWith("." + d));
  } catch {
    return false;
  }
}

const PDF_IFRAME_CHROMELESS_HASH = "toolbar=0&navpanes=0&scrollbar=1&view=FitH";

/** Hide browser PDF viewer toolbar (download / print / menu) where supported. */
export function appendPdfViewerChromelessHash(src: string): string {
  if (!src) return "";
  const lower = src.toLowerCase();
  if (
    lower.includes("youtube.com") ||
    lower.includes("youtu.be") ||
    lower.includes("vimeo.com")
  ) {
    return src;
  }

  try {
    const url = new URL(src);
    const existing = url.hash ? url.hash.replace(/^#/, "") : "";
    const parts = existing
      ? existing.split("&").filter((p) => p && !p.startsWith("toolbar=") && !p.startsWith("navpanes="))
      : [];
    parts.push(...PDF_IFRAME_CHROMELESS_HASH.split("&"));
    url.hash = parts.join("&");
    return url.toString();
  } catch {
    if (src.includes("#")) {
      return `${src}&${PDF_IFRAME_CHROMELESS_HASH}`;
    }
    return `${src}#${PDF_IFRAME_CHROMELESS_HASH}`;
  }
}

/** Absolute URL for a stored content file path or full URL (Cloudflare CDN when configured). */
export function normalizeContentFileUrl(fileUrl: string): string {
  return resolveMediaUrl(fileUrl);
}

/**
 * PDF bytes via API proxy + JWT query (iframe and PDF.js).
 * Use on digital boards where embedded browser PDF plugins fail.
 */
export function getPdfContentPreviewProxyUrl(fileUrl: string, title?: string): string {
  const absolute = normalizeContentFileUrl(fileUrl);
  if (!absolute) return "";
  if (shouldFetchDirectly(absolute)) return absolute;

  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("authToken") || ""
      : "";
  return (
    `${API_BASE_URL}/api/student/content-preview` +
    `?url=${encodeURIComponent(absolute)}` +
    `&filename=${encodeURIComponent(title || "preview.pdf")}` +
    `&token=${encodeURIComponent(token)}`
  );
}

function resolvePdfPreviewBaseUrl(fileUrl: string, title?: string): string {
  const absolute = normalizeContentFileUrl(fileUrl);
  if (!absolute) return "";

  if (shouldFetchDirectly(absolute)) {
    return absolute;
  }

  if (isOurBackendPdfUrl(absolute)) {
    return absolute;
  }

  return getPdfContentPreviewProxyUrl(fileUrl, title);
}

/**
 * `src` for student PDF iframes. External URLs use `/content-preview` with `token` in the query
 * because the browser cannot send `Authorization` on iframe navigations.
 */
export function getStudentPdfPreviewIframeSrc(
  fileUrl: string,
  title?: string
): string {
  const base = resolvePdfPreviewBaseUrl(fileUrl, title);
  return appendPdfViewerChromelessHash(base);
}

/** PDF iframe src for any role (super-admin subject content, dashboard, etc.). */
export function getEmbeddedPdfIframeSrc(fileUrl: string, title?: string): string {
  return getStudentPdfPreviewIframeSrc(fileUrl, title);
}

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = endpoint.startsWith("http")
    ? endpoint
    : `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`;

  const token = localStorage.getItem("authToken");

  const headers = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...(options.headers || {})
  };

  return fetch(url, {
    ...options,
    headers
  });
};

export default API_BASE_URL;

