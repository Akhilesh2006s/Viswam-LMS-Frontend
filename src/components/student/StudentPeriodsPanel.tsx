import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, BookOpen, Play, FileText, Loader2, ExternalLink } from 'lucide-react';
import { fetchStudentPeriods, type SchoolPeriod } from '@/lib/periods';
import { contentPlaybackUrl, isVideoContent } from '@/lib/learning-path-content';
import { API_BASE_URL } from '@/lib/api-config';

export function StudentPeriodsPanel() {
  const [periods, setPeriods] = useState<SchoolPeriod[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentPeriods()
      .then(setPeriods)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Card className="bg-white rounded-xl shadow-md">
        <CardContent className="py-10 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        </CardContent>
      </Card>
    );
  }

  if (!periods.length) return null;

  const openContent = (item: SchoolPeriod['contents'][0]) => {
    const url = contentPlaybackUrl({
      fileUrl: item.fileUrl,
      fileUrls: item.fileUrls?.[0],
      type: item.type,
      contentChannel: item.contentChannel,
    });
    if (!url) return;
    const full = url.startsWith('http') ? url : `${API_BASE_URL}${url.startsWith('/') ? url : `/${url}`}`;
    window.open(full, '_blank', 'noopener,noreferrer');
  };

  return (
      <Card className="bg-white rounded-xl shadow-md border-l-4 border-l-emerald-500">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-600" />
            My periods
          </CardTitle>
          <p className="text-xs text-gray-600 mt-1">
            What to read or watch in each period today — no timetable times, just your school&apos;s plan.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {periods.map((period) => (
            <div
              key={period.id}
              className="rounded-lg border border-emerald-100 bg-gradient-to-br from-emerald-50/80 to-white p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="font-bold text-emerald-900">{period.label}</span>
                <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-800">
                  {period.contents.length} to do
                </Badge>
              </div>
              {period.contents.length === 0 ? (
                <p className="text-sm text-gray-500">Nothing assigned yet for this period.</p>
              ) : (
                <ul className="space-y-2">
                  {period.contents.map((item) => (
                    <li
                      key={item.id}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-white/90 border border-emerald-100 px-3 py-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        <p className="text-xs text-gray-500">
                          {[item.subjectName, item.type].filter(Boolean).join(' · ')}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 border-emerald-200 text-emerald-800 hover:bg-emerald-50"
                        onClick={() => openContent(item)}
                      >
                        {isVideoContent({
                          type: item.type,
                          contentChannel: item.contentChannel,
                          fileUrl: item.fileUrl,
                        }) ? (
                          <Play className="h-3.5 w-3.5 mr-1" />
                        ) : (
                          <FileText className="h-3.5 w-3.5 mr-1" />
                        )}
                        Open
                        <ExternalLink className="h-3 w-3 ml-1 opacity-60" />
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
  );
}
