import { useState } from "react";
import { Link } from "wouter";
import { Download, Trash2, HardDrive } from "lucide-react";
import { getDownloads, removeDownload, type OttDownloadItem } from "@/lib/ott/storage";
import { OttTopBar } from "@/components/viswam-ott/OttTopBar";
import { OttBottomNav } from "@/components/viswam-ott/OttBottomNav";

export default function EduOTTDownloadsPage() {
  const [items, setItems] = useState<OttDownloadItem[]>(() => getDownloads());

  const refresh = () => setItems(getDownloads());

  return (
    <div className="viswam-ott">
      <OttTopBar showBack backHref="/edu-ott" />
      <main className="viswam-ott-main p-4">
        <div className="mb-6 flex items-center gap-3 rounded-xl border border-white/10 bg-slate-800/50 p-4">
          <HardDrive className="h-8 w-8 text-emerald-400" />
          <div>
            <p className="font-bold text-white">Download center</p>
            <p className="text-xs text-slate-400">{items.length} saved · local browser storage</p>
          </div>
        </div>

        {items.length === 0 ? (
          <p className="text-center text-sm text-slate-400 py-12">
            Download videos from the player (non-YouTube lessons). They appear here for quick access.
          </p>
        ) : (
          <ul className="space-y-3">
            {items.map((item) => (
              <li
                key={item.videoId}
                className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-800/40 p-3"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white line-clamp-1">{item.title}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(item.addedAt).toLocaleDateString()}
                  </p>
                </div>
                <a
                  href={item.url}
                  download
                  className="rounded-lg bg-emerald-600 p-2 text-white hover:bg-emerald-500"
                >
                  <Download className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  className="rounded-lg p-2 text-slate-400 hover:bg-white/10"
                  onClick={() => {
                    removeDownload(item.videoId);
                    refresh();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <Link href="/edu-ott" className="mt-6 block text-center text-sm text-emerald-400">
          Browse more on VISWAM OTT
        </Link>
      </main>
      <OttBottomNav />
    </div>
  );
}
