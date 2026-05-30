import { Medal } from "lucide-react";

export type LeaderboardEntry = {
  rank: number;
  name: string;
  score?: number;
  isYou?: boolean;
};

type LeaderboardPanelProps = {
  entries: LeaderboardEntry[];
  yourRank?: number | null;
};

export function LeaderboardPanel({ entries, yourRank }: LeaderboardPanelProps) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-slate-900">Leaderboard</h3>
        {yourRank != null ? (
          <span className="text-sm font-semibold text-[var(--brand-emerald)]">You: #{yourRank}</span>
        ) : null}
      </div>
      <ul className="mt-4 space-y-2">
        {entries.length === 0 ? (
          <li className="py-6 text-center text-sm text-slate-500">Complete quizzes to appear on the leaderboard</li>
        ) : (
          entries.slice(0, 5).map((e) => (
            <li
              key={`${e.rank}-${e.name}`}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 ${
                e.isYou ? "bg-emerald-50 ring-1 ring-emerald-200/60" : "bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold ${
                    e.rank <= 3 ? "bg-[var(--brand-gold)]/20 text-amber-900" : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {e.rank <= 3 ? <Medal className="h-4 w-4" /> : e.rank}
                </span>
                <span className="font-medium text-slate-900">{e.name}</span>
              </div>
              {e.score != null ? (
                <span className="text-sm font-semibold text-[var(--brand-emerald)]">{e.score}%</span>
              ) : null}
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
