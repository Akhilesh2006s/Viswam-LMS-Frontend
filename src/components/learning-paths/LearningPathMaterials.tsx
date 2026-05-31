import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Play, FileText, Tv } from "lucide-react";
import PdfPreviewPanel from "@/components/shared/PdfPreviewPanel";
import {
  contentPlaybackUrl,
  getYouTubeEmbedUrl,
  isDocumentContent,
  isLearningPathVideoContent,
  isOttVideoContent,
  type LearningPathItem,
} from "@/lib/learning-path-content";
import { cn } from "@/lib/utils";

type Props = {
  items: LearningPathItem[];
  /** Opens Viswam OTT for an uploaded OTT video */
  onOpenOttVideo?: (item: LearningPathItem) => void;
  emptyMessage?: string;
  className?: string;
};

export function LearningPathMaterials({
  items,
  onOpenOttVideo,
  emptyMessage = "No textbooks or videos for this subject yet.",
  className,
}: Props) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewTitle, setPreviewTitle] = useState("");
  const [videoEmbedUrl, setVideoEmbedUrl] = useState<string | null>(null);
  const [videoTitle, setVideoTitle] = useState("");

  const documents = items.filter(isDocumentContent);
  const pathVideos = items.filter(isLearningPathVideoContent);
  const ottVideos = items.filter(isOttVideoContent);
  const allVideos = [...pathVideos, ...ottVideos];

  const closePreviews = () => {
    setPreviewUrl(null);
    setVideoEmbedUrl(null);
  };

  if (!documents.length && !allVideos.length) {
    return (
      <p className={cn("text-sm text-slate-500 text-center py-8", className)}>{emptyMessage}</p>
    );
  }

  return (
    <div className={cn("space-y-8", className)}>
      {documents.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">Textbooks</h2>
            <Badge variant="secondary" className="text-xs">
              {documents.length}
            </Badge>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {documents.map((doc) => {
              const url = contentPlaybackUrl(doc);
              return (
                <button
                  key={doc._id || doc.title}
                  type="button"
                  onClick={() => {
                    closePreviews();
                    setPreviewTitle(doc.title || "Textbook");
                    setPreviewUrl(url);
                  }}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-emerald-300 hover:shadow-md transition-all"
                >
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <FileText className="h-5 w-5 text-emerald-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 truncate">{doc.title || "Untitled"}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{doc.type || "TextBook"}</p>
                  </div>
                </button>
              );
            })}
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
        </section>
      ) : null}

      {allVideos.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Play className="h-5 w-5 text-violet-600" />
            <h2 className="text-lg font-semibold text-slate-900">Videos</h2>
            <Badge variant="secondary" className="text-xs">
              {allVideos.length}
            </Badge>
          </div>
          <p className="text-xs text-slate-500">
            Learning path videos play here. Viswam OTT uploads open in the Viswam OTT player.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {pathVideos.map((vid) => {
              const url = contentPlaybackUrl(vid);
              const embed = getYouTubeEmbedUrl(url);
              return (
                <button
                  key={vid._id || vid.title}
                  type="button"
                  onClick={() => {
                    setPreviewUrl(null);
                    setVideoTitle(vid.title || "Video");
                    setVideoEmbedUrl(embed || url);
                  }}
                  className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-violet-300 hover:shadow-md transition-all group"
                >
                  <div className="h-10 w-10 shrink-0 rounded-lg bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                    <Play className="h-5 w-5 text-violet-700" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-slate-900 truncate">{vid.title || "Video"}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Learning path</p>
                  </div>
                </button>
              );
            })}
            {ottVideos.map((vid) => (
              <button
                key={vid._id || vid.title}
                type="button"
                onClick={() => onOpenOttVideo?.(vid)}
                className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4 text-left hover:border-violet-300 hover:shadow-md transition-all group"
              >
                <div className="h-10 w-10 shrink-0 rounded-lg bg-violet-50 flex items-center justify-center group-hover:bg-violet-100 transition-colors">
                  <Tv className="h-5 w-5 text-violet-700" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-slate-900 truncate">{vid.title || "Video"}</p>
                  <p className="text-xs text-slate-500 mt-0.5">Viswam OTT</p>
                </div>
              </button>
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
              {videoEmbedUrl.includes("youtube.com/embed") ? (
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
        </section>
      ) : null}
    </div>
  );
}
