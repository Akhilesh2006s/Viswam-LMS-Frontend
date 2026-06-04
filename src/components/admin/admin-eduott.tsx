import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearch } from 'wouter';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Play,
  Search,
  Video as VideoIcon,
  Radio,
  Eye,
  Users,
  Calendar,
  Loader2,
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api-config';
import { resolveContentDurationSeconds } from '@/lib/eduott-video-utils';
import { AdminOttAnalyticsPanel } from '@/components/admin/AdminOttAnalyticsPanel';
import { mapAdminRowToOttVideo, type AdminOttSourceRow } from '@/lib/ott/admin-map';
import type { OttVideo } from '@/lib/ott/types';
import { AdminOttFeaturedHero } from '@/components/admin/AdminOttFeaturedHero';
import { OttContentRow } from '@/components/viswam-ott/OttContentRow';
import { OttEmptyState } from '@/components/viswam-ott/OttEmptyState';
import { OttMonthlyQuotaCard } from '@/components/ott/OttMonthlyQuotaCard';
import { OttMobileDownloadBanner } from '@/components/ott/OttMobileDownloadBanner';
import { fetchAdminSchoolOttQuota, type SchoolOttQuota } from '@/lib/ott/quota-api';
import { useToast } from '@/hooks/use-toast';

interface LiveSession {
  _id: string;
  title: string;
  description?: string;
  streamer: { _id: string; fullName: string; email: string };
  status: 'scheduled' | 'live' | 'ended' | 'cancelled';
  hlsUrl?: string;
  scheduledTime?: string;
  scheduledStartTime?: string;
  subject?: { _id: string; name: string };
  classNumber?: string;
  viewerCount: number;
}

function mapOttRowToVideo(content: Record<string, unknown>): AdminOttSourceRow | null {
  const rawFileUrl = String(content.fileUrl || '');
  if (
    rawFileUrl.includes('youtube.com') ||
    rawFileUrl.includes('youtu.be') ||
    content.contentChannel !== 'ott'
  ) {
    return null;
  }

  const subjectName = (content.subject as { name?: string })?.name || 'Unknown Subject';
  const subjectId =
    (content.subject as { _id?: string })?._id || (content.subject as string) || '';
  const classNum =
    content.classNumber != null && String(content.classNumber).trim() !== ''
      ? String(content.classNumber).trim()
      : (content.subject as { classNumber?: string })?.classNumber != null
        ? String((content.subject as { classNumber?: string }).classNumber).trim()
        : undefined;

  const durationInSeconds = resolveContentDurationSeconds({
    duration: content.duration as number,
    durationSeconds: content.durationSeconds as number,
  });

  let videoFileUrl = rawFileUrl;
  if (videoFileUrl && !videoFileUrl.startsWith('http') && !videoFileUrl.startsWith('//')) {
    videoFileUrl = videoFileUrl.startsWith('/')
      ? `${API_BASE_URL}${videoFileUrl}`
      : `${API_BASE_URL}/${videoFileUrl}`;
  }

  return {
    _id: String(content._id || ''),
    title: String(content.title || 'Untitled Video'),
    description: String(content.description || ''),
    durationSeconds: durationInSeconds,
    videoUrl: videoFileUrl,
    fileUrl: videoFileUrl,
    thumbnailUrl: String(content.thumbnailUrl || ''),
    views: Number(content.views) || 0,
    createdAt: String(content.createdAt || content.date || new Date().toISOString()),
    subjectId: String(subjectId),
    subjectName,
    classNumber: classNum,
  };
}

