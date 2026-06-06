import { X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";

type Props = {
  open: boolean;
  title: string;
  playbackUrl: string | null;
  onClose: () => void;
};

/** Full-screen Netflix-style offline player for desktop OTT. */
export function OttOfflinePlayerModal({ open, title, playbackUrl, onClose }: Props) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[100vw] w-screen h-screen p-0 border-0 rounded-none bg-black [&>button]:hidden">
        <div className="relative flex h-full w-full flex-col bg-black">
          <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between bg-gradient-to-b from-black/80 to-transparent px-4 py-3">
            <p className="truncate text-sm font-medium text-white pr-4">{title}</p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-white/90 hover:bg-white/10"
              aria-label="Close player"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          {playbackUrl ? (
            <video
              key={playbackUrl}
              src={playbackUrl}
              controls
              autoPlay
              playsInline
              className="h-full w-full object-contain bg-black"
            />
          ) : (
            <div className="flex flex-1 items-center justify-center text-white/70 text-sm">
              Video file not found on this device.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
