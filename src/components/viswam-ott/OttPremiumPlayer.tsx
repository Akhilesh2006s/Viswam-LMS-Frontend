import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import {
  Maximize,
  Zap,
  FileQuestion,
  BookOpen,
  Paperclip,
  MessageCircle,
  Lock,
} from "lucide-react";
import { SecureStreamVideo } from "@/components/eduott/SecureStreamVideo";
import { extractYouTubeId, getEduOTTPlaybackUrl } from "@/lib/eduott-video-utils";
import type { OttVideo } from "@/lib/ott/types";
import { saveWatchProgress, getWatchProgress } from "@/lib/ott/storage";
import { postWatchProgress, fetchServerProgressMap } from "@/lib/ott/api";
import { OttTopBar } from "./OttTopBar";
import { OttBottomNav } from "./OttBottomNav";

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

type OttPremiumPlayerProps = {
  video: OttVideo;
  nextVideo?: OttVideo | null;
};

export function OttPremiumPlayer({ video, nextVideo }: OttPremiumPlayerProps) {
  const [, setLocation] = useLocation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [speed, setSpeed] = useState(1);
  const [xpFlash, setXpFlash] = useState(false);
  const [xpAmount, setXpAmount] = useState(20);
  const [saved, setSaved] = useState(() => getWatchProgress(video.id));
  const lastSyncRef = useRef(0);
  const lastPosRef = useRef(0);

  const cardItem = {
    ...video,
    _id: video.id,
    fileUrl: video.videoUrl,
  };
  const { isYouTube, url: playbackUrl } = getEduOTTPlaybackUrl(cardItem);

  useEffect(() => {
    fetchServerProgressMap().then((map) => {
      const row = map[video.id];
      if (row) setSaved(row);
    });
  }, [video.id]);

  const persistProgress = useCallback(
    (position: number, duration: number, completed?: boolean) => {
      const entry = {
        videoId: video.id,
        positionSeconds: position,
        durationSeconds: duration,
        updatedAt: new Date().toISOString(),
        completed,
      };
      saveWatchProgress(entry);
      setSaved(entry);

      const now = Date.now();
      const delta = Math.max(0, position - lastPosRef.current);
      lastPosRef.current = position;
      if (now - lastSyncRef.current < 8000 && !completed) return;
      lastSyncRef.current = now;

      void postWatchProgress({
        contentId: video.id,
        positionSeconds: position,
        durationSeconds: duration,
        watchTimeDelta: delta,
        title: video.title,
        subjectId: video.subjectId,
      }).then((result) => {
        if (result?.xpAwarded) {
          setXpAmount(result.xpAwarded);
          setXpFlash(true);
        }
      });
    },
    [video.id, video.title, video.subjectId],
  );

  useEffect(() => {
    const el = videoRef.current;
    if (!el || isYouTube) return;
    if (saved?.positionSeconds && saved.positionSeconds > 5) {
      el.currentTime = saved.positionSeconds;
    }
    const onTimeUpdate = () => {
      const dur = el.duration || video.durationSeconds || 0;
      if (dur > 0) {
        const pct = (el.currentTime / dur) * 100;
        persistProgress(el.currentTime, dur, pct >= 92);
        if (pct >= 80 && !xpFlash) {
          setXpFlash(true);
        }
      }
    };
    el.addEventListener("timeupdate", onTimeUpdate);
    return () => el.removeEventListener("timeupdate", onTimeUpdate);
  }, [isYouTube, persistProgress, saved, video.durationSeconds, xpFlash]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  const completionPct = saved
    ? Math.min(100, Math.round((saved.positionSeconds / (saved.durationSeconds || 1)) * 100))
    : 0;

  const chapterLabel = [video.chapter, video.module].filter(Boolean).join(" · ");

  return (
    <div className="viswam-ott">
      <OttTopBar showBack backHref="/edu-ott" onSearch={() => setLocation("/edu-ott/search")} />
      <div className="viswam-ott-main ott-player-layout">
        <div>
          <div className="ott-player-frame">
            {!playbackUrl ? (
              <p className="flex h-full items-center justify-center text-sm text-slate-400">
                Video unavailable
              </p>
            ) : isYouTube ? (
              <iframe
                title={video.title}
                src={`https://www.youtube.com/embed/${extractYouTubeId(playbackUrl)}?rel=0&start=${saved?.positionSeconds ? Math.floor(saved.positionSeconds) : 0}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
              />
            ) : (
              <SecureStreamVideo
                ref={videoRef}
                src={playbackUrl}
                playsInline
                autoPlay
                className="h-full w-full"
                wrapperClassName="h-full w-full"
                onEnded={() => {
                  persistProgress(video.durationSeconds, video.durationSeconds, true);
                  if (nextVideo) setLocation(`/edu-ott/watch/${nextVideo.id}`);
                }}
              />
            )}
          </div>

          <div className="ott-player-controls">
            {SPEEDS.map((s) => (
              <button
                key={s}
                type="button"
                className={`ott-control-chip ${speed === s ? "active" : ""}`}
                onClick={() => setSpeed(s)}
                disabled={isYouTube}
              >
                {s}x
              </button>
            ))}
            {!isYouTube && playbackUrl ? (
              <span className="ott-control-chip inline-flex items-center gap-1 opacity-80 cursor-default">
                <Lock className="h-3 w-3" />
                Stream only
              </span>
            ) : null}
            <button
              type="button"
              className="ott-control-chip"
              onClick={() => videoRef.current?.requestFullscreen?.()}
            >
              <Maximize className="mr-1 inline h-3 w-3" />
              Fullscreen
            </button>
          </div>

          {xpFlash ? (
            <p className="ott-xp-pop mt-3 flex items-center gap-2 text-sm font-bold text-emerald-400">
              <Zap className="h-4 w-4" /> +{xpAmount} XP — lesson complete!
            </p>
          ) : null}

          <div className="mt-4">
            <h1 className="text-xl font-bold text-white sm:text-2xl">{video.title}</h1>
            <p className="mt-1 text-sm text-slate-400">
              {video.subjectName}
              {video.teacherName ? ` · ${video.teacherName}` : ""}
              {chapterLabel ? ` · ${chapterLabel}` : ""}
            </p>
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-300">
              <span>Progress: {completionPct}%</span>
              <span>{video.views} views</span>
            </div>
            <div className="eco-xp-bar mt-3 max-w-md bg-white/10">
              <span style={{ width: `${completionPct}%` }} />
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-slate-800/50 p-4">
            <h3 className="text-sm font-bold text-white">This chapter</h3>
            <ul className="mt-3 space-y-2 text-sm">
              {[
                { icon: BookOpen, label: "Video", done: completionPct >= 80 },
                { icon: FileQuestion, label: "Quiz", href: `/quiz?after=${video.id}` },
                { icon: Paperclip, label: "Notes & PDF", disabled: true },
                { icon: MessageCircle, label: "Discussion", disabled: true },
              ].map(({ icon: Icon, label, done, disabled }) => (
                <li
                  key={label}
                  className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${done ? "text-emerald-400" : disabled ? "text-slate-500" : "text-slate-200"}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {done ? " ✓" : ""}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="ott-btn-play mt-4 w-full justify-center"
              onClick={() =>
                setLocation(
                  `/learning-paths`,
                )
              }
            >
              <FileQuestion className="h-4 w-4" />
              Take chapter quiz
            </button>
          </div>
          {nextVideo ? (
            <button
              type="button"
              className="w-full rounded-xl border border-white/10 bg-slate-800/50 p-3 text-left text-sm hover:border-emerald-500/50"
              onClick={() => setLocation(`/edu-ott/watch/${nextVideo.id}`)}
            >
              <p className="text-xs text-emerald-400">Up next</p>
              <p className="font-semibold text-white line-clamp-2">{nextVideo.title}</p>
            </button>
          ) : null}
        </aside>
      </div>
      <OttBottomNav />
    </div>
  );
}
