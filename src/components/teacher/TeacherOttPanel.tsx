import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Download,
  HardDrive,
  Loader2,
  Monitor,
  Play,
  Search,
  Tv,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { OttMonthlyQuotaCard } from "@/components/ott/OttMonthlyQuotaCard";
import { OttOfflinePlayerModal } from "@/components/ott/OttOfflinePlayerModal";
import { formatFileSize } from "@/lib/format-bytes";
import { API_BASE_URL } from "@/lib/api-config";
import {
  confirmTeacherOttDownload,
  fetchDesktopAppInfo,
  fetchTeacherOttCatalog,
  fetchTeacherOttDownloads,
  fetchTeacherOttQuota,
  formatOttBytes,
  requestTeacherOttDownload,
  type DesktopAppInfo,
  type SchoolOttQuota,
  type TeacherOttDownload,
  type TeacherOttVideo,
} from "@/lib/ott/quota-api";
import {
  downloadDesktopOfflineOtt,
  getDesktopOttPlaybackUrl,
  getDesktopOttStorageStats,
  isDesktopOttAvailable,
  listDesktopOfflineOtt,
  refreshDesktopOfflineOtt,
  subscribeDesktopOttProgress,
  type DesktopOfflineOttFile,
} from "@/lib/desktop-ott-offline";
import { useToast } from "@/hooks/use-toast";

type Tab = "browse" | "library";

function resolveDownloadHref(url: string): string {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("//")) return `https:${url}`;
  const base =
    API_BASE_URL ||
    (typeof window !== "undefined" ? window.location.origin.replace(/\/$/, "") : "") ||
    "http://206.189.179.75:5000";
  return url.startsWith("/") ? `${base}${url}` : `${base}/${url}`;
}

