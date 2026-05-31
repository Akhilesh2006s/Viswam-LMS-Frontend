import { useState, useEffect, useRef } from 'react';
import { useRoute, useLocation, useSearch } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import AdminSubjectContentSkeleton from '@/components/admin/AdminSubjectContentSkeleton';
import { LearningPathMaterials } from '@/components/learning-paths/LearningPathMaterials';
import { API_BASE_URL } from '@/lib/api-config';
import {
  filterBySubjectIds,
  mergeLearningPathItems,
  viswamOttAdminUrl,
  type LearningPathItem,
} from '@/lib/learning-path-content';

interface ContentItem {
  _id: string;
  title: string;
  description?: string;
  type: string;
  fileUrl: string;
  contentChannel?: string;
  date: string;
  createdAt: string;
}

interface Subject {
  _id: string;
  name: string;
  description?: string;
}

export default function AdminSubjectContent() {
  const [, params] = useRoute('/admin/subject/:id');
  const [, setLocation] = useLocation();
  const search = useSearch();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const fetchGenRef = useRef(0);

  useEffect(() => {
    if (!params?.id) return;
    const q = search.startsWith('?') ? search.slice(1) : search;
    const mergeParam = new URLSearchParams(q).get('merge');
    const mergeIds = mergeParam
      ? mergeParam
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean)
      : [];
    void fetchSubjectContent(params.id, mergeIds);
  }, [params?.id, search]);

  const fetchSubjectContent = async (subjectId: string, mergeSubjectIds: string[]) => {
    const fetchId = ++fetchGenRef.current;
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      const subjectIds = Array.from(new Set([subjectId, ...mergeSubjectIds]));

      const subjectPromise = fetch(`${API_BASE_URL}/api/subjects/${subjectId}`, { headers });
      const contentPromises = subjectIds.map((id) =>
        fetch(`${API_BASE_URL}/api/admin/learning-paths/content?subject=${encodeURIComponent(id)}`, {
          headers,
        }),
      );

      const [subjectResponse, ...contentResponses] = await Promise.all([
        subjectPromise,
        ...contentPromises,
      ]);

      if (fetchId !== fetchGenRef.current) return;

      if (subjectResponse.ok) {
        const contentType = subjectResponse.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const subjectData = await subjectResponse.json();
          setSubject(subjectData.subject || { _id: subjectId, name: subjectData.name || 'Subject' });
        } else {
          setSubject({ _id: subjectId, name: 'Subject' });
        }
      } else {
        setSubject({ _id: subjectId, name: 'Subject' });
      }

      const lists: LearningPathItem[][] = [];
      for (const lpRes of contentResponses) {
        if (lpRes.ok) {
          const j = await lpRes.json();
          const rows = j.data || j || [];
          if (Array.isArray(rows)) lists.push(rows);
        }
      }

      let merged = mergeLearningPathItems(...lists) as ContentItem[];

      if (!merged.length) {
        const fallbackRes = await fetch(`${API_BASE_URL}/api/admin/learning-paths/content`, { headers });
        if (fetchId !== fetchGenRef.current) return;
        if (fallbackRes.ok) {
          const j = await fallbackRes.json();
          const all = (j.data || j || []) as LearningPathItem[];
          merged = filterBySubjectIds(all, subjectIds) as ContentItem[];
        }
      }

      setContents(merged);
    } catch (error) {
      console.error('Failed to fetch subject content:', error);
      if (fetchId === fetchGenRef.current) {
        setSubject({ _id: params?.id || '', name: 'Subject' });
        setContents([]);
      }
    } finally {
      if (fetchId === fetchGenRef.current) {
        setLoading(false);
      }
    }
  };

  const openViswamOtt = (item: LearningPathItem) => {
    const id = String(item._id || '');
    setLocation(viswamOttAdminUrl(id, params?.id));
  };

  if (loading) {
    return <AdminSubjectContentSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-sky-50/80 to-teal-50/50">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation('/admin/dashboard?tab=learning-paths')}
            className="mb-4"
          >
            <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
            Back to Learning Paths
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{subject?.name || 'Subject'}</h1>
          {subject?.description ? (
            <p className="text-gray-600 mt-2">{subject.description}</p>
          ) : null}
        </div>

        <Card className="bg-white/90 backdrop-blur-xl shadow-lg border border-slate-200/80">
          <CardHeader>
            <CardTitle className="text-xl sm:text-2xl font-bold">Learning materials</CardTitle>
            <p className="text-sm text-slate-600 mt-1">
              Textbooks and learning path videos open here. Viswam OTT uploads open in the Viswam OTT player.
            </p>
          </CardHeader>
          <CardContent>
            <LearningPathMaterials
              items={contents}
              onOpenOttVideo={openViswamOtt}
              emptyMessage="No textbooks or videos for this subject yet. Upload in Super Admin → Content Studio."
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
