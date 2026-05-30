import { useEffect, useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { Loader2, Star, Award, Play } from "lucide-react";
import { fetchOttCatalog, buildCourses } from "@/lib/ott/catalog";
import type { OttCourse } from "@/lib/ott/types";
import { OttTopBar } from "@/components/viswam-ott/OttTopBar";
import { OttBottomNav } from "@/components/viswam-ott/OttBottomNav";
import { OttPoster } from "@/components/viswam-ott/OttPoster";
import { getAllProgress } from "@/lib/ott/storage";

export default function EduOTTCoursePage() {
  const [, params] = useRoute("/edu-ott/course/:id");
  const [, setLocation] = useLocation();
  const [course, setCourse] = useState<OttCourse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!params?.id) return;
    const id = decodeURIComponent(params.id);
    fetchOttCatalog().then(({ videos }) => {
      const courses = buildCourses(videos);
      const found = courses.find((c) => c.id === id || c.name === id);
      setCourse(found || null);
      setLoading(false);
    });
  }, [params?.id]);

  const progressPct = useMemo(() => {
    if (!course) return 0;
    const all = getAllProgress();
    let sum = 0;
    for (const v of course.videos) {
      const p = all[v.id];
      if (p?.completed) sum += 100;
      else if (p && p.durationSeconds > 0) sum += (p.positionSeconds / p.durationSeconds) * 100;
    }
    return Math.round(sum / Math.max(course.videos.length, 1));
  }, [course]);

  if (loading) {
    return (
      <div className="viswam-ott flex min-h-screen items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!course) {
    return (
      <div className="viswam-ott flex min-h-screen items-center justify-center text-white">
        Course not found
      </div>
    );
  }

  return (
    <div className="viswam-ott">
      <OttTopBar showBack backHref="/edu-ott" />
      <main className="viswam-ott-main">
        <div className="ott-course-banner">
          <p className="text-xs font-bold uppercase tracking-widest text-amber-300/90">Course</p>
          <h1 className="mt-2 text-3xl font-bold">{course.name}</h1>
          <p className="mt-2 max-w-xl text-sm text-white/75">
            Master {course.name} with premium video lessons, quizzes, and certificates on completion.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            <span>{course.totalLessons} lessons</span>
            <span>{progressPct}% complete</span>
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" /> 4.8
            </span>
            <span className="flex items-center gap-1 text-emerald-300">
              <Award className="h-4 w-4" /> Certificate available
            </span>
          </div>
          <div className="eco-xp-bar mt-4 max-w-md bg-white/15">
            <span style={{ width: `${progressPct}%` }} />
          </div>
          {course.videos[0] ? (
            <button
              type="button"
              className="ott-btn-play mt-6"
              onClick={() => setLocation(`/edu-ott/watch/${course.videos[0].id}`)}
            >
              <Play className="h-5 w-5 fill-current" />
              {progressPct > 0 ? "Continue course" : "Start course"}
            </button>
          ) : null}
        </div>

        <section className="ott-section">
          <h2 className="ott-section-title mb-4">All lessons</h2>
          <div className="ott-row-scroll">
            {course.videos.map((v) => (
              <OttPoster
                key={v.id}
                video={v}
                onClick={() => setLocation(`/edu-ott/watch/${v.id}`)}
              />
            ))}
          </div>
        </section>

        <section className="ott-section rounded-xl border border-white/10 bg-slate-800/30 p-4">
          <h3 className="font-bold text-white">Skills covered</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {["Concept mastery", "Problem solving", "Quiz practice", "Real-world application"].map(
              (s) => (
                <span key={s} className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs text-emerald-300">
                  {s}
                </span>
              ),
            )}
          </div>
        </section>
      </main>
      <OttBottomNav />
    </div>
  );
}
