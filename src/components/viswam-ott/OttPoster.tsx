import { Play } from "lucide-react";
import { formatEduOTTDurationLabel, getEduOTTThumbnailUrl } from "@/lib/eduott-video-utils";
import type { OttVideo } from "@/lib/ott/types";
import { getWatchProgress } from "@/lib/ott/storage";

type OttPosterProps = {
  video: OttVideo;
  onClick: () => void;
  size?: "default" | "large";
};

export function OttPoster({ video, onClick, size = "default" }: OttPosterProps) {
  const progress = getWatchProgress(video.id);
  const pct =
    progress && progress.durationSeconds > 0
      ? Math.min(100, Math.round((progress.positionSeconds / progress.durationSeconds) * 100))
      : 0;
  const thumb = getEduOTTThumbnailUrl({
    thumbnailUrl: video.thumbnailUrl,
    youtubeUrl: video.youtubeUrl,
    videoUrl: video.videoUrl,
    fileUrl: video.videoUrl,
  });

  return (
    <article
      className={`ott-poster ${size === "large" ? "!w-[min(320px,85vw)]" : ""}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter") onClick();
      }}
      role="button"
      tabIndex={0}
    >
      <div className="ott-poster-thumb">
        {thumb ? (
          <img src={thumb} alt="" loading="lazy" />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Play className="h-12 w-12 text-white/40" />
          </div>
        )}
        {pct > 0 && pct < 100 ? (
          <div className="ott-poster-progress">
            <span style={{ width: `${pct}%` }} />
          </div>
        ) : null}
        <div className="ott-poster-play">
          <span className="ott-poster-play-icon">
            <Play className="h-6 w-6 fill-current" />
          </span>
        </div>
      </div>
      <div className="ott-poster-meta">
        <p className="ott-poster-title">{video.title}</p>
        <p className="ott-poster-tag">
          {video.subjectName}
          {video.classLabel ? ` · Class ${video.classLabel}` : ""}
          {video.durationSeconds ? ` · ${formatEduOTTDurationLabel(video.durationSeconds)}` : ""}
        </p>
      </div>
    </article>
  );
}
