import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Loader2, Bookmark } from "lucide-react";
import { fetchOttCatalog } from "@/lib/ott/catalog";
import type { OttVideo } from "@/lib/ott/types";
import { getWatchlist, getContinueWatchingIds } from "@/lib/ott/storage";
import { hydrateOttFromServer } from "@/lib/ott/api";
import { OttAnalyticsStrip } from "@/components/viswam-ott/OttAnalyticsStrip";
import { OttTopBar } from "@/components/viswam-ott/OttTopBar";
import { OttBottomNav } from "@/components/viswam-ott/OttBottomNav";
import { OttContentRow } from "@/components/viswam-ott/OttContentRow";

export default function EduOTTMyLearningPage() {
  const [, setLocation] = useLocation();
  const [videos, setVideos] = useState<OttVideo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOttCatalog().then(({ videos }) => {
      setVideos(videos);
      setLoading(false);
    });
  }, []);

  const continueIds = getContinueWatchingIds();
  const watchlistIds = getWatchlist();

  const continueVideos = useMemo(
    () => continueIds.map((id) => videos.find((v) => v.id === id)).filter(Boolean) as OttVideo[],
    [continueIds, videos],
  );
  const savedVideos = useMemo(
    () => watchlistIds.map((id) => videos.find((v) => v.id === id)).filter(Boolean) as OttVideo[],
    [watchlistIds, videos],
  );

  const goWatch = (v: OttVideo) => setLocation(`/edu-ott/watch/${v.id}`);

  if (loading) {
    return (
      <div className="viswam-ott flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="viswam-ott">
      <OttTopBar showBack backHref="/edu-ott" />
      <main className="viswam-ott-main pb-8">
        <section className="ott-section pt-4">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Bookmark className="h-6 w-6 text-emerald-400" />
            My Learning
          </h1>
          <p className="text-sm text-slate-400 mt-1">Continue watching and your saved list</p>
        </section>
        <OttAnalyticsStrip />
        <OttContentRow
          title="Continue Learning"
          videos={continueVideos}
          onSelect={goWatch}
        />
        <OttContentRow
          title="Watchlist"
          subtitle="Saved for later"
          videos={savedVideos}
          onSelect={goWatch}
        />
      </main>
      <OttBottomNav />
    </div>
  );
}
