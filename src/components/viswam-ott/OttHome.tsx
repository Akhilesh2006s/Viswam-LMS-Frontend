import { useEffect, useState, useMemo } from "react";
import { useLocation } from "wouter";
import { Loader2, Sparkles } from "lucide-react";
import { fetchOttCatalog, buildHomeSections } from "@/lib/ott/catalog";
import { hydrateOttFromServer } from "@/lib/ott/api";
import { OttAnalyticsStrip } from "./OttAnalyticsStrip";
import type { OttVideo } from "@/lib/ott/types";
import { OttTopBar } from "./OttTopBar";
import { OttBottomNav } from "./OttBottomNav";
import { OttHeroBanner } from "./OttHeroBanner";
import { OttContentRow } from "./OttContentRow";
import { OttVideoGrid } from "./OttVideoGrid";
import { OttEmptyState } from "./OttEmptyState";
import { useEduOTTFilters } from "@/contexts/edu-ott-filter-context";
import { EduOTTGlobalFilterBar } from "@/components/eduott/EduOTTGlobalFilterBar";

function normalizeClassLabel(value: string): string {
  const s = String(value || "").trim().replace(/^class\s+/i, "");
  return /^\d+$/.test(s) ? String(parseInt(s, 10)) : s.toLowerCase();
}

function classLabelsMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  return normalizeClassLabel(a) === normalizeClassLabel(b);
}

export function OttHome() {
  const [, setLocation] = useLocation();
  const { selectedClass, selectedSubject, clearFilters } = useEduOTTFilters();
  const [videos, setVideos] = useState<OttVideo[]>([]);
  const [catalogMessage, setCatalogMessage] = useState<string | undefined>();
  const [continueIds, setContinueIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [catalog, hydrated] = await Promise.all([
          fetchOttCatalog(),
          hydrateOttFromServer(),
        ]);
        if (!cancelled) {
          setVideos(catalog.videos);
          setCatalogMessage(catalog.message);
          setContinueIds(hydrated.continueIds);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    return videos.filter((v) => {
      if (selectedClass && !classLabelsMatch(v.classLabel, selectedClass)) return false;
      if (selectedSubject && v.subjectName !== selectedSubject) return false;
      return true;
    });
  }, [videos, selectedClass, selectedSubject]);

  const sections = useMemo(
    () => buildHomeSections(filtered, continueIds),
    [filtered, continueIds],
  );
  const featured = filtered[0] || null;
  const hasFilters = !!(selectedClass || selectedSubject);

  const classOptions = useMemo(
    () => [...new Set(videos.map((v) => v.classLabel).filter(Boolean))].sort(),
    [videos],
  );
  const subjectOptions = useMemo(() => {
    const names = new Set<string>();
    videos.forEach((v) => {
      if (selectedClass && !classLabelsMatch(v.classLabel, selectedClass)) return;
      if (v.subjectName) names.add(v.subjectName);
    });
    return [...names].sort();
  }, [videos, selectedClass]);

  const goWatch = (v: OttVideo) => setLocation(`/edu-ott/watch/${v.id}`);
  const goCourse = (v: OttVideo) =>
    setLocation(`/edu-ott/course/${encodeURIComponent(v.subjectId || v.subjectName)}`);

  if (loading) {
    return (
      <div className="viswam-ott flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="viswam-ott">
      <OttTopBar onSearch={() => setLocation("/edu-ott/search")} />
      <main className="viswam-ott-main pb-8">
        <OttHeroBanner featured={featured} onPlay={goWatch} />

        {filtered.length > 0 ? (
          <>
            <OttVideoGrid
              title="Your uploaded lessons"
              subtitle="Videos from Viswam OTT available for your class"
              videos={filtered}
              onSelect={goWatch}
            />

            <div className="ott-filters-wrap mx-4 mb-6">
              <EduOTTGlobalFilterBar
                classOptions={classOptions}
                subjectOptions={subjectOptions}
                variant="dark"
              />
            </div>

            {sections
              .filter((s) => s.id !== "recommended" && s.id !== "recent")
              .map((section) => (
                <OttContentRow
                  key={section.id}
                  title={section.title}
                  subtitle={section.subtitle}
                  videos={section.videos}
                  onSelect={goWatch}
                  onSeeAll={
                    section.id === "popular-subjects" && section.videos[0]
                      ? () => goCourse(section.videos[0])
                      : undefined
                  }
                />
              ))}

            <OttAnalyticsStrip />
          </>
        ) : (
          <>
            <div className="ott-filters-wrap mx-4 mb-6">
              <EduOTTGlobalFilterBar
                classOptions={classOptions}
                subjectOptions={subjectOptions}
                variant="dark"
              />
            </div>
            <OttEmptyState
              message={
                hasFilters
                  ? "No videos match these filters. Try All classes / All subjects."
                  : catalogMessage
              }
              hasFilters={hasFilters}
              onClearFilters={clearFilters}
            />
            <section className="mx-4 mb-8 rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
              <Sparkles className="mx-auto mb-2 h-6 w-6 text-[var(--ott-gold)]" />
              <p className="text-sm text-slate-300">
                Super Admin uploads videos under <strong className="text-white">Viswam OTT</strong>{" "}
                (product → subject → class). Students only see videos for their class and licensed
                products.
              </p>
            </section>
            <OttAnalyticsStrip />
          </>
        )}
      </main>
      <OttBottomNav />
    </div>
  );
}
