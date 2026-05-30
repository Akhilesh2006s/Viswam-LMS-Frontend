import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { fetchOttCatalog } from "@/lib/ott/catalog";
import type { OttVideo } from "@/lib/ott/types";
import { OttPremiumPlayer } from "@/components/viswam-ott/OttPremiumPlayer";

export default function EduOTTWatchPage() {
  const [, params] = useRoute("/edu-ott/watch/:id");
  const [, setLocation] = useLocation();
  const [video, setVideo] = useState<OttVideo | null>(null);
  const [nextVideo, setNextVideo] = useState<OttVideo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    let cancelled = false;
    (async () => {
      const { videos: catalog } = await fetchOttCatalog();
      if (cancelled) return;
      const idx = catalog.findIndex((v) => v.id === params.id);
      setVideo(idx >= 0 ? catalog[idx] : null);
      setNextVideo(idx >= 0 && idx < catalog.length - 1 ? catalog[idx + 1] : null);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [params?.id]);

  if (loading) {
    return (
      <div className="viswam-ott flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!video) {
    return (
      <div className="viswam-ott flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-white">Lesson not found</p>
        <button type="button" className="ott-btn-play" onClick={() => setLocation("/edu-ott")}>
          Back to VISWAM OTT
        </button>
      </div>
    );
  }

  return <OttPremiumPlayer video={video} nextVideo={nextVideo} />;
}
