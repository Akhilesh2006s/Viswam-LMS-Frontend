import { Play, Sparkles, Clock, GraduationCap } from 'lucide-react';
import {
  formatEduOTTDurationLabel,
  getEduOTTThumbnailUrl,
} from '@/lib/eduott-video-utils';
import { extractPlainSubjectName } from '@/lib/subject-names';
import type { OttVideo } from '@/lib/ott/types';

type Props = {
  featured: OttVideo | null;
  videoCount: number;
  onPlay: (video: OttVideo) => void;
};

export function AdminOttFeaturedHero({ featured, videoCount, onPlay }: Props) {
  if (!featured) {
    return (
      <section className="ott-admin-hero ott-admin-hero--empty">
        <div className="ott-admin-hero-vignette" aria-hidden />
        <div className="ott-admin-hero-inner">
          <span className="ott-admin-hero-eyebrow">
            <Sparkles className="h-3.5 w-3.5" />
            Viswam OTT
          </span>
          <h1 className="ott-admin-hero-title">Your streaming library</h1>
          <p className="ott-admin-hero-desc">
            Upload lessons in Content Studio → Viswam OTT. They will appear here for your
            licensed classes.
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
  const subject = extractPlainSubjectName(featured.subjectName) || featured.subjectName;
  const duration =
    featured.durationSeconds > 0
      ? formatEduOTTDurationLabel(featured.durationSeconds)
      : null;

  return (
    <section className="ott-admin-hero">
      {thumb ? (
        <div
          className="ott-admin-hero-backdrop"
          style={{ backgroundImage: `url(${thumb})` }}
          aria-hidden
        />
      ) : (
        <div className="ott-admin-hero-backdrop ott-admin-hero-backdrop--fallback" aria-hidden />
      )}
      <div className="ott-admin-hero-vignette" aria-hidden />
      <div className="ott-admin-hero-inner">
        <span className="ott-admin-hero-eyebrow">
          <Sparkles className="h-3.5 w-3.5" />
          Now featuring · {subject}
        </span>
        <h1 className="ott-admin-hero-title">{featured.title}</h1>
        <p className="ott-admin-hero-desc">
          {featured.description ||
            `Stream this lesson with your students — ${videoCount} video${videoCount !== 1 ? 's' : ''} in your catalog.`}
        </p>
        <div className="ott-admin-hero-meta">
          {featured.classLabel ? (
            <span className="ott-admin-hero-chip">
              <GraduationCap className="h-3.5 w-3.5" />
              Class {featured.classLabel}
            </span>
          ) : null}
          {duration ? (
            <span className="ott-admin-hero-chip">
              <Clock className="h-3.5 w-3.5" />
              {duration}
            </span>
          ) : null}
          <span className="ott-admin-hero-chip">{featured.views} views</span>
        </div>
        <div className="ott-admin-hero-actions">
          <button type="button" className="ott-admin-hero-play" onClick={() => onPlay(featured)}>
            <Play className="h-6 w-6 fill-current" />
            Play
          </button>
        </div>
      </div>
    </section>
  );
}
