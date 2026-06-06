import type { SuperAdminView } from "@/lib/super-admin-views";

const RESTORE_VIEW_KEY = "superAdminRestoreView";

const RESTORABLE_VIEWS: SuperAdminView[] = [
  "dashboard",
  "admins",
  "products",
  "subjects-and-content",
  "subjects",
  "viswam-ott",
  "calendar",
  "periods",
  "abacus",
  "analytics",
  "student-analytics",
  "subscriptions",
  "settings",
];

export function isRestorableSuperAdminView(view: string): view is SuperAdminView {
  return RESTORABLE_VIEWS.includes(view as SuperAdminView);
}

export function queueSuperAdminViewRestore(view: SuperAdminView) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(RESTORE_VIEW_KEY, view);
}

/** Mobile WebView sets `?sa_view=` — highest priority (avoids stale sessionStorage). */
export function parseSuperAdminViewFromQuery(): SuperAdminView | null {
  if (typeof window === "undefined") return null;
  const params = new URLSearchParams(window.location.search);
  const raw = params.get("sa_view");
  if (!raw) return null;
  const view = decodeURIComponent(raw) as SuperAdminView;
  return RESTORABLE_VIEWS.includes(view) ? view : null;
}

export function parseSuperAdminViewFromHash(): SuperAdminView | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "");
  const match = /^view=([^&]+)/.exec(hash);
  if (!match?.[1]) return null;
  const view = decodeURIComponent(match[1]) as SuperAdminView;
  return RESTORABLE_VIEWS.includes(view) ? view : null;
}

export function consumeSuperAdminViewRestore(): SuperAdminView | null {
  if (typeof window === "undefined") return null;
  const fromQuery = parseSuperAdminViewFromQuery();
  if (fromQuery) return fromQuery;
  const fromHash = parseSuperAdminViewFromHash();
  if (fromHash) return fromHash;
  const raw = sessionStorage.getItem(RESTORE_VIEW_KEY);
  sessionStorage.removeItem(RESTORE_VIEW_KEY);
  if (!raw) return null;
  return RESTORABLE_VIEWS.includes(raw as SuperAdminView) ? (raw as SuperAdminView) : null;
}

/** Strip query string after restore; keep hash for mobile deep links. */
export function clearSuperAdminDashboardQueryFromUrl() {
  if (typeof window === "undefined") return;
  const path = window.location.pathname;
  if (path !== "/super-admin/dashboard" && !path.endsWith("/super-admin/dashboard")) return;
  if (!window.location.search) return;
  const hash = window.location.hash || "";
  window.history.replaceState({}, "", `${path}${hash}`);
}
