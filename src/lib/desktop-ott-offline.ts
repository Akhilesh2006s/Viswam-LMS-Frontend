export type DesktopOfflineOttFile = {
  contentId: string;
  localPath: string;
  title: string;
  bytes: number;
  downloadedAt: string;
};

export type OttDownloadProgress = {
  contentId: string;
  received: number;
  total: number;
  percent: number;
};

declare global {
  interface Window {
    viswamDesktop?: {
      isDesktopApp?: boolean;
      ottOffline?: {
        list: (scope?: string) => Promise<DesktopOfflineOttFile[]>;
        get: (scope: string, contentId: string) => Promise<DesktopOfflineOttFile | null>;
        download: (
          scope: string,
          contentId: string,
          remoteUrl: string,
          title: string,
          authToken: string,
        ) => Promise<DesktopOfflineOttFile>;
        getPlaybackUrl: (scope: string, contentId: string) => Promise<string | null>;
        getStorageStats: (scope?: string) => Promise<{ count: number; bytes: number }>;
        onProgress: (callback: (data: OttDownloadProgress) => void) => () => void;
      };
    };
  }
}

const SCOPE = 'teacher';

export function isDesktopOttAvailable(): boolean {
  return Boolean(
    typeof window !== 'undefined' && window.viswamDesktop?.isDesktopApp && window.viswamDesktop?.ottOffline,
  );
}

export async function listDesktopOfflineOtt(): Promise<DesktopOfflineOttFile[]> {
  if (!isDesktopOttAvailable()) return [];
  return window.viswamDesktop!.ottOffline!.list(SCOPE);
}

export async function getDesktopOfflineOtt(contentId: string): Promise<DesktopOfflineOttFile | null> {
  if (!isDesktopOttAvailable()) return null;
  return window.viswamDesktop!.ottOffline!.get(SCOPE, contentId);
}

export async function downloadDesktopOfflineOtt(
  contentId: string,
  remoteUrl: string,
  title: string,
): Promise<DesktopOfflineOttFile> {
  const token = localStorage.getItem('authToken') || '';
  return window.viswamDesktop!.ottOffline!.download(SCOPE, contentId, remoteUrl, title, token);
}

export async function getDesktopOttPlaybackUrl(contentId: string): Promise<string | null> {
  if (!isDesktopOttAvailable()) return null;
  return window.viswamDesktop!.ottOffline!.getPlaybackUrl(SCOPE, contentId);
}

export async function getDesktopOttStorageStats(): Promise<{ count: number; bytes: number }> {
  if (!isDesktopOttAvailable()) return { count: 0, bytes: 0 };
  return window.viswamDesktop!.ottOffline!.getStorageStats(SCOPE);
}

export async function refreshDesktopOfflineOtt(): Promise<DesktopOfflineOttFile[]> {
  return listDesktopOfflineOtt();
}

export function subscribeDesktopOttProgress(
  callback: (data: OttDownloadProgress) => void,
): () => void {
  if (!isDesktopOttAvailable()) return () => {};
  return window.viswamDesktop!.ottOffline!.onProgress(callback);
}
