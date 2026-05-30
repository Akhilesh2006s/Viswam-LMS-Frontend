import type { OttVideo } from "@/lib/ott/types";
import { OttPoster } from "./OttPoster";

type OttVideoGridProps = {
  title: string;
  subtitle?: string;
  videos: OttVideo[];
  onSelect: (video: OttVideo) => void;
};

export function OttVideoGrid({ title, subtitle, videos, onSelect }: OttVideoGridProps) {
  if (!videos.length) return null;
  return (
    <section className="ott-section">
      <div className="ott-section-head">
        <div>
          <h2 className="ott-section-title">{title}</h2>
          {subtitle ? <p className="ott-section-sub">{subtitle}</p> : null}
        </div>
        <span className="ott-count-badge">{videos.length}</span>
      </div>
      <div className="ott-video-grid">
        {videos.map((v) => (
          <OttPoster key={v.id} video={v} onClick={() => onSelect(v)} size="large" />
        ))}
      </div>
    </section>
  );
}
