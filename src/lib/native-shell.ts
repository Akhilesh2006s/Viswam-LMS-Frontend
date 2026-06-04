/** Set by VISWAM mobile app WebView before content loads. */
export const VISWAM_NATIVE_SHELL_KEY = 'viswamNativeShell';

export function isViswamNativeShell(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (localStorage.getItem(VISWAM_NATIVE_SHELL_KEY) === '1') return true;
  } catch {
    /* ignore */
  }
  return !!(window as Window & { ReactNativeWebView?: unknown }).ReactNativeWebView;
}

export function applyViswamNativeShellClass(): void {
  if (typeof document === 'undefined') return;
  if (isViswamNativeShell()) {
    document.documentElement.classList.add('viswam-native-shell');
  }
}
