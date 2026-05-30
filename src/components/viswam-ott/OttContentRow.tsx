import { ChevronRight } from "lucide-react";
import type { OttVideo } from "@/lib/ott/types";
import { OttPoster } from "./OttPoster";

type OttContentRowProps = {
  title: string;
  subtitle?: string;
  videos: OttVideo[];
  onSelect: (video: OttVideo) => void;
  onSeeAll?: () => void;
};

export function OttContentRow({ title, subtitle, videos, onSelect, onSeeAll }: OttContentRowProps) {
  if (!videos.length) return null;
  return (
    <section className="ott-section">
      <div className="ott-section-head">
        <div>
          <h2 className="ott-section-title">{title}</h2>
          {subtitle ? <p className="ott-section-sub">{subtitle}</p> : null}
        </div>
        {onSeeAll ? (
          <button
            type="button"
            onClick={onSeeAll}
            className="flex items-center gap-0.5 text-xs font-semibold text-emerald-400 hover:text-emerald-300"
          >
            See all <ChevronRight className="h-3 w-3" />
          </button>
        ) : null}
      </div>
      <div className="ott-row-scroll">
        {videos.map((v) => (
          <OttPoster key={v.id} video={v} onClick={() => onSelect(v)} />
        ))}
      </div>
    </section>
  );
}
