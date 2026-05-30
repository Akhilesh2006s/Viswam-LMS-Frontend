import { Play } from "lucide-react";

export type ShowcaseVideo = {
  id: string;
  title: string;
  thumbnailUrl?: string;
  subject?: string;
  progress?: number;
};

type EduOTTShowcaseRowProps = {
  title: string;
  videos: ShowcaseVideo[];
  onSelect?: (id: string) => void;
};

export function EduOTTShowcaseRow({ title, videos, onSelect }: EduOTTShowcaseRowProps) {
  if (!videos.length) return null;
  return (
    <section className="eco-ott-row">
      <h2 className="eco-ott-row-title">{title}</h2>
      <div className="eco-ott-scroll">
        {videos.map((v) => (
          <button
            key={v.id}
            type="button"
            className="eco-ott-poster group relative"
            onClick={() => onSelect?.(v.id)}
          >
            {v.thumbnailUrl ? (
              <img src={v.thumbnailUrl} alt="" className="h-full w-full object-cover" loading="lazy" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-[#0B1F3A] to-[#00A86B]">
                <Play className="h-12 w-12 text-white/80" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
            <div className="absolute bottom-0 left-0 right-0 p-3 text-left">
              {v.subject ? <p className="text-xs text-emerald-300">{v.subject}</p> : null}
              <p className="line-clamp-2 text-sm font-semibold text-white">{v.title}</p>
              {v.progress != null && v.progress > 0 ? (
                <div className="eco-xp-bar mt-2 bg-white/30">
                  <span style={{ width: `${v.progress}%` }} />
                </div>
              ) : null}
            </div>
          </button>
        ))}
      </div>
    </section>
  );
}
