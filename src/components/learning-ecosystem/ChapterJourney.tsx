import { useMemo } from "react";
import { useLocation } from "wouter";
import { Lock, Play, FileQuestion, CheckCircle2, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  getSortedChapterNumbers,
  videoNumberOnly,
  isChapterFullyComplete,
  isChapterQuizPassed,
  isChapterLocked,
  getActiveChapterNumber,
  type ChapterCompletedDates,
  type ChapterQuizPassed,
} from "@/lib/video-chapter-schedule";

export type ChapterVideo = {
  _id?: string;
  id?: string;
  title: string;
  chapter?: string;
  module?: string;
  type?: string;
};

export type ChapterQuiz = {
  _id: string;
  title: string;
  hasAttempted?: boolean;
  lastScore?: number;
};

type ChapterJourneyProps = {
  subjectId: string;
  videos: ChapterVideo[];
  quizzes: ChapterQuiz[];
  completedVideoIds: Set<string>;
  chapterCompletedDates: ChapterCompletedDates;
  chapterQuizPassed: ChapterQuizPassed;
  onPlayVideo: (video: ChapterVideo) => void;
};

function quizForChapter(chapter: string, quizzes: ChapterQuiz[]): ChapterQuiz | undefined {
  const ch = videoNumberOnly(chapter);
  return (
    quizzes.find((q) => videoNumberOnly(q.title).includes(ch) && q.title.toLowerCase().includes("chapter")) ||
    quizzes.find((q) => videoNumberOnly(q.title) === ch) ||
    quizzes[parseInt(ch, 10) - 1]
  );
}

export function ChapterJourney({
  subjectId,
  videos,
  quizzes,
  completedVideoIds,
  chapterCompletedDates,
  chapterQuizPassed,
  onPlayVideo,
}: ChapterJourneyProps) {
  const [, setLocation] = useLocation();

  const chapterVideos = useMemo(
    () => videos.filter((v) => videoNumberOnly(v.chapter)),
    [videos],
  );

  const chapters = useMemo(() => getSortedChapterNumbers(chapterVideos), [chapterVideos]);

  const activeChapter = useMemo(
    () =>
      getActiveChapterNumber(
        chapterVideos,
        completedVideoIds,
        chapterCompletedDates,
        chapterQuizPassed,
      ),
    [chapterVideos, completedVideoIds, chapterCompletedDates, chapterQuizPassed],
  );

  if (chapters.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-8 text-center">
        <p className="text-sm text-slate-500">
          No chapter-tagged videos yet. Content with chapter numbers will appear here as a learning path.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-bold text-slate-900">Chapter journey</h2>
        <p className="text-sm text-slate-500">Watch all modules → pass the quiz → unlock the next chapter (+50 XP)</p>
      </div>
      {chapters.map((ch) => {
        const mods = chapterVideos.filter((v) => videoNumberOnly(v.chapter) === ch);
        const videosDone = isChapterFullyComplete(mods, completedVideoIds);
        const quiz = quizForChapter(ch, quizzes);
        const quizDone = isChapterQuizPassed(ch, chapterQuizPassed);
        const locked = isChapterLocked(
          ch,
          chapterVideos,
          completedVideoIds,
          chapterCompletedDates,
          chapterQuizPassed,
          activeChapter,
        );
        const complete = videosDone && (quizDone || !quiz);

        return (
          <div
            key={ch}
            className={cn(
              "rounded-2xl border p-4 transition-all",
              locked && "border-slate-100 bg-slate-50/80 opacity-75",
              complete && "border-emerald-200 bg-emerald-50/40",
              !locked && !complete && "border-slate-200 bg-white shadow-sm",
            )}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {locked ? (
                  <Lock className="h-4 w-4 text-slate-400" />
                ) : complete ? (
                  <CheckCircle2 className="h-5 w-5 text-[var(--brand-emerald)]" />
                ) : (
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-navy)] text-xs font-bold text-white">
                    {ch}
                  </span>
                )}
                <div>
                  <p className="font-semibold text-slate-900">Chapter {ch}</p>
                  <p className="text-xs text-slate-500">
                    {mods.length} video{mods.length !== 1 ? "s" : ""}
                    {quiz ? " · 1 quiz" : ""}
                  </p>
                </div>
              </div>
              {activeChapter === ch && !complete && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  In progress
                </span>
              )}
            </div>

            <div className="space-y-2">
              {mods.map((v) => {
                const id = String(v._id || v.id);
                const done = completedVideoIds.has(id);
                return (
                  <button
                    key={id}
                    type="button"
                    disabled={locked}
                    onClick={() => !locked && onPlayVideo(v)}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                      done ? "border-emerald-200 bg-emerald-50/50" : "border-slate-100 bg-slate-50 hover:border-emerald-300",
                      locked && "cursor-not-allowed",
                    )}
                  >
                    {done ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--brand-emerald)]" />
                    ) : (
                      <Play className="h-4 w-4 shrink-0 text-[var(--brand-navy)]" />
                    )}
                    <span className="flex-1 line-clamp-1 font-medium text-slate-800">{v.title}</span>
                  </button>
                );
              })}

              {quiz ? (
                <button
                  type="button"
                  disabled={locked || !videosDone}
                  onClick={() => {
                    if (!locked && videosDone) {
                      setLocation(
                        `/quiz/${quiz._id}?subjectId=${encodeURIComponent(subjectId)}&chapter=${encodeURIComponent(ch)}`,
                      );
                    }
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors",
                    quizDone ? "border-emerald-200 bg-emerald-50/50" : "border-amber-200/80 bg-amber-50/50",
                    (!videosDone || locked) && "cursor-not-allowed opacity-60",
                    videosDone && !locked && !quizDone && "hover:border-amber-400",
                  )}
                >
                  <FileQuestion className="h-4 w-4 shrink-0 text-amber-700" />
                  <span className="flex-1 font-medium text-slate-800">{quiz.title}</span>
                  {quizDone ? (
                    <CheckCircle2 className="h-4 w-4 text-[var(--brand-emerald)]" />
                  ) : videosDone ? (
                    <span className="text-xs font-semibold text-amber-700">Start +50 XP</span>
                  ) : (
                    <span className="text-xs text-slate-400">Complete videos first</span>
                  )}
                </button>
              ) : (
                videosDone && !quizDone && (
                  <p className="text-xs text-slate-500 px-1">No quiz for this chapter — next unlocks when all videos are done.</p>
                )
              )}
            </div>

            {complete && (
              <p className="mt-2 flex items-center gap-1 text-xs font-medium text-[var(--brand-emerald)]">
                <Zap className="h-3 w-3" /> Chapter complete
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
