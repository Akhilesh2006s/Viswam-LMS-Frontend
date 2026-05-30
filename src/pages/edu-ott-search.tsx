import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Search, Loader2 } from "lucide-react";
import { fetchOttCatalog, searchVideos } from "@/lib/ott/catalog";
import type { OttVideo } from "@/lib/ott/types";
import { OttTopBar } from "@/components/viswam-ott/OttTopBar";
import { OttBottomNav } from "@/components/viswam-ott/OttBottomNav";
import { OttPoster } from "@/components/viswam-ott/OttPoster";

export default function EduOTTSearchPage() {
  const [, setLocation] = useLocation();
  const [videos, setVideos] = useState<OttVideo[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOttCatalog().then(({ videos }) => {
      setVideos(videos);
      setLoading(false);
    });
  }, []);

  const results = useMemo(() => searchVideos(videos, query), [videos, query]);

  const subjects = useMemo(() => [...new Set(videos.map((v) => v.subjectName))].sort(), [videos]);

  return (
    <div className="viswam-ott">
      <OttTopBar showBack backHref="/edu-ott" />
      <main className="viswam-ott-main p-4">
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search course, teacher, subject, class, chapter…"
            className="w-full rounded-xl border border-white/10 bg-slate-800 py-3 pl-11 pr-4 text-white placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none"
            autoFocus
          />
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {subjects.slice(0, 8).map((s) => (
            <button
              key={s}
              type="button"
              className="rounded-full border border-white/10 px-3 py-1 text-xs font-medium text-slate-300 hover:border-emerald-500/50"
              onClick={() => setQuery(s)}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <Loader2 className="mx-auto h-8 w-8 animate-spin text-emerald-500" />
        ) : (
          <>
            <p className="mb-4 text-sm text-slate-400">{results.length} results</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {results.map((v) => (
                <OttPoster key={v.id} video={v} onClick={() => setLocation(`/edu-ott/watch/${v.id}`)} />
              ))}
            </div>
          </>
        )}
      </main>
      <OttBottomNav />
    </div>
  );
}
