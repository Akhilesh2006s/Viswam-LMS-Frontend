import { Smartphone } from "lucide-react";

/** Reminder that OTT playback/downloads happen in the mobile app. */
export function OttMobileDownloadBanner() {
  return (
    <div className="flex gap-3 rounded-xl border border-[#E0D9CE] bg-[#F5EDDA]/60 px-4 py-3 text-left">
      <Smartphone className="h-5 w-5 shrink-0 text-[#1A3557] mt-0.5" />
      <div>
        <p className="text-sm font-semibold text-[#1A3557]">Mobile download only</p>
        <p className="text-xs text-slate-600 mt-1 leading-relaxed">
          Students watch offline in the VISWAM LMS app after downloading. Streaming is not available on
          the website. Browse the catalog here; playback opens in the app only.
        </p>
      </div>
    </div>
  );
}
