import { Play, Plus, Sparkles } from "lucide-react";
import { getEduOTTThumbnailUrl } from "@/lib/eduott-video-utils";
import type { OttVideo } from "@/lib/ott/types";
import { isInWatchlist, toggleWatchlist, getWatchlist } from "@/lib/ott/storage";
import { toggleServerWatchlist } from "@/lib/ott/api";
import { useState } from "react";

type OttHeroBannerProps = {
  featured: OttVideo | null;
  onPlay: (video: OttVideo) => void;
  /** Hide student watchlist control (e.g. school admin preview) */
  showWatchlist?: boolean;
};

export function OttHeroBanner({ featured, onPlay, showWatchlist = true }: OttHeroBannerProps) {
  const [saved, setSaved] = useState(() => (featured ? isInWatchlist(featured.id) : false));

  if (!featured) {
    return (
      <section className="ott-hero ott-hero-compact mx-4">
        <div className="ott-hero-scrim" />
        <div className="ott-hero-content">
          <span className="ott-hero-badge">
            <Sparkles className="h-3 w-3" /> VISWAM OTT
          </span>
          <h1>Your premium learning universe</h1>
          <p className="text-sm text-white/75 max-w-md">
            Stream uploaded lessons for your class — pick a video below when they appear.
          </p>
        </div>
      </section>
    );
  }

  const thumb = getEduOTTThumbnailUrl({
    thumbnailUrl: featured.thumbnailUrl,
    youtubeUrl: featured.youtubeUrl,
    videoUrl: featured.videoUrl,
    fileUrl: featured.videoUrl,
  });

  return (
    <section className="ott-hero">
      {thumb ? (
        <div className="ott-hero-bg" style={{ backgroundImage: `url(${thumb})` }} aria-hidden />
      ) : null}
      <div className="ott-hero-scrim" />
      <div className="ott-hero-content">
        <span className="ott-hero-badge">
          <Sparkles className="h-3 w-3" /> Featured · {featured.subjectName}
        </span>
        <h1>{featured.title}</h1>
        <p className="text-sm text-white/80 line-clamp-2">
          {featured.description || `Premium lesson from ${featured.subjectName}. Watch, quiz, earn XP.`}
        </p>
        <div className="ott-hero-actions">
          <button type="button" className="ott-btn-play" onClick={() => onPlay(featured)}>
            <Play className="h-5 w-5 fill-current" />
            Play now
          </button>
          {showWatchlist ? (
            <button
              type="button"
              className="ott-btn-ghost"
              onClick={async () => {
                const server = await toggleServerWatchlist(featured.id);
                const next = server ?? toggleWatchlist(featured.id);
                setSaved(next);
                if (server !== null) {
                  const list = getWatchlist();
                  const has = list.includes(featured.id);
                  if (next && !has) list.unshift(featured.id);
                  if (!next) {
                    const i = list.indexOf(featured.id);
                    if (i >= 0) list.splice(i, 1);
                  }
                  localStorage.setItem("viswam_ott_watchlist", JSON.stringify(list));
                }
              }}
            >
              <Plus className={`h-4 w-4 ${saved ? "rotate-45" : ""}`} />
              {saved ? "In watchlist" : "My list"}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
