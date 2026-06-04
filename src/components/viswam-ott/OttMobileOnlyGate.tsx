import { Smartphone } from "lucide-react";

/** Shown on web — OTT is mobile download-only (no streaming). */
export function OttMobileOnlyGate() {
  return (
    <div className="ott-mobile-only-gate flex min-h-[60vh] flex-col items-center justify-center px-6 py-16 text-center bg-[#F8F6F1]">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#F5EDDA]">
        <Smartphone className="h-8 w-8 text-[#1A3557]" />
      </div>
      <h1 className="text-2xl font-bold text-[#1A3557]">Viswam OTT is in the mobile app</h1>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-600">
        Streaming is not available on the website. Students and teachers download videos in the
        VISWAM LMS app and watch offline — like Netflix downloads. Your school admin sets monthly
        download limits (GB).
      </p>
      <p className="mt-6 text-xs text-slate-500">
        Install the app, sign in with the same account, and open the OTT tab to download content.
      </p>
    </div>
  );
}
