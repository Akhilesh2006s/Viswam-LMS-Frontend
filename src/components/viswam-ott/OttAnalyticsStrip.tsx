import { useEffect, useState } from "react";
import { Clock, Film, Flame, TrendingUp } from "lucide-react";
import { fetchStudentOttAnalytics, type StudentOttAnalytics } from "@/lib/ott/api";

export function OttAnalyticsStrip() {
  const [stats, setStats] = useState<StudentOttAnalytics | null>(null);

  useEffect(() => {
    fetchStudentOttAnalytics().then(setStats);
  }, []);

  if (!stats) return null;

  const items = [
    { icon: Clock, label: "Watch time", value: `${stats.totalWatchMinutes} min` },
    { icon: Film, label: "Completed", value: String(stats.videosCompleted) },
    { icon: TrendingUp, label: "Completion", value: `${stats.completionRate}%` },
    { icon: Flame, label: "Streak", value: `${stats.streak ?? 0} days` },
  ];

  return (
    <section className="mx-4 mb-6 rounded-xl border border-emerald-500/20 bg-gradient-to-r from-slate-900/90 to-emerald-950/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-400/90">
        Your learning report
      </p>
      <p className="mt-0.5 text-xs text-slate-400">
        Share this screen with parents to show watch time and progress on VISWAM OTT.
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {items.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-lg bg-black/25 px-3 py-2">
            <Icon className="mb-1 h-4 w-4 text-emerald-400" />
            <p className="text-lg font-bold text-white">{value}</p>
            <p className="text-[10px] text-slate-400">{label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
