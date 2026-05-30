import { useState, useEffect } from 'react';
import { useRoute } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Play, 
  BookOpen,
  Target,
  Award,
  ArrowLeft,
  CalendarDays,
  Filter,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { subjectTheme } from '@/lib/gamification/constants';
import { ProgressRing } from '@/components/learning-ecosystem/ProgressRing';
import Navigation from '@/components/navigation';
import { ChapterJourney, StudentBottomNav, type ChapterQuiz } from '@/components/learning-ecosystem';
import type { ChapterCompletedDates, ChapterQuizPassed } from '@/lib/video-chapter-schedule';
import { API_BASE_URL } from '@/lib/api-config';
import StudentPageLoader from '@/components/student/StudentPageLoader';
import VideoModal from '@/components/video-modal';
import CalendarView from '@/components/student/calendar-view';
import { Link } from 'wouter';

interface Subject {
  _id: string;
  name: string;
  description: string;
  category: string;
  difficulty: string;
  duration: string;
  subjects: string[];
  color: string;
  icon: string;
  videos: Video[];
  quizzes: Quiz[];
  students: number;
  rating: number;
  progress: number;
}

interface Video {
  _id: string;
  title: string;
  description: string;
  duration: number;
  videoUrl: string;
  youtubeUrl?: string;
  isYouTubeVideo?: boolean;
  thumbnailUrl?: string;
  views: number;
  createdAt: string;
}

interface Quiz {
  _id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: string;
  duration: number;
  createdAt: string;
}

interface ContentItem {
  _id: string;
  title: string;
  description?: string;
  type: 'TextBook' | 'Workbook' | 'Material' | 'Video' | 'Audio';
  fileUrl: string;
  date: string;
  createdAt: string;
}