export function TeacherOttPanel() {
  const { toast } = useToast();
  const desktopApp = isDesktopOttAvailable();
  const [tab, setTab] = useState<Tab>("browse");
  const [loading, setLoading] = useState(true);
  const [quota, setQuota] = useState<SchoolOttQuota | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(true);
  const [videos, setVideos] = useState<TeacherOttVideo[]>([]);
  const [downloads, setDownloads] = useState<TeacherOttDownload[]>([]);
  const [localFiles, setLocalFiles] = useState<DesktopOfflineOttFile[]>([]);
  const [desktopInstaller, setDesktopInstaller] = useState<DesktopAppInfo | null>(null);
  const [search, setSearch] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<Record<string, number>>({});
  const [player, setPlayer] = useState<{ title: string; url: string } | null>(null);
  const [appStorage, setAppStorage] = useState({ count: 0, bytes: 0 });

  const refreshAppStorage = useCallback(async () => {
    if (!desktopApp) return;
    const [local, stats] = await Promise.all([
      refreshDesktopOfflineOtt(),
      getDesktopOttStorageStats(),
    ]);
    setLocalFiles(local);
    setAppStorage(stats);
  }, [desktopApp]);

  const downloadedIds = useMemo(
    () => new Set(downloads.map((d) => String(d.contentId))),
    [downloads],
  );

  const localIds = useMemo(
    () => new Set(localFiles.map((f) => String(f.contentId))),
    [localFiles],
  );

  const loadAll = useCallback(async () => {
    setLoading(true);
    setQuotaLoading(true);
    const [q, catalog, saved, desktop, local] = await Promise.all([
      fetchTeacherOttQuota(),
      fetchTeacherOttCatalog(),
      fetchTeacherOttDownloads(),
      desktopApp ? Promise.resolve(null) : fetchDesktopAppInfo(),
      desktopApp ? listDesktopOfflineOtt() : Promise.resolve([]),
    ]);
    setQuota(q);
    setVideos(catalog);
    setDownloads(saved);
    setDesktopInstaller(desktop);
    setLocalFiles(local);
    if (desktopApp) {
      const stats = await getDesktopOttStorageStats();
      setAppStorage(stats);
    }
    setQuotaLoading(false);
    setLoading(false);
  }, [desktopApp]);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  useEffect(() => {
    if (!desktopApp) return;
    return subscribeDesktopOttProgress(({ contentId, percent }) => {
      setDownloadProgress((prev) => ({ ...prev, [contentId]: percent }));
    });
  }, [desktopApp]);

  useEffect(() => {
    if (tab === "library" && desktopApp) {
      void refreshAppStorage();
    }
  }, [tab, desktopApp, refreshAppStorage]);

  const filteredBrowse = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return videos;
    return videos.filter(
      (v) =>
        v.title?.toLowerCase().includes(term) ||
        v.subjectName?.toLowerCase().includes(term) ||
        String(v.classNumber || "").includes(term),
    );
  }, [videos, search]);

  const filteredLibrary = useMemo(() => {
    const term = search.trim().toLowerCase();
    const rows = localFiles;
    if (!term) return rows;
    return rows.filter((r) => r.title?.toLowerCase().includes(term));
  }, [localFiles, search]);

  const playLocal = useCallback(
    async (contentId: string, title: string) => {
      if (!desktopApp) return;
      const url = await getDesktopOttPlaybackUrl(contentId);
      if (!url) {
        toast({
          title: "File not found on this device",
          description: 'Tap "Save & watch" to store the video in this app.',
          variant: "destructive",
        });
        return;
      }
      setPlayer({ title, url });
    },
    [desktopApp, toast],
  );

  const saveVideoToApp = useCallback(
    async (video: TeacherOttVideo, autoPlay = true) => {
      setDownloadingId(video._id);
      try {
        const req = await requestTeacherOttDownload(video._id);
        if (!req.ok || !req.data?.downloadUrl) {
          toast({
            title: "Cannot save video",
            description: req.message || "Download URL unavailable",
            variant: "destructive",
          });
          return false;
        }

        const bytes = req.data.bytes || video.size || 0;
        const href = resolveDownloadHref(req.data.downloadUrl);
        setDownloadProgress((prev) => ({ ...prev, [video._id]: 0 }));
        await downloadDesktopOfflineOtt(video._id, href, video.title || "Video");

        if (!req.data.alreadyDownloaded) {
          const confirm = await confirmTeacherOttDownload(video._id, bytes);
          if (confirm.quota) setQuota(confirm.quota);
        }

        await refreshAppStorage();
        const saved = await fetchTeacherOttDownloads();
        setDownloads(saved);
        const q = await fetchTeacherOttQuota();
        setQuota(q);
        setTab("library");

        if (autoPlay) {
          await playLocal(video._id, video.title || "Video");
        }
        toast({
          title: "Saved in app",
          description: `${formatFileSize(bytes)} stored on this device for offline viewing.`,
        });
        return true;
      } catch (err) {
        toast({
          title: "Save failed",
          description: err instanceof Error ? err.message : "Try again on Wi‑Fi",
          variant: "destructive",
        });
        return false;
      } finally {
        setDownloadingId(null);
        setDownloadProgress((prev) => {
          const next = { ...prev };
          delete next[video._id];
          return next;
        });
      }
    },
    [playLocal, refreshAppStorage, toast],
  );

  const handleVideoDownload = async (video: TeacherOttVideo) => {
    if (quota?.downloadsEnabled === false) {
      toast({
        title: "Downloads disabled",
        description: "Your school admin has disabled OTT downloads. Contact super admin.",
        variant: "destructive",
      });
      return;
    }
    if (quota && quota.canDownloadMore === false && !downloadedIds.has(video._id)) {
      toast({
        title: "Quota exceeded",
        description: `Your monthly limit of ${quota.schoolMonthlyDownloadGB} GB is used. Try again next month.`,
        variant: "destructive",
      });
      return;
    }

    if (desktopApp) {
      if (localIds.has(video._id)) {
        await playLocal(video._id, video.title || "Video");
        return;
      }
      await saveVideoToApp(video, true);
      return;
    }

    setDownloadingId(video._id);
    try {
      const req = await requestTeacherOttDownload(video._id);
      if (!req.ok || !req.data?.downloadUrl) {
        toast({
          title: "Download blocked",
          description: req.message || "Could not start download",
          variant: "destructive",
        });
        return;
      }

      const bytes = req.data.bytes || video.size || 0;
      const href = resolveDownloadHref(req.data.downloadUrl);
      const anchor = document.createElement("a");
      anchor.href = href;
      anchor.download = `${video.title || "video"}.mp4`;
      anchor.rel = "noopener";
      anchor.target = "_blank";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);

      if (!req.data.alreadyDownloaded) {
        const confirm = await confirmTeacherOttDownload(video._id, bytes);
        if (confirm.quota) setQuota(confirm.quota);
      }
      toast({
        title: req.data.alreadyDownloaded ? "Already downloaded" : "Download started",
        description: `${video.title} · ${formatFileSize(bytes)} counted toward your monthly quota`,
      });

      const saved = await fetchTeacherOttDownloads();
      setDownloads(saved);
      const q = await fetchTeacherOttQuota();
      setQuota(q);
    } catch (err) {
      toast({
        title: "Download failed",
        description: err instanceof Error ? err.message : "Try again on Wi‑Fi",
        variant: "destructive",
      });
    } finally {
      setDownloadingId(null);
    }
  };

  const desktopHref = desktopInstaller?.downloadUrl
    ? resolveDownloadHref(desktopInstaller.downloadUrl)
    : "";

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-600">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-600" />
        Loading Viswam OTT…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-[#0f172a] to-[#1A3557] p-5 text-white">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10">
              <Tv className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Viswam OTT</h2>
              <p className="text-sm text-white/80 max-w-xl">
                {desktopApp
                  ? "Save once — uses your monthly quota one time. Replay from My Library anytime for free (no extra GB)."
                  : "Download videos for offline viewing. Use the Windows desktop app for in-app playback."}
              </p>
            </div>
          </div>
          {desktopApp ? (
            <Badge className="bg-emerald-500/20 text-emerald-100 border-emerald-400/40">
              Desktop · offline library
            </Badge>
          ) : null}
        </div>
      </div>

      <OttMonthlyQuotaCard quota={quota} loading={quotaLoading} variant="teacher" />

      {desktopApp ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <HardDrive className="h-5 w-5 text-emerald-700" />
            <div>
              <p className="font-semibold text-emerald-900">App storage (this device)</p>
              <p className="text-sm text-emerald-800">
                {appStorage.count} video{appStorage.count === 1 ? "" : "s"} ·{" "}
                {formatOttBytes(appStorage.bytes)} saved · unlimited replays
              </p>
            </div>
          </div>
          <Badge className="bg-emerald-600 text-white">{appStorage.count} in library</Badge>
        </div>
      ) : null}

      {!desktopApp ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
                <Monitor className="h-5 w-5 text-slate-700" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">VISWAM LMS Desktop (.exe)</h3>
                <p className="text-xs text-slate-600 mt-1 max-w-lg">
                  {desktopInstaller?.description ||
                    "Install the Windows desktop app to save and play OTT videos inside the app."}
                </p>
              </div>
            </div>
            {desktopInstaller?.available && desktopHref ? (
              <Button asChild className="bg-[#1A3557] hover:bg-[#152a45]">
                <a href={desktopHref} download={desktopInstaller.fileName}>
                  <Download className="h-4 w-4 mr-2" />
                  Download desktop app
                </a>
              </Button>
            ) : (
              <Badge variant="outline" className="text-amber-800 border-amber-300 bg-amber-50">
                Desktop installer not hosted yet
              </Badge>
            )}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant={tab === "browse" ? "default" : "outline"}
          className={tab === "browse" ? "bg-[#1A3557]" : ""}
          onClick={() => setTab("browse")}
        >
          Browse
        </Button>
        <Button
          type="button"
          variant={tab === "library" ? "default" : "outline"}
          className={tab === "library" ? "bg-emerald-600 hover:bg-emerald-700" : ""}
          onClick={() => setTab("library")}
        >
          <HardDrive className="h-4 w-4 mr-2" />
          My Library ({appStorage.count || localFiles.length})
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          placeholder={tab === "browse" ? "Search catalog…" : "Search your downloads…"}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-xl"
        />
      </div>

      {tab === "library" ? (
        filteredLibrary.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-12 text-center">
            <HardDrive className="mx-auto mb-3 h-10 w-10 text-slate-400" />
            <p className="font-medium text-slate-700">No videos saved in this app yet</p>
            <p className="text-sm text-slate-500 mt-1">
              {downloads.length > 0
                ? "You used your monthly quota but the file is not on this device. Go to Browse and tap Save & watch."
                : "Download a video from Browse to watch offline here."}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredLibrary.map((item) => {
              const id = String(item.contentId);
              return (
                <button
                  type="button"
                  key={id}
                  className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 text-white shadow-lg aspect-video flex flex-col justify-end p-4 text-left"
                  onClick={() => void playLocal(id, item.title || "Video")}
                >
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(16,185,129,0.25),transparent_50%)]" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                    <Play className="h-14 w-14 fill-white text-white" />
                  </div>
                  <div className="relative z-10">
                    <p className="font-semibold line-clamp-2">{item.title || "Video"}</p>
                    <p className="text-xs text-white/70 mt-1">{formatOttBytes(item.bytes)}</p>
                    <span className="inline-flex items-center gap-1 mt-3 text-xs font-medium text-emerald-200">
                      <Play className="h-3 w-3 fill-current" /> Tap to play offline
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )
      ) : filteredBrowse.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <Tv className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-700">No OTT videos in your scope</h3>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBrowse.map((video) => {
            const onDevice = localIds.has(video._id);
            const onServer = downloadedIds.has(video._id);
            const saved = onDevice || onServer;
            const size = Number(video.size) || 0;
            const busy = downloadingId === video._id;
            const progress = downloadProgress[video._id];
            const blocked =
              quota?.downloadsEnabled === false ||
              (quota?.canDownloadMore === false && !onServer);

            return (
              <div
                key={video._id}
                className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm flex flex-col"
              >
                <div className="aspect-video bg-gradient-to-br from-[#1A3557] to-emerald-800 flex items-center justify-center relative">
                  <Tv className="h-10 w-10 text-white/40" />
                  {onDevice ? (
                    <CheckCircle2 className="absolute top-2 right-2 h-5 w-5 text-emerald-300" />
                  ) : onServer ? (
                    <Badge className="absolute top-2 right-2 bg-amber-500/90 text-white text-[10px]">
                      Quota used
                    </Badge>
                  ) : null}
                </div>
                <div className="p-4 flex flex-col gap-3 flex-1">
                  <div>
                    <p className="font-semibold text-slate-900 line-clamp-2">{video.title}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {video.subjectName}
                      {video.classNumber ? ` · Class ${video.classNumber}` : ""}
                    </p>
                  </div>
                  {size > 0 ? (
                    <Badge variant="outline" className="w-fit">
                      {formatFileSize(size)}
                    </Badge>
                  ) : null}
                  {busy && typeof progress === "number" ? (
                    <Progress value={progress} className="h-2" />
                  ) : null}
                  <div className="flex gap-2 mt-auto">
                    {desktopApp && onDevice ? (
                      <Button
                        type="button"
                        size="sm"
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => void playLocal(video._id, video.title || "Video")}
                      >
                        <Play className="h-4 w-4 mr-1 fill-current" />
                        Play
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant={onDevice ? "outline" : "default"}
                      className={
                        onDevice ? "flex-1" : "flex-1 bg-[#1A3557] hover:bg-[#152a45]"
                      }
                      disabled={busy || blocked}
                      onClick={() => void handleVideoDownload(video)}
                    >
                      {busy ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4 mr-2" />
                      )}
                      {blocked
                        ? "Quota full"
                        : onDevice
                          ? "Re-save"
                          : onServer
                            ? "Save & watch"
                            : "Save & watch"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <OttOfflinePlayerModal
        open={Boolean(player)}
        title={player?.title || ""}
        playbackUrl={player?.url || null}
        onClose={() => setPlayer(null)}
      />
    </div>
  );
}
