import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, Film, TrendingUp } from "lucide-react";
import { fetchAdminOttAnalytics, type AdminOttAnalytics } from "@/lib/ott/api";
import { Skeleton } from "@/components/ui/skeleton";

export function AdminOttAnalyticsPanel() {
  const [data, setData] = useState<AdminOttAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAdminOttAnalytics()
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const metrics = [
    { icon: Users, label: "Active learners", value: `${data.activeStudents} / ${data.totalStudents}` },
    { icon: Clock, label: "Total watch time", value: `${data.totalWatchMinutes} min` },
    { icon: Film, label: "Videos completed", value: String(data.videosCompleted) },
    { icon: TrendingUp, label: "Engagement", value: `${data.engagementRate}%` },
  ];

  return (
    <Card className="mb-6 border-emerald-200/60 bg-gradient-to-br from-emerald-50/80 to-white dark:from-emerald-950/30 dark:to-slate-900">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">VISWAM OTT — School analytics</CardTitle>
        <p className="text-sm text-muted-foreground">
          Watch time and completion across your students on the streaming platform.
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-6">
          {metrics.map(({ icon: Icon, label, value }) => (
            <div key={label} className="rounded-lg border bg-background/80 p-3">
              <Icon className="h-4 w-4 text-emerald-600 mb-1" />
              <p className="text-xl font-bold">{value}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>
        {data.topLearners.length > 0 ? (
          <div>
            <p className="text-sm font-semibold mb-2">Top learners</p>
            <ul className="space-y-2 text-sm">
              {data.topLearners.slice(0, 5).map((s, i) => (
                <li
                  key={s.studentId}
                  className="flex justify-between rounded-md border px-3 py-2 bg-background/60"
                >
                  <span>
                    {i + 1}. {s.name}
                  </span>
                  <span className="text-muted-foreground">
                    {s.watchMinutes} min · {s.videosCompleted} done
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No OTT activity yet — students will appear here after watching lessons.</p>
        )}
      </CardContent>
    </Card>
  );
}