export default function SubjectContent() {
  const [, params] = useRoute('/subject/:id');
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'journey' | 'calendar'>('journey');
  const [subjectQuizzes, setSubjectQuizzes] = useState<ChapterQuiz[]>([]);
  const [chapterCompletedDates, setChapterCompletedDates] = useState<ChapterCompletedDates>({});
  const [chapterQuizPassed, setChapterQuizPassed] = useState<ChapterQuizPassed>({});
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [loadingContents, setLoadingContents] = useState(false);
  const [completedContentIds, setCompletedContentIds] = useState<Set<string>>(new Set());
  const [selectedContentType, setSelectedContentType] = useState<string | null>(null);

  useEffect(() => {
    if (params?.id) {
      fetchSubjectContent(params.id);
      // Load completed content from database and localStorage
      loadCompletedContentFromDB(params.id);
      loadCompletedContent(params.id);
    }
  }, [params?.id]);

  // Load completed content from database
  const loadCompletedContentFromDB = async (subjectId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/student/learning-progress?subjectId=${subjectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Get completed content IDs from database
          const completedIds = data.data.progressRecords
            .filter((record: any) => record.completed)
            .map((record: any) => record.contentId?._id || record.contentId);
          
          if (completedIds.length > 0) {
            setCompletedContentIds(new Set(completedIds));
            // Also sync to localStorage
            saveCompletedContent(subjectId, new Set(completedIds));
          }
        }
      }
    } catch (error) {
      console.error('Failed to load completed content from database:', error);
    }
  };

  // Load completed content from localStorage
  const loadCompletedContent = (subjectId: string) => {
    try {
      const stored = localStorage.getItem(`completed_content_${subjectId}`);
      if (stored) {
        const completedIds = JSON.parse(stored);
        setCompletedContentIds(new Set(completedIds));
      }
    } catch (error) {
      console.error('Failed to load completed content:', error);
    }
  };

  // Save completed content to localStorage
  const saveCompletedContent = (subjectId: string, completedIds: Set<string>) => {
    try {
      localStorage.setItem(`completed_content_${subjectId}`, JSON.stringify(Array.from(completedIds)));
    } catch (error) {
      console.error('Failed to save completed content:', error);
    }
  };

  // Calculate progress based on completed items
  const calculateProgress = (totalItems: number, completedItems: number): number => {
    if (totalItems === 0) return 0;
    return Math.round((completedItems / totalItems) * 100);
  };

  // Handle mark as done - save to database
  const handleMarkAsDone = async (contentId: string) => {
    const newCompleted = new Set(completedContentIds);
    const isCompleted = newCompleted.has(contentId);
    
    if (isCompleted) {
      newCompleted.delete(contentId);
    } else {
      newCompleted.add(contentId);
    }
    setCompletedContentIds(newCompleted);
    
    // Save to localStorage (for offline support)
    if (params?.id) {
      saveCompletedContent(params.id, newCompleted);
    }

    // Save to database
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/student/content-progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contentId: contentId,
          completed: !isCompleted, // Toggle completion status
          progress: !isCompleted ? 100 : 0
        })
      });

      if (response.ok) {
        console.log('✅ Learning progress saved to database');
      } else {
        console.error('Failed to save learning progress to database');
      }
    } catch (error) {
      console.error('Error saving learning progress:', error);
    }

    // Update subject progress
    const progress = calculateProgress(contents.length, newCompleted.size);
    setSubject(prev => prev ? { ...prev, progress } : prev);
  };

  const loadChapterProgress = async (subjectId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${API_BASE_URL}/api/student/video-chapter-progress`, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data?.[subjectId]) setChapterCompletedDates(json.data[subjectId]);
        if (json.quizPassedBySubject?.[subjectId]) setChapterQuizPassed(json.quizPassedBySubject[subjectId]);
      }
    } catch {
      /* ignore */
    }
  };

  const fetchSubjectContent = async (subjectId: string) => {
    try {
      const token = localStorage.getItem('authToken');
      const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
      const [subjectResponse, videosResponse, contentsResponse, quizzesResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/subjects/${subjectId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          }
        }),
        fetch(`${API_BASE_URL}/api/student/videos?subject=${encodeURIComponent(subjectId)}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
            'Content-Type': 'application/json',
          }
        }),
        fetch(`${API_BASE_URL}/api/student/asli-prep-content?subject=${encodeURIComponent(subjectId)}`, { headers }),
        fetch(`${API_BASE_URL}/api/student/quizzes`, { headers }),
      ]);
      void loadChapterProgress(subjectId);
      
      let subjectName = '';
      
      if (subjectResponse.ok) {
        const contentType = subjectResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const subjectData = await subjectResponse.json();
          setSubject(subjectData.subject);
          subjectName = subjectData.subject.name;
          console.log('Subject name:', subjectName);
        } else {
          console.warn('Subject response is not JSON, using fallback data');
          // Fallback data
          setSubject({
            _id: subjectId,
            name: 'Sample Subject',
            description: 'This is a sample subject for demonstration',
            category: 'Education',
            difficulty: 'Intermediate',
            duration: '2 hours',
            subjects: ['Math', 'Science'],
            color: 'bg-blue-100 text-blue-600',
            icon: '📚',
            videos: [],
            quizzes: [],
            students: 0,
            rating: 4.5,
            progress: 0
          });
          subjectName = 'Sample Subject';
        }
      } else {
        console.warn('Subject API failed, using fallback data');
        // Fallback data
        setSubject({
          _id: subjectId,
          name: 'Sample Subject',
          description: 'This is a sample subject for demonstration',
          category: 'Education',
          difficulty: 'Intermediate',
          duration: '2 hours',
          subjects: ['Math', 'Science'],
          color: 'bg-blue-100 text-blue-600',
          icon: '📚',
          videos: [],
          quizzes: [],
          students: 0,
          rating: 4.5,
          progress: 0
        });
        subjectName = 'Sample Subject';
      }
      
      // Attach subject-specific videos
      if (videosResponse.ok) {
        const vidCt = videosResponse.headers.get('content-type');
        if (vidCt && vidCt.includes('application/json')) {
          const videosData = await videosResponse.json();
          const videosList = (videosData.data || videosData.videos || videosData) as any[];
          console.log('📹 Videos fetched for subject:', {
            subjectId,
            videosCount: videosList.length,
            videos: videosList.map(v => ({ title: v.title, subjectId: v.subjectId }))
          });
          setSubject(prev => prev ? { ...prev, videos: videosList } as any : prev);
        } else {
          console.warn('⚠️ Videos response is not JSON');
          setSubject(prev => prev ? { ...prev, videos: [] } as any : prev);
        }
      } else {
        console.warn('⚠️ Videos API failed:', videosResponse.status, videosResponse.statusText);
        setSubject(prev => prev ? { ...prev, videos: [] } as any : prev);
      }

      // Fetch content for calendar view
      setLoadingContents(true);
      if (contentsResponse.ok) {
        const contentType = contentsResponse.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const contentsData = await contentsResponse.json();
          const contentsList = contentsData.data || contentsData || [];
          console.log('📚 Contents fetched:', contentsList.length);
          console.log('📚 Sample content item:', contentsList[0] ? {
            title: contentsList[0].title,
            date: contentsList[0].date,
            createdAt: contentsList[0].createdAt,
            dateType: typeof contentsList[0].date
          } : 'No content');
          setContents(contentsList);
          
          // Update progress after loading contents
          // Load completed items and calculate progress
          if (params?.id) {
            const stored = localStorage.getItem(`completed_content_${params.id}`);
            const completedIds = stored ? JSON.parse(stored) : [];
            const progress = calculateProgress(contentsList.length, completedIds.length);
            setSubject(prev => prev ? { ...prev, progress } : prev);
            setCompletedContentIds(new Set(completedIds));
          }
        }
      } else {
        console.warn('⚠️ Contents API failed:', contentsResponse.status);
        setContents([]);
      }
      setLoadingContents(false);

      if (quizzesResponse.ok) {
        const qJson = await quizzesResponse.json();
        const all = qJson.data || qJson || [];
        const forSubject = all.filter(
          (q: any) =>
            (q.subjectIds || []).map(String).includes(subjectId) ||
            (q.subjectId && String(q.subjectId) === subjectId),
        );
        setSubjectQuizzes(
          forSubject.map((q: any) => ({
            _id: q._id,
            title: q.title,
            hasAttempted: q.hasAttempted,
            lastScore: q.lastScore,
          })),
        );
      }

    } catch (error) {
      console.error('Failed to fetch subject content:', error);
      // Set fallback data on error
      setSubject({
        _id: subjectId,
        name: 'Sample Subject',
        description: 'This is a sample subject for demonstration',
        category: 'Education',
        difficulty: 'Intermediate',
        duration: '2 hours',
        subjects: ['Math', 'Science'],
        color: 'bg-blue-100 text-blue-600',
        icon: '📚',
        videos: [],
        quizzes: [],
        students: 0,
        rating: 4.5,
        progress: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
    setIsVideoModalOpen(true);
  };

  const handleCloseVideoModal = () => {
    setIsVideoModalOpen(false);
    setSelectedVideo(null);
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen': return BookOpen;
      case 'Target': return Target;
      case 'Award': return Award;
      default: return BookOpen;
    }
  };

  if (loading) {
    return <StudentPageLoader message="Loading subject content..." />;
  }

  if (!subject) {
    return (
      <>
        <Navigation />
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
          <div className="text-center">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Subject not found</h1>
            <Link href="/learning-paths">
              <Button
                variant="outline"
                className="border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
              >
                <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                Back to Learning Path
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  const Icon = getIcon(subject.icon);
  const theme = subjectTheme(subject.name);

  const journeyVideos = (contents.length ? contents : subject.videos || []).filter(
    (c: any) => String(c.type || 'Video').toLowerCase() === 'video',
  ) as any[];

  return (
    <div className="viswam-student-app">
      <Navigation />
      <div className="viswam-student-main w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 relative">
        
        
        <Link
          href="/learning-paths"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Learn
        </Link>

        <section className="eco-hero mb-6 p-5 sm:p-8 text-white">
          <div className="eco-hero-mesh" aria-hidden />
          <div className="relative z-10 flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 flex-1 items-start gap-4">
              <div
                className={cn(
                  'flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg',
                  theme.gradientClass,
                )}
              >
                <Icon className="h-7 w-7" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-widest text-amber-300/90">Subject</p>
                <h1 className="mt-1 text-2xl font-bold capitalize sm:text-3xl">{subject.name}</h1>
                {subject.description ? (
                  <p className="mt-1 max-w-lg text-sm text-white/75">{subject.description}</p>
                ) : null}
                <div className="mt-4 max-w-md">
                  <div className="mb-1.5 flex items-center justify-between text-xs font-medium text-white/80">
                    <span>Your progress</span>
                    <span>{subject.progress || 0}%</span>
                  </div>
                  <Progress value={subject.progress || 0} className="h-2 bg-white/20 [&>div]:bg-emerald-400" />
                </div>
              </div>
            </div>
            <ProgressRing percent={subject.progress || 0} color={theme.accent} />
          </div>
        </section>

        <div className="mb-6 flex rounded-xl border border-slate-200 bg-slate-100/80 p-1">
          <button
            type="button"
            onClick={() => setViewMode('journey')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
              viewMode === 'journey'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            <Play className="h-4 w-4" />
            Chapter journey
          </button>
          <button
            type="button"
            onClick={() => setViewMode('calendar')}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all',
              viewMode === 'calendar'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900',
            )}
          >
            <CalendarDays className="h-4 w-4" />
            Schedule
          </button>
        </div>

        {viewMode === 'journey' ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-sm">
          <ChapterJourney
            subjectId={params?.id || subject._id}
            videos={journeyVideos}
            quizzes={subjectQuizzes}
            completedVideoIds={completedContentIds}
            chapterCompletedDates={chapterCompletedDates}
            chapterQuizPassed={chapterQuizPassed}
            onPlayVideo={(v) => handleVideoClick(v as Video)}
          />
          </div>
        ) : (
        viewMode === 'calendar' ? (
          <div className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Your schedule</h2>
                <p className="text-sm text-slate-500">Homework and materials by date</p>
              </div>
              
              {/* Content Type Filter */}
              {contents.length > 0 && (
                <div className="flex items-center space-x-2">
                  {/* Get unique content types from contents */}
                  {(() => {
                    const uniqueTypes = Array.from(new Set(contents.map(c => c.type))).sort();
                    return (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" className="flex items-center space-x-2">
                            <Filter className="w-3 h-3 sm:w-4 sm:h-4" />
                            <span>
                              {selectedContentType ? `Filter: ${selectedContentType}` : 'Filter by Type'}
                            </span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => setSelectedContentType(null)}
                            className={!selectedContentType ? 'bg-blue-50' : ''}
                          >
                            All Types ({contents.length})
                          </DropdownMenuItem>
                          {uniqueTypes.map((type) => {
                            const count = contents.filter(c => c.type === type).length;
                            return (
                              <DropdownMenuItem
                                key={type}
                                onClick={() => setSelectedContentType(type)}
                                className={selectedContentType === type ? 'bg-blue-50' : ''}
                              >
                                {type} ({count})
                              </DropdownMenuItem>
                            );
                          })}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    );
                  })()}
                  
                  {selectedContentType && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedContentType(null)}
                      className="flex items-center space-x-1"
                    >
                      <X className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span>Clear</span>
                    </Button>
                  )}
                </div>
              )}
            </div>
            {loadingContents ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading content...</p>
              </div>
            ) : (
              <CalendarView 
                contents={selectedContentType 
                  ? contents.filter(c => c.type === selectedContentType)
                  : contents}
                onMarkAsDone={handleMarkAsDone}
                completedItems={Array.from(completedContentIds)}
              />
            )}
          </div>
        ) : null)}
      </div>

      {/* Video Modal */}
      <VideoModal
        isOpen={isVideoModalOpen}
        onClose={handleCloseVideoModal}
        video={selectedVideo ? {
          id: selectedVideo._id,
          title: selectedVideo.title,
          description: selectedVideo.description,
          duration: Math.floor(selectedVideo.duration / 60),
          subject: subject.name,
          videoUrl: selectedVideo.videoUrl,
          youtubeUrl: selectedVideo.youtubeUrl || selectedVideo.videoUrl,
          isYouTubeVideo: selectedVideo.isYouTubeVideo || false
        } : null}
      />
      <StudentBottomNav />
    </div>
  );
}
