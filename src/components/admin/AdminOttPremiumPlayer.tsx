import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Maximize,
  Lock,
  BookOpen,
  Eye,
  Clock,
  GraduationCap,
  Play,
} from 'lucide-react';
import { SecureStreamVideo } from '@/components/eduott/SecureStreamVideo';
import {
  extractYouTubeId,
  formatEduOTTDurationLabel,
  getEduOTTPlaybackUrl,
} from '@/lib/eduott-video-utils';
import type { OttVideo } from '@/lib/ott/types';

const SPEEDS = [0.75, 1, 1.25, 1.5, 2];

type Props = {
  video: OttVideo;
  nextVideo?: OttVideo | null;
  onClose: () => void;
  onPlayNext?: (video: OttVideo) => void;
};

export function AdminOttPremiumPlayer({ video, nextVideo, onClose, onPlayNext }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [speed, setSpeed] = useState(1);

  const cardItem = {
    ...video,
    _id: video.id,
    fileUrl: video.videoUrl,
  };
  const { isYouTube, url: playbackUrl } = getEduOTTPlaybackUrl(cardItem);

  useEffect(() => {
    if (videoRef.current) videoRef.current.playbackRate = speed;
  }, [speed]);

  const durationLabel = video.durationSeconds
    ? formatEduOTTDurationLabel(video.durationSeconds)
    : null;

  return (
    <div className="ott-admin-player">
      <header className="ott-admin-player-top">
        <button type="button" className="ott-admin-back" onClick={onClose}>
          <ArrowLeft className="h-4 w-4" />
          Back to catalog
        </button>
        <span className="ott-admin-player-brand">Viswam OTT</span>
      </header>

      <div className="ott-admin-player-inset">
        <div className="ott-admin-player-grid">
          <div className="ott-admin-player-main">
            <div className="ott-player-frame ott-admin-player-frame">
              {!playbackUrl ? (
                <p className="ott-admin-player-unavailable">Video unavailable</p>
              ) : isYouTube ? (
                <iframe
                  title={video.title}
                  src={`https://www.youtube.com/embed/${extractYouTubeId(playbackUrl)}?rel=0&modestbranding=1`}
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
                    if (nextVideo && onPlayNext) onPlayNext(nextVideo);
                  }}
                />
              )}
            </div>

            {!isYouTube && playbackUrl ? (
              <div className="ott-admin-player-toolbar">
                <div className="ott-admin-player-speeds">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      className={`ott-admin-control-chip ${speed === s ? 'active' : ''}`}
                      onClick={() => setSpeed(s)}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
                <div className="ott-admin-player-toolbar-actions">
                  <span className="ott-admin-control-chip ott-admin-control-chip--muted">
                    <Lock className="h-3 w-3" />
                    Secure stream
                  </span>
                  <button
                    type="button"
                    className="ott-admin-control-chip"
                    onClick={() => videoRef.current?.requestFullscreen?.()}
                  >
                    <Maximize className="h-3 w-3" />
                    Fullscreen
                  </button>
                </div>
              </div>
            ) : null}

            <div className="ott-admin-player-meta">
              <h1 className="ott-admin-player-title">{video.title}</h1>
              <p className="ott-admin-player-subline">
                {video.subjectName}
                {video.classLabel ? ` · Class ${video.classLabel}` : ''}
                {durationLabel ? ` · ${durationLabel}` : ''}
              </p>
              {video.description ? (
                <p className="ott-admin-player-desc">{video.description}</p>
              ) : null}
              <div className="ott-admin-player-tags">
                <span>
                  <Eye className="h-3.5 w-3.5" />
                  {video.views} views
                </span>
                <span>
                  <BookOpen className="h-3.5 w-3.5" />
                  {video.subjectName}
                </span>
              </div>
            </div>
          </div>

          <aside className="ott-admin-player-sidebar">
            <div className="ott-admin-player-card">
              <h3 className="ott-admin-player-card-title">Lesson details</h3>
              <dl className="ott-admin-player-details">
                <div>
                  <dt>Subject</dt>
                  <dd>{video.subjectName}</dd>
                </div>
                {video.classLabel ? (
                  <div>
                    <dt>Class</dt>
                    <dd>{video.classLabel}</dd>
                  </div>
                ) : null}
                {durationLabel ? (
                  <div>
                    <dt>Duration</dt>
                    <dd>{durationLabel}</dd>
                  </div>
                ) : null}
                <div>
                  <dt>Views</dt>
                  <dd>{video.views}</dd>
                </div>
              </dl>
              <div className="ott-admin-player-card-icons">
                <span>
                  <GraduationCap className="h-3.5 w-3.5" />
                  {video.classLabel ? `Class ${video.classLabel}` : '—'}
                </span>
                {durationLabel ? (
                  <span>
                    <Clock className="h-3.5 w-3.5" />
                    {durationLabel}
                  </span>
                ) : null}
              </div>
            </div>

            {nextVideo ? (
              <button
                type="button"
                className="ott-admin-player-next"
                onClick={() => onPlayNext?.(nextVideo)}
              >
                <span className="ott-admin-player-next-label">Up next</span>
                <p className="ott-admin-player-next-title">{nextVideo.title}</p>
                <p className="ott-admin-player-next-sub">{nextVideo.subjectName}</p>
                <span className="ott-admin-player-next-cta">
                  <Play className="h-3.5 w-3.5" />
                  Play next
                </span>
              </button>
            ) : null}
          </aside>
        </div>
      </div>
    </div>
  );
}
