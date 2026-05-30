import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { HardDrive, Lock, Video as VideoIcon } from 'lucide-react';
import { extractYouTubeId, getEduOTTPlaybackUrl } from '@/lib/eduott-video-utils';
import { formatFileSize } from '@/lib/format-bytes';
import { cn } from '@/lib/utils';
import { SecureStreamVideo } from '@/components/eduott/SecureStreamVideo';
import type { EduOTTVideoCardItem } from '@/components/eduott/EduOTTVideoCard';

export type OttPreviewMeta = {
  fileSizeBytes?: number;
  classNumber?: string;
  subjectName?: string;
  maxStreamQuality?: string;
  productCode?: string;
};

type EduOTTVideoPlayerDialogProps = {
  video: EduOTTVideoCardItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Extra rows for super-admin preview */
  meta?: OttPreviewMeta;
};

export function EduOTTVideoPlayerDialog({
  video,
  open,
  onOpenChange,
  meta,
}: EduOTTVideoPlayerDialogProps) {
  const { isYouTube, url: playbackUrl } = video
    ? getEduOTTPlaybackUrl(video)
    : { isYouTube: false, url: null as string | null };

  const sizeLabel = formatFileSize(meta?.fileSizeBytes, 'Unknown size');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92vh] w-full max-w-[min(100vw-1.5rem,1280px)] flex-col gap-0 overflow-hidden border-[var(--brand-navy)]/20 p-0">
        <DialogHeader className="space-y-1 border-b bg-gradient-to-r from-[var(--brand-navy)] to-slate-800 px-4 py-4 text-white sm:px-6">
          <DialogTitle className="pr-8 text-lg text-white sm:text-xl">
            {video?.title ?? 'Content preview'}
          </DialogTitle>
          <DialogDescription className="text-slate-300">
            Stream preview — download disabled for all users
          </DialogDescription>
          {meta ? (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              {meta.classNumber ? (
                <Badge className="bg-white/15 text-white hover:bg-white/20">
                  Class {meta.classNumber}
                </Badge>
              ) : null}
              {meta.subjectName ? (
                <Badge variant="outline" className="border-emerald-400/50 text-emerald-200">
                  {meta.subjectName}
                </Badge>
              ) : null}
              {meta.maxStreamQuality ? (
                <Badge className="bg-[var(--brand-gold)]/90 text-[var(--brand-navy)]">
                  {meta.maxStreamQuality}
                </Badge>
              ) : null}
              <Badge
                className={cn(
                  'gap-1 font-semibold',
                  (meta?.fileSizeBytes ?? 0) > 0
                    ? 'bg-[var(--brand-gold)] text-[var(--brand-navy)]'
                    : 'bg-amber-500/30 text-amber-100',
                )}
              >
                <HardDrive className="h-3 w-3" />
                {sizeLabel}
              </Badge>
              <span className="inline-flex items-center gap-1 text-xs text-slate-400">
                <Lock className="h-3 w-3" />
                No download
              </span>
            </div>
          ) : null}
        </DialogHeader>

        {video ? (
          <div className="flex min-h-0 flex-1 flex-col bg-black">
            <div className="min-h-0 flex-1 overflow-hidden">
              {!playbackUrl ? (
                <p className="p-8 text-center text-sm text-slate-400">Video not available.</p>
              ) : isYouTube ? (
                <div className="aspect-video w-full max-h-[min(72vh,80dvh)]">
                  {(() => {
                    const ytId = extractYouTubeId(playbackUrl);
                    if (!ytId) {
                      return (
                        <p className="p-4 text-center text-sm text-muted-foreground">
                          Invalid YouTube URL.
                        </p>
                      );
                    }
                    return (
                      <iframe
                        title={video.title}
                        src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`}
                        className="h-full w-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      />
                    );
                  })()}
                </div>
              ) : (
                <SecureStreamVideo
                  key={playbackUrl}
                  src={playbackUrl}
                  autoPlay
                  playsInline
                  preload="metadata"
                  style={{
                    aspectRatio: '16 / 9',
                    minHeight: 220,
                    maxHeight: 'min(72vh, 80dvh)',
                  }}
                />
              )}
            </div>
            <div className="flex items-center justify-between gap-2 border-t border-white/10 px-4 py-2 text-xs text-slate-400">
              <span className="inline-flex items-center gap-1.5">
                <VideoIcon className="h-3.5 w-3.5" />
                VISWAM OTT
              </span>
              {meta?.fileSizeBytes ? (
                <span className="font-medium text-slate-300">
                  File size: {sizeLabel}
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