export default function AdminEduOTT() {
  const search = useSearch();
  const { toast } = useToast();
  const [mode, setMode] = useState<'videos' | 'live'>('videos');
  const [schoolQuota, setSchoolQuota] = useState<SchoolOttQuota | null>(null);
  const [quotaLoading, setQuotaLoading] = useState(true);
  const [rawVideos, setRawVideos] = useState<AdminOttSourceRow[]>([]);
  const [liveSessions, setLiveSessions] = useState<LiveSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [videoClassFilter, setVideoClassFilter] = useState('all');
  const [videoSubjectFilter, setVideoSubjectFilter] = useState('all');
  const [sessionSearchTerm, setSessionSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const ottVideos = useMemo(() => rawVideos.map(mapAdminRowToOttVideo), [rawVideos]);

  useEffect(() => {
    setVideoSubjectFilter('all');
  }, [videoClassFilter]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setQuotaLoading(true);
      const q = await fetchAdminSchoolOttQuota();
      if (!cancelled) {
        setSchoolQuota(q);
        setQuotaLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const blockWebPlayback = useCallback(() => {
    toast({
      title: 'Mobile app only',
      description:
        'OTT videos are download-only in the VISWAM LMS mobile app. Streaming is not available on the website.',
    });
  }, [toast]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('authToken');
        if (!token) return;
        const response = await fetch(
          `${API_BASE_URL}/api/admin/curriculum/channel-content?channel=ott`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          },
        );
        if (!cancelled && response.ok) {
          const data = await response.json();
          const list = data.data || data || [];
          const rows = (Array.isArray(list) ? list : [])
            .map((c: Record<string, unknown>) => mapOttRowToVideo(c))
            .filter((v): v is AdminOttSourceRow => !!v);
          setRawVideos(rows);
        }
      } catch (e) {
        console.error('Failed to fetch OTT videos:', e);
        if (!cancelled) setRawVideos([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const openVideoById = useCallback(
    (videoId: string) => {
      const found = ottVideos.find((v) => v.id === videoId);
      if (found) blockWebPlayback();
    },
    [ottVideos, blockWebPlayback],
  );

  useEffect(() => {
    if (loading || !ottVideos.length) return;
    const q = search.startsWith('?') ? search.slice(1) : search;
    const watchId = new URLSearchParams(q).get('watch');
    if (watchId) openVideoById(watchId);
  }, [search, loading, ottVideos, openVideoById]);

  useEffect(() => {
    if (mode !== 'live') return;
    let cancelled = false;
    (async () => {
      try {
        setLoadingSessions(true);
        const token = localStorage.getItem('authToken');
        if (!token) return;
        const response = await fetch(`${API_BASE_URL}/api/admin/streams`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (!cancelled && response.ok) {
          const data = await response.json();
          setLiveSessions(data.data || data || []);
        }
      } catch (e) {
        console.error('Failed to fetch live sessions:', e);
        if (!cancelled) setLiveSessions([]);
      } finally {
        if (!cancelled) setLoadingSessions(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const videoClassOptions = useMemo(() => {
    const set = new Set<string>();
    ottVideos.forEach((v) => {
      if (v.classLabel) set.add(v.classLabel);
    });
    return Array.from(set).sort((a, b) => parseInt(a, 10) - parseInt(b, 10));
  }, [ottVideos]);

  const videoSubjectOptions = useMemo(() => {
    const names = new Set<string>();
    ottVideos.forEach((v) => {
      if (videoClassFilter !== 'all' && v.classLabel !== videoClassFilter) return;
      if (v.subjectName) names.add(v.subjectName);
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [ottVideos, videoClassFilter]);

  const filteredVideos = useMemo(() => {
    return ottVideos.filter((video) => {
      const matchesSearch =
        video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (video.description || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesClass = videoClassFilter === 'all' || video.classLabel === videoClassFilter;
      const matchesSubject =
        videoSubjectFilter === 'all' ||
        video.subjectName.toLowerCase() === videoSubjectFilter.toLowerCase();
      return matchesSearch && matchesClass && matchesSubject;
    });
  }, [ottVideos, searchTerm, videoClassFilter, videoSubjectFilter]);

  const featured = filteredVideos[0] || null;

  const subjectRows = useMemo(() => {
    const map = new Map<string, OttVideo[]>();
    for (const v of filteredVideos) {
      const key = v.subjectName || 'Other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(v);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filteredVideos]);

  const filteredSessions = useMemo(() => {
    return liveSessions.filter((session) => {
      const matchesSearch =
        session.title.toLowerCase().includes(sessionSearchTerm.toLowerCase()) ||
        (session.description || '').toLowerCase().includes(sessionSearchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || session.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [liveSessions, sessionSearchTerm, filterStatus]);

  return (
    <div className="viswam-ott viswam-ott-admin">
      <header className="ott-admin-topbar">
        <div className="ott-admin-topbar-brand">
          <span className="ott-admin-topbar-logo">Viswam OTT</span>
          <span className="ott-admin-topbar-tag">Catalog &amp; download quota</span>
        </div>
        <div className="ott-admin-mode-tabs">
          <button
            type="button"
            className={mode === 'videos' ? 'active' : ''}
            onClick={() => setMode('videos')}
          >
            <VideoIcon className="h-4 w-4" />
            On demand
          </button>
          <button
            type="button"
            className={mode === 'live' ? 'active' : ''}
            onClick={() => setMode('live')}
          >
            <Radio className="h-4 w-4" />
            Live
          </button>
        </div>
      </header>

      <div className="ott-admin-main px-4 sm:px-6 max-w-5xl mx-auto w-full space-y-4 pb-2">
        <OttMonthlyQuotaCard quota={schoolQuota} loading={quotaLoading} variant="admin" />
        <OttMobileDownloadBanner />
      </div>

      {mode === 'videos' ? (
        <>
          {loading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
            </div>
          ) : (
            <div className="ott-admin-main">
              <div className="ott-admin-feature-strip">
                <AdminOttFeaturedHero
                  featured={featured}
                  videoCount={filteredVideos.length}
                  onPlay={() => blockWebPlayback()}
                />
                <AdminOttAnalyticsPanel variant="light" compact />
              </div>

              <div className="ott-filters-wrap">
                <div className="ott-filter-panel space-y-3">
                  <div className="flex flex-col gap-4 lg:flex-row lg:flex-wrap lg:items-end">
                    <div className="flex-1 min-w-[200px] relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                      <Input
                        placeholder="Search titles, subjects…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 bg-white border-emerald-200/80 text-slate-800 placeholder:text-slate-400"
                      />
                    </div>
                    <Select value={videoClassFilter} onValueChange={setVideoClassFilter}>
                      <SelectTrigger className="w-full md:w-[180px] bg-white border-emerald-200/80 text-slate-800">
                        <SelectValue placeholder="All classes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All classes</SelectItem>
                        {videoClassOptions.map((c) => (
                          <SelectItem key={c} value={c}>
                            Class {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={videoSubjectFilter} onValueChange={setVideoSubjectFilter}>
                      <SelectTrigger className="w-full md:w-[200px] bg-white border-emerald-200/80 text-slate-800">
                        <SelectValue placeholder="All subjects" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All subjects</SelectItem>
                        {videoSubjectOptions.map((name) => (
                          <SelectItem key={name} value={name}>
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {filteredVideos.length === 0 ? (
                <OttEmptyState
                  message={
                    searchTerm || videoClassFilter !== 'all' || videoSubjectFilter !== 'all'
                      ? 'No videos match your filters.'
                      : 'Upload videos in Super Admin → Content Studio → Viswam OTT.'
                  }
                  hasFilters={
                    !!(searchTerm || videoClassFilter !== 'all' || videoSubjectFilter !== 'all')
                  }
                  onClearFilters={() => {
                    setSearchTerm('');
                    setVideoClassFilter('all');
                    setVideoSubjectFilter('all');
                  }}
                />
              ) : (
                <div className="ott-admin-catalog">
                  {filteredVideos.length > 1 ? (
                    <OttContentRow
                      title="Continue browsing"
                      subtitle={`${filteredVideos.length} lessons available`}
                      videos={filteredVideos}
                      onSelect={() => blockWebPlayback()}
                    />
                  ) : null}
                  {subjectRows.map(([subjectName, rows]) => (
                    <OttContentRow
                      key={subjectName}
                      title={subjectName}
                      subtitle={`Class ${rows[0]?.classLabel || '—'} · ${rows.length} lesson${rows.length !== 1 ? 's' : ''}`}
                      videos={rows}
                      onSelect={() => blockWebPlayback()}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      ) : (
        <div className="ott-admin-main ott-admin-main--live">
          <div className="ott-filter-panel">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input
                  placeholder="Search live sessions…"
                  value={sessionSearchTerm}
                  onChange={(e) => setSessionSearchTerm(e.target.value)}
                  className="pl-10 bg-white border-emerald-200/80 text-slate-800 placeholder:text-slate-400"
                />
              </div>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-[180px] bg-white border-emerald-200/80 text-slate-800">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="ended">Ended</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loadingSessions ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : filteredSessions.length === 0 ? (
            <OttEmptyState message="No live sessions match your search." hasFilters={!!sessionSearchTerm} />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {filteredSessions.map((session) => (
                <article
                  key={session._id}
                  className="ott-live-card rounded-xl border border-emerald-200/80 bg-white p-5 transition hover:border-emerald-400 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-emerald-950">{session.title}</h3>
                    <span className={`ott-live-badge ott-live-badge--${session.status}`}>
                      {session.status}
                    </span>
                  </div>
                  {session.description ? (
                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">{session.description}</p>
                  ) : null}
                  <div className="flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="inline-flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {session.streamer?.fullName || 'Host'}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5" />
                      {session.viewerCount || 0} viewers
                    </span>
                    {(session.scheduledTime || session.scheduledStartTime) && (
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        {new Date(
                          session.scheduledTime || session.scheduledStartTime || '',
                        ).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {session.status === 'live' ? (
                    <button
                      type="button"
                      className="ott-btn-play mt-4 w-full justify-center"
                      onClick={() => blockWebPlayback()}
                    >
                      <Play className="h-4 w-4" />
                      Watch in mobile app
                    </button>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
