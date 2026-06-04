import { Button } from "@/components/ui/button";
import { formatOttBytes, quotaUsedPercent, type SchoolOttQuota } from "@/lib/ott/quota-api";
import { HardDrive, RotateCcw } from "lucide-react";

type Props = {
  quota: SchoolOttQuota | null;
  loading?: boolean;
  /** School admin: read-only. Super admin: can show reset. */
  variant?: "admin" | "super-admin";
  onReset?: () => void;
  resetting?: boolean;
};

export function OttMonthlyQuotaCard({
  quota,
  loading,
  variant = "admin",
  onReset,
  resetting,
}: Props) {
  if (loading) {
    return (
      <div className="rounded-xl border border-[#E0D9CE] bg-white p-4 text-sm text-slate-500">
        Loading monthly download quota…
      </div>
    );
  }

  if (!quota) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        Quota data unavailable. Ensure the backend is running and OTT is enabled for this school.
      </div>
    );
  }

  const pct = quotaUsedPercent(quota);
  const isAdmin = variant === "admin";

  return (
    <div className="rounded-xl border border-[#E0D9CE] bg-white p-4 shadow-sm space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#F5EDDA]">
          <HardDrive className="h-5 w-5 text-[#B8973A]" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-[#1A3557]">Monthly download quota</h3>
          <p className="text-xs text-slate-600 mt-0.5">
            {isAdmin
              ? `Set by super admin (platform default ${quota.schoolMonthlyDownloadGB} GB). Resets each calendar month.`
              : `Calendar month ${quota.monthKey} · Students download in the mobile app only.`}
          </p>
        </div>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-[#F2EFE8]">
        <div
          className="h-full rounded-full bg-[#1A3557] transition-all duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs font-semibold text-slate-600">{pct.toFixed(0)}% of school quota used</p>

      <div className="grid gap-2 sm:grid-cols-3 text-sm">
        <div className="rounded-lg bg-[#F8F6F1] px-3 py-2 border border-[#E0D9CE]">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Total</p>
          <p className="font-bold text-[#1A3557]">{quota.schoolMonthlyDownloadGB} GB</p>
        </div>
        <div className="rounded-lg bg-[#F8F6F1] px-3 py-2 border border-[#E0D9CE]">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Downloaded</p>
          <p className="font-bold text-[#1A3557]">{formatOttBytes(quota.schoolBytesUsed)}</p>
        </div>
        <div className="rounded-lg bg-[#EDF7F2] px-3 py-2 border border-emerald-200">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Remaining</p>
          <p className="font-bold text-[#1E7B52]">{formatOttBytes(quota.schoolBytesRemaining)}</p>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Downloads: {quota.downloadsEnabled === false ? "Disabled" : "Enabled"}
        {quota.defaultStudentMonthlyDownloadGB
          ? ` · Default per-student cap: ${quota.defaultStudentMonthlyDownloadGB} GB`
          : ""}
      </p>

      {variant === "super-admin" && onReset ? (
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="w-full sm:w-auto"
          disabled={resetting}
          onClick={onReset}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          {resetting ? "Resetting…" : "Reset quota for this month"}
        </Button>
      ) : null}

      {isAdmin ? (
        <p className="text-xs text-slate-500 border-t border-[#E0D9CE] pt-2">
          To change the GB limit or reset usage, contact your platform super admin (Viswam OTT → School
          access).
        </p>
      ) : null}
    </div>
  );
}
