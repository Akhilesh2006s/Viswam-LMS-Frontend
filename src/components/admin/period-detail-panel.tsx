import { useState, type ReactNode } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import PdfPreviewPanel from '@/components/shared/PdfPreviewPanel';
import {
  adminPremiumAccentBtn,
  adminPremiumOutlineBtn,
} from '@/components/admin/admin-ui';
import { extractPlainSubjectName } from '@/lib/subject-names';
import { normalizeContentFileUrl } from '@/lib/api-config';
import { cn } from '@/lib/utils';
import {
  contentPlaybackUrl,
  getYouTubeEmbedUrl,
  isDocumentContent,
  isLearningPathVideoContent,
  isOttVideoContent,
  type LearningPathItem,
} from '@/lib/learning-path-content';
import type { SchoolPeriod, PeriodContentItem } from '@/lib/periods';
import {
  BookOpen,
  CheckCircle2,
  Circle,
  Eye,
  FileText,
  Loader2,
  Play,
  RotateCcw,
  Tv,
} from 'lucide-react';

function toLearningItem(c: PeriodContentItem): LearningPathItem {
  return {
    _id: c.id,
    title: c.title,
    type: c.type,
    fileUrl: c.fileUrl,
    contentChannel: c.contentChannel,
  };
}

export function PeriodDetailPanel({
  period,
  doneSet,
  readOnly,
  busyId,
  onOpenOttVideo,
  onToggleItem,
  onMarkPeriod,
  onRestudy,
}: {
  period: SchoolPeriod;
  doneSet: Set<string>;
  readOnly: boolean;
  busyId: string | null;
  /** Viswam OTT uploads play on the OTT tab (same as Learning paths subject view). */
  onOpenOttVideo?: (item: LearningPathItem) => void;
  onToggleItem: (period: SchoolPeriod, contentId: string, completed: boolean) => void;
  onMarkPeriod: () => void;
  onRestudy: () => void;
}) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState('');
  const [videoEmbedUrl, setVideoEmbedUrl] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState('');

  const total = period.contents.length;
  const doneCount = period.completedCount ?? doneSet.size;
  const isComplete = !!period.isPeriodComplete;
  const canMark = !!period.canMarkPeriodComplete;

  const documents = period.contents.filter((c) => isDocumentContent(toLearningItem(c)));
  const pathVideos = period.contents.filter((c) => isLearningPathVideoContent(toLearningItem(c)));
  const ottVideos = period.contents.filter((c) => isOttVideoContent(toLearningItem(c)));

  const closePreviews = () => {
    setPreviewUrl(null);
    setVideoEmbedUrl(null);
  };

  const openDocument = (c: PeriodContentItem) => {
    const item = toLearningItem(c);
    const url = contentPlaybackUrl(item);
    if (!url) return;
    setVideoEmbedUrl(null);
    setPreviewTitle(c.title || 'Textbook');
    setPreviewUrl(url);
  };

  const openLearningPathVideo = (c: PeriodContentItem) => {
    const item = toLearningItem(c);
    const url = contentPlaybackUrl(item);
    if (!url) return;
    setPreviewUrl(null);
    setVideoTitle(c.title || 'Video');
    setVideoEmbedUrl(getYouTubeEmbedUrl(url) || normalizeContentFileUrl(url));
  };

  const openOttVideo = (c: PeriodContentItem) => {
    closePreviews();
    onOpenOttVideo?.(toLearningItem(c));
  };

  return (
    <div className="admin-period-detail-panel">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-5 py-4">
        <div className="flex items-start gap-3 min-w-0">
          {isComplete ? (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          ) : (
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-slate-400">
              <Circle className="h-5 w-5" />
            </div>
          )}
          <div>
            <h4 className="text-xl font-bold text-[var(--brand-navy)]">{period.label}</h4>
            <p className="text-sm text-slate-500 mt-0.5">
              {doneCount}/{total} items complete
              {period.description ? ` · ${period.description}` : ''}
            </p>
          </div>
        </div>
        {!readOnly && (
          <div className="flex flex-wrap gap-2">
            {canMark && (
              <Button
                className={adminPremiumAccentBtn}
                size="sm"
                disabled={busyId === `done-${period.id}`}
                onClick={onMarkPeriod}
              >
                {busyId === `done-${period.id}` ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                )}
                Mark period done
              </Button>
            )}
            {(isComplete || doneCount > 0) && (
              <Button
                variant="outline"
                size="sm"
                className={adminPremiumOutlineBtn}
                disabled={busyId === `restudy-${period.id}`}
                onClick={onRestudy}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Re-study
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="p-5 sm:p-6 space-y-8">
        {total === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No content in this period yet.</p>
        ) : (
          <>
            {documents.length > 0 ? (
              <MaterialsSection
                title="Textbooks"
                icon={BookOpen}
                iconClass="text-emerald-600"
                count={documents.length}
                hint="Textbooks open below on this page."
              >
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {documents.map((c) => (
                    <PeriodMaterialCard
                      key={c.id}
                      item={c}
                      variant="document"
                      done={doneSet.has(String(c.id))}
                      readOnly={readOnly}
                      periodComplete={isComplete}
                      busy={busyId === `${period.id}-${c.id}`}
                      onOpen={() => openDocument(c)}
                      onToggle={(completed) => onToggleItem(period, c.id, completed)}
                    />
                  ))}
                </div>
                {previewUrl ? (
                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50">
                    <div className="px-4 py-2 border-b border-slate-200 bg-white flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-800 truncate">{previewTitle}</p>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setPreviewUrl(null)}>
                        Close preview
                      </Button>
                    </div>
                    <PdfPreviewPanel fileUrl={previewUrl} title={previewTitle} className="min-h-[480px]" />
                  </div>
                ) : null}
              </MaterialsSection>
            ) : null}

            {pathVideos.length + ottVideos.length > 0 ? (
              <MaterialsSection
                title="Videos"
                icon={Play}
                iconClass="text-violet-600"
                count={pathVideos.length + ottVideos.length}
                hint="Learning path videos play below. Viswam OTT opens in the Viswam OTT player."
              >
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {pathVideos.map((c) => (
                    <PeriodMaterialCard
                      key={c.id}
                      item={c}
                      variant="learning-path"
                      done={doneSet.has(String(c.id))}
                      readOnly={readOnly}
                      periodComplete={isComplete}
                      busy={busyId === `${period.id}-${c.id}`}
                      onOpen={() => openLearningPathVideo(c)}
                      onToggle={(completed) => onToggleItem(period, c.id, completed)}
                    />
                  ))}
                  {ottVideos.map((c) => (
                    <PeriodMaterialCard
                      key={c.id}
                      item={c}
                      variant="ott"
                      done={doneSet.has(String(c.id))}
                      readOnly={readOnly}
                      periodComplete={isComplete}
                      busy={busyId === `${period.id}-${c.id}`}
                      onOpen={() => openOttVideo(c)}
                      onToggle={(completed) => onToggleItem(period, c.id, completed)}
                    />
                  ))}
                </div>
                {videoEmbedUrl ? (
                  <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-900">
                    <div className="px-4 py-2 border-b border-slate-700 bg-slate-800 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-white truncate">{videoTitle}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-slate-200 hover:text-white"
                        onClick={() => setVideoEmbedUrl(null)}
                      >
                        Close
                      </Button>
                    </div>
                    {videoEmbedUrl.includes('youtube.com/embed') ? (
                      <iframe
                        title={videoTitle}
                        src={videoEmbedUrl}
                        className="w-full aspect-video min-h-[360px]"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    ) : (
                      <video src={videoEmbedUrl} controls className="w-full max-h-[480px]" />
                    )}
                  </div>
                ) : null}
              </MaterialsSection>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function MaterialsSection({
  title,
  icon: Icon,
  iconClass,
  count,
  hint,
  children,
}: {
  title: string;
  icon: typeof BookOpen;
  iconClass: string;
  count: number;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Icon className={cn('h-5 w-5', iconClass)} />
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <Badge variant="secondary" className="text-xs">
          {count}
        </Badge>
      </div>
      {hint ? <p className="text-xs text-slate-500">{hint}</p> : null}
      {children}
    </section>
  );
}

function PeriodMaterialCard({
  item,
  variant,
  done,
  readOnly,
  periodComplete,
  busy,
  onOpen,
  onToggle,
}: {
  item: PeriodContentItem;
  variant: 'document' | 'learning-path' | 'ott';
  done: boolean;
  readOnly: boolean;
  periodComplete: boolean;
  busy: boolean;
  onOpen: () => void;
  onToggle: (completed: boolean) => void;
}) {
  const Icon = variant === 'document' ? FileText : variant === 'ott' ? Tv : Play;
  const iconBg =
    variant === 'document' ? 'bg-emerald-50 text-emerald-700' : 'bg-violet-50 text-violet-700';
  const sublabel =
    variant === 'ott'
      ? 'Viswam OTT'
      : variant === 'learning-path'
        ? 'Learning path'
        : item.type || 'Material';

  return (
    <div className={cn('admin-period-material-card', done && 'admin-period-material-card-done')}>
      <div className="flex items-start gap-3 p-4">
        <div
          className={cn('h-10 w-10 shrink-0 rounded-lg flex items-center justify-center', iconBg)}
        >
          <Icon className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-slate-900 truncate">{item.title}</p>
          <p className="text-xs text-slate-500 mt-0.5">
            {[extractPlainSubjectName(item.subjectName || ''), item.classNumber ? `Class ${item.classNumber}` : null]
              .filter(Boolean)
              .join(' · ')}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{sublabel}</p>
        </div>
        {done ? (
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
        ) : (
          <Circle className="h-5 w-5 text-slate-300 shrink-0" />
        )}
      </div>
      <div className="flex border-t border-slate-100">
        <Button
          type="button"
          variant="ghost"
          className="flex-1 rounded-none h-10 text-sm"
          onClick={onOpen}
        >
          <Eye className="h-3.5 w-3.5 mr-1" />
          Open
        </Button>
        {!readOnly && !periodComplete ? (
          <Button
            type="button"
            variant={done ? 'ghost' : 'default'}
            className={cn(
              'flex-1 rounded-none h-10 text-sm border-l border-slate-100',
              !done && adminPremiumAccentBtn,
            )}
            disabled={busy}
            onClick={() => onToggle(!done)}
          >
            {busy ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : done ? (
              'Undo'
            ) : (
              'Mark done'
            )}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
