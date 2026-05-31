// API config
// - Development: use local/non-SSL backend if needed
// - Production: MUST use HTTPS API endpoint (no mixed content)

import { isCdnHostedUrl, resolveMediaUrl } from "./media-url";

const RAILWAY_API_URL = "https://viswam-lms-backend-production.up.railway.app";

const DEV_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";
const PROD_URL =
  import.meta.env.VITE_API_URL_PROD || import.meta.env.VITE_API_URL || RAILWAY_API_URL;

export const API_BASE_URL =
  import.meta.env.MODE === "production" ? PROD_URL : DEV_URL;

/** PDFs on our hosts can load in an iframe without the student proxy. */
export function isOurBackendPdfUrl(url: string): boolean {
  if (isCdnHostedUrl(url)) return false;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname;
    const apiHost = (() => {
      try {
        return new URL(API_BASE_URL).hostname;
      } catch {
        return "";
      }
    })();
    return (
      host === apiHost ||
      host === "localhost" ||
      host === "127.0.0.1"
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

