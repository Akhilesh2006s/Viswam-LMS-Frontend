import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import Navigation from "@/components/navigation";
import { 
  BookOpen, 
  Clock, 
  Users, 
  Star,
  Play,
  CheckCircle,
  ArrowRight,
  Target,
  Award,
  FileText,
  BarChart3,
  BookOpen as BookIcon,
  User,
  Gamepad2,
  Calculator,
  Atom,
  FlaskConical,
  Microscope,
  Loader2,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useState, useEffect, useMemo } from "react";
import { LearningRoadmap, StudentBottomNav, SubjectJourneyCard, type RoadmapStage } from "@/components/learning-ecosystem";
import { API_BASE_URL } from "@/lib/api-config";
import { getStudentDisplayName } from "@/lib/auth-utils";

export default function LearningPaths() {
  const [, setLocation] = useLocation();
  const [user, setUser] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [activeTab, setActiveTab] = useState<'subjects' | 'quizzes'>('subjects');
  const [quizzes, setQuizzes] = useState<any[]>([]);
  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true);
  const [isNavigatingToSubject, setIsNavigatingToSubject] = useState(false);

  const prefetchSubjectPage = () => {
    void import("@/pages/subject-content");
  };

  const abacusSubject = useMemo(
    () => subjects.find((s) => String(s.name || "").toLowerCase().includes("abacus")),
    [subjects],
  );

  const abacusRoadmapStages: RoadmapStage[] = useMemo(() => {
    const overall = Number(user?.overallProgress ?? 0);
    const stage1 = Math.min(100, overall * 3);
    const stage2 = overall > 33 ? Math.min(100, (overall - 33) * 3) : 0;
    const stage3 = overall > 66 ? Math.min(100, (overall - 66) * 3) : 0;
    return [
      {
        id: "abacus-beginner",
        title: "Abacus Beginner",
        subtitle: "Bead basics & number sense",
        progress: stage1,
        locked: false,
      },
      {
        id: "abacus-intermediate",
        title: "Abacus Intermediate",
        subtitle: "Speed drills & mental math",
        progress: stage2,
        locked: stage1 < 100,
      },
      {
        id: "abacus-advanced",
        title: "Abacus Advanced",
        subtitle: "Competitions & mastery",
        progress: stage3,
        locked: stage2 < 100,
      },
    ];
  }, [user?.overallProgress]);

  const handleSubjectClick = (subjectId: string) => {
    setIsNavigatingToSubject(true);
    setLocation(`/subject/${subjectId}`);
  };

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) {
          console.log('No auth token found');
          setUser({ 
            fullName: "Student", 
            email: "student@example.com", 
            age: 18, 
            educationStream: "JEE" 
          });
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const userData = await response.json();
            setUser(userData.user);
          } else {
            console.warn('User response is not JSON, using fallback data');
            setUser({ 
              fullName: "Student", 
              email: "student@example.com", 
              age: 18, 
              educationStream: "JEE" 
            });
          }
        } else {
          console.warn('User API failed, using fallback data');
          setUser({ 
            fullName: "Student", 
            email: "student@example.com", 
            age: 18, 
            educationStream: "JEE" 
          });
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        // Fallback to mock data
        setUser({ 
          fullName: "Student", 
          email: "student@example.com", 
          age: 18, 
          educationStream: "JEE" 
        });
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUser();
  }, []);

  // Fetch subjects and their content
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setIsLoadingSubjects(true);
        
        // Fetch subjects from student endpoint (gets board-specific subjects)
        const token = localStorage.getItem('authToken');
        const subjectsResponse = await fetch(`${API_BASE_URL}/api/student/subjects`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (subjectsResponse.ok) {
          const contentType = subjectsResponse.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const subjectsData = await subjectsResponse.json();
            
            console.log('📥 API Response:', subjectsData);
            
            // Handle all possible response formats
            let subjectsArray = [];
            
            if (subjectsData.subjects && Array.isArray(subjectsData.subjects)) {
              subjectsArray = subjectsData.subjects;
            } else if (subjectsData.data && Array.isArray(subjectsData.data)) {
              subjectsArray = subjectsData.data;
            } else if (Array.isArray(subjectsData)) {
              subjectsArray = subjectsData;
            } else if (subjectsData.success && subjectsData.subjects && Array.isArray(subjectsData.subjects)) {
              subjectsArray = subjectsData.subjects;
            } else if (subjectsData.success && subjectsData.data && Array.isArray(subjectsData.data)) {
              subjectsArray = subjectsData.data;
            }
            
            console.log(`📚 Extracted ${subjectsArray.length} subjects`);
            if (subjectsArray.length > 0) {
              console.log('First subject:', {
                name: subjectsArray[0].name,
                teachers: subjectsArray[0].teachers,
                teacherCount: subjectsArray[0].teacherCount
              });
            }
            
            if (!Array.isArray(subjectsArray) || subjectsArray.length === 0) {
              setSubjects([]);
              setIsLoadingSubjects(false);
              return;
            }

            // Show subjects immediately to avoid UI blank while enrichment calls run.
            const baseSubjects = subjectsArray.map((subject: any) => ({
              ...subject,
              videos: [],
              quizzes: [],
              assessments: [],
              totalContent: 0
            }));
            const uniqueBaseSubjects = baseSubjects.filter((subject, index, self) => {
              const subjectId = subject._id || subject.id;
              return index === self.findIndex((s: any) => (s._id || s.id) === subjectId);
            });
            setSubjects(uniqueBaseSubjects);
            setIsLoadingSubjects(false);
            
            // Fetch content for each subject - use Promise.allSettled to ensure all subjects are included
            const subjectsWithContentResults = await Promise.allSettled(
              subjectsArray.map(async (subject: any) => {
                try {
                  const subjectId = subject._id || subject.id || subject.name;
                  
                  // Fetch videos for this subject (from teacher-created content)
                  let videos = [];
                  try {
                    const videosResponse = await fetch(`${API_BASE_URL}/api/student/videos?subject=${encodeURIComponent(subjectId)}`, {
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'Content-Type': 'application/json',
                      }
                    });
                    
                    if (videosResponse.ok) {
                      const videosData = await videosResponse.json();
                      videos = videosData.data || videosData.videos || videosData || [];
                      if (!Array.isArray(videos)) videos = [];
                    }
                  } catch (videoError) {
                    videos = [];
                  }

                  // Fetch assessments/quizzes for this subject (from teacher-created content)
                  let assessments = [];
                  try {
                    const assessmentsResponse = await fetch(`${API_BASE_URL}/api/student/assessments?subject=${encodeURIComponent(subjectId)}`, {
                      headers: {
                        'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
                        'Content-Type': 'application/json',
                      }
                    });
                    
                    if (assessmentsResponse.ok) {
                      const assessmentsData = await assessmentsResponse.json();
                      assessments = assessmentsData.data || assessmentsData.assessments || assessmentsData.quizzes || assessmentsData || [];
                      if (!Array.isArray(assessments)) assessments = [];
                    }
                  } catch (assessmentError) {
                    assessments = [];
                  }

                  const totalContent = videos.length + assessments.length;

                  return {
                    ...subject,
                    videos: videos,
                    quizzes: assessments,
                    assessments: assessments,
                    totalContent: totalContent
                  };
                } catch (error) {
                  return {
                    ...subject,
                    videos: [],
                    quizzes: [],
                    assessments: [],
                    totalContent: 0
                  };
                }
              })
            );
            
            // Extract all subjects (both fulfilled and rejected)
            const subjectsWithContent = subjectsWithContentResults.map((result, index) => {
              if (result.status === 'fulfilled') {
                return result.value;
              } else {
                const subject = subjectsArray[index];
                return {
                  ...subject,
                  videos: [],
                  quizzes: [],
                  assessments: [],
                  totalContent: 0
                };
              }
            });
            
            // Filter out any undefined/null subjects and ensure unique
            const validSubjects = subjectsWithContent.filter((s: any) => s && (s.name || s._id || s.id));
            const uniqueSubjects = validSubjects.filter((subject, index, self) => {
              const subjectId = subject._id || subject.id;
              return index === self.findIndex((s: any) => (s._id || s.id) === subjectId);
            });
            
            setSubjects(uniqueSubjects);
          } else {
            console.warn('⚠️ Subjects response is not JSON');
            console.warn('Response status:', subjectsResponse.status);
            console.warn('Response headers:', Object.fromEntries(subjectsResponse.headers.entries()));
            // Fallback subjects data
            setSubjects([
              {
                _id: '1',
                name: 'Mathematics',
                description: 'Advanced mathematics concepts',
                category: 'STEM',
                difficulty: 'Intermediate',
                duration: '3 hours',
                subjects: ['Algebra', 'Calculus'],
                color: 'bg-blue-100 text-blue-600',
                icon: '📐',
                videos: [],
                quizzes: [],
                assessments: [],
                students: 150,
                rating: 4.5,
                progress: 0,
                totalContent: 0
              },
              {
                _id: '2',
                name: 'Physics',
                description: 'Physics fundamentals',
                category: 'STEM',
                difficulty: 'Advanced',
                duration: '4 hours',
                subjects: ['Mechanics', 'Thermodynamics'],
                color: 'bg-blue-100 text-blue-600',
                icon: '⚛️',
                videos: [],
                quizzes: [],
                assessments: [],
                students: 120,
                rating: 4.3,
                progress: 0,
                totalContent: 0
              }
            ]);
          }
        } else {
          console.warn('Subjects API failed, using fallback data');
          // Fallback subjects data
          setSubjects([
            {
              _id: '1',
              name: 'Mathematics',
              description: 'Advanced mathematics concepts',
              category: 'STEM',
              difficulty: 'Intermediate',
              duration: '3 hours',
              subjects: ['Algebra', 'Calculus'],
              color: 'bg-blue-100 text-blue-600',
              icon: '📐',
              videos: [],
              quizzes: [],
              assessments: [],
              students: 150,
              rating: 4.5,
              progress: 0,
              totalContent: 0
            },
            {
              _id: '2',
              name: 'Physics',
              description: 'Physics fundamentals',
              category: 'STEM',
              difficulty: 'Advanced',
              duration: '4 hours',
              subjects: ['Mechanics', 'Thermodynamics'],
              color: 'bg-blue-100 text-blue-600',
              icon: '⚛️',
              videos: [],
              quizzes: [],
              assessments: [],
              students: 120,
              rating: 4.3,
              progress: 0,
              totalContent: 0
            }
          ]);
        }
      } catch (error) {
        const err = error as Error;
        console.error('❌ ERROR fetching subjects:', error);
        console.error('Error details:', {
          message: err?.message || 'Unknown error',
          stack: err?.stack,
          name: err?.name || 'UnknownError'
        });
        
        // Try to show subjects even if there's an error - maybe API is down but cache works?
        console.log('Attempting fallback...');
        
        // Fallback subjects data
        setSubjects([
          {
            _id: '1',
            name: 'Mathematics',
            description: 'Advanced mathematics concepts',
            category: 'STEM',
            difficulty: 'Intermediate',
            duration: '3 hours',
            subjects: ['Algebra', 'Calculus'],
            color: 'bg-blue-100 text-blue-600',
            icon: '📐',
            videos: [],
            quizzes: [],
            assessments: [],
            students: 150,
            rating: 4.5,
            progress: 0,
            totalContent: 0
          },
          {
            _id: '2',
            name: 'Physics',
            description: 'Physics fundamentals',
            category: 'STEM',
            difficulty: 'Advanced',
            duration: '4 hours',
            subjects: ['Mechanics', 'Thermodynamics'],
            color: 'bg-blue-100 text-blue-600',
            icon: '⚛️',
            videos: [],
            quizzes: [],
            assessments: [],
            students: 120,
            rating: 4.3,
            progress: 0,
            totalContent: 0
          }
        ]);
      } finally {
        setIsLoadingSubjects(false);
      }
    };

    fetchSubjects();
  }, []);

  // Fetch assigned quizzes
  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setIsLoadingQuizzes(true);
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/student/quizzes`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setQuizzes(data.data || []);
        } else {
          setQuizzes([]);
        }
      } catch (error) {
        console.error('Failed to fetch quizzes:', error);
        setQuizzes([]);
      } finally {
        setIsLoadingQuizzes(false);
      }
    };

    fetchQuizzes();
  }, []);

  const recommendedPaths = [
    {
      id: "5",
      title: "Play Games",
      description: "Engage in fun educational games to enhance your learning experience",
      duration: "Coming Soon",
      students: 0,
      rating: 0,
      subjects: [],
      difficulty: "Coming Soon",
      color: "bg-blue-100 text-blue-600",
      icon: Gamepad2,
      isComingSoon: true
    }
  ];

  return (
    <div className="viswam-student-app">
      <Navigation />
      {isNavigatingToSubject && (
        <div
          className="fixed inset-0 z-[100] bg-sky-50/90 backdrop-blur-sm flex flex-col items-center justify-center"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-3" aria-hidden />
          <p className="text-sm text-gray-600 font-medium">Opening subject...</p>
        </div>
      )}
      <div className="viswam-student-main w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 sm:pt-24 relative">
        <section className="eco-hero mb-8 p-6 sm:p-8 text-white">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-300/90">Learning roadmaps</p>
          <h1 className="mt-2 text-xl font-bold sm:text-3xl break-words">
            {isLoadingUser ? "Your journey" : `${getStudentDisplayName(user)}'s learning path`}
          </h1>
          <p className="mt-2 max-w-xl text-sm text-white/80">
            Unlock stages as you complete lessons — each subject is its own premium mini-app.
          </p>
        </section>

        <div className="mb-8">
          <LearningRoadmap
            title="Abacus mastery roadmap"
            stages={abacusRoadmapStages}
            onStageClick={() => {
              if (abacusSubject) handleSubjectClick(abacusSubject._id || abacusSubject.id);
            }}
          />
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6 overflow-x-auto">
            <button
              onClick={() => setActiveTab('subjects')}
              className={`flex-1 min-w-[140px] px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium rounded-md transition-all ${
                activeTab === 'subjects'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-300'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Browse by Subject
            </button>
            <button
              onClick={() => setActiveTab('quizzes')}
              className={`flex-1 min-w-[140px] px-4 sm:px-6 py-3 text-xs sm:text-sm font-medium rounded-md transition-all ${
                activeTab === 'quizzes'
                  ? 'bg-white text-gray-900 shadow-sm border border-gray-300'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              My Quizzes
            </button>
          </div>
        </div>

        {/* Browse by Subject Tab */}
        {activeTab === 'subjects' && (
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">Your subjects</h2>
          <p className="text-sm text-slate-500 mb-6">Tap a subject to enter your personal learning app</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoadingSubjects ? (
              <div className="col-span-full flex flex-col items-center justify-center py-20">
                <Loader2 className="w-10 h-10 text-emerald-600 animate-spin mb-3" aria-hidden />
                <p className="text-sm text-slate-600 font-medium">Loading subjects...</p>
              </div>
            ) : subjects.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-semibold text-slate-600 mb-2">No Subjects Available</h3>
                <p className="text-slate-500">Check back later for new learning content.</p>
              </div>
            ) : (
              subjects.map((subject: any) => (
                <SubjectJourneyCard
                  key={subject._id || subject.id}
                  subject={{
                    id: subject._id || subject.id,
                    name: subject.name,
                    progress: Number(subject.progress ?? subject.overallProgress ?? 0),
                  }}
                  onClick={() => handleSubjectClick(subject._id || subject.id)}
                />
              ))
            )}
          </div>
        </div>
        )}

        {/* My Quizzes Tab */}
        {activeTab === 'quizzes' && (
        <div className="mb-8 max-w-7xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">My Quizzes</h2>
          {isLoadingQuizzes ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-gray-200">
              <Loader2 className="w-10 h-10 text-sky-500 animate-spin mb-3" aria-hidden />
              <p className="text-sm text-gray-600 font-medium">Loading quizzes...</p>
            </div>
          ) : quizzes.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-gray-200">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-semibold text-gray-600 mb-2">No Quizzes Assigned</h3>
              <p className="text-gray-500">Your teacher hasn't assigned any quizzes yet. Check back later!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:p-4 lg:p-6">
              {quizzes.map((quiz: any) => (
                        <Card key={quiz._id} className="hover:shadow-lg transition-shadow duration-200">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-2">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
                        <FileText className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 text-white" />
                        </div>
                      {quiz.hasAttempted && (
                        <Badge className="bg-green-100 text-green-700 border-green-300">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      </div>
                    <CardTitle className="text-base sm:text-lg">{quiz.title}</CardTitle>
                    <p className="text-gray-600 text-xs sm:text-sm">{quiz.description || `Quiz on ${quiz.subject}`}</p>
                    </CardHeader>
                    <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-center">
                      <div className="bg-blue-50 rounded-lg p-2">
                        <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 mx-auto mb-1" />
                        <p className="text-xs font-medium text-blue-800">{quiz.duration} min</p>
                        <p className="text-xs text-blue-600">Duration</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2">
                        <Target className="w-3 h-3 sm:w-4 sm:h-4 text-blue-600 mx-auto mb-1" />
                        <p className="text-xs font-medium text-blue-800">{quiz.questionCount}</p>
                        <p className="text-xs text-blue-600">Questions</p>
                      </div>
                    </div>
                    
                    {quiz.hasAttempted && quiz.bestScore !== null && (
                      <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                        <div className="flex items-center justify-between">
                          <span className="text-xs sm:text-sm font-medium text-green-800">Best Score:</span>
                          <span className="text-base sm:text-lg font-bold text-green-900">{quiz.bestScore}/{quiz.totalPoints}</span>
                        </div>
                        {quiz.completedAt && (
                          <p className="text-xs text-green-600 mt-1">
                            Completed: {new Date(quiz.completedAt).toLocaleDateString()}
                          </p>
                                )}
                      </div>
                    )}

                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-xs">
                        {quiz.difficulty}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {quiz.subject}
                      </Badge>
                              </div>

                    <Link href={`/quiz/${quiz._id}`}>
                      <Button className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg">
                        {quiz.hasAttempted ? 'Retake Quiz' : 'Start Quiz'}
                        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
                            ))}
                          </div>
          )}
                        </div>
                      )}

        {/* Recommended Learning Paths */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6">Recommended for You</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:p-4 lg:p-6">
            {recommendedPaths.map((path) => {
              const Icon = path.icon;
              return (
                <Card key={path.id} className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <div className={`w-10 h-10 ${path.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      {path.isComingSoon ? (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 border-blue-300">
                          Coming Soon
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          {path.difficulty}
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base sm:text-lg">{path.title}</CardTitle>
                    <p className="text-gray-600 text-xs sm:text-sm">{path.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Subjects - Hide for Coming Soon */}
                    {!path.isComingSoon && (
                      <div>
                        <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2">Subjects</p>
                        <div className="flex flex-wrap gap-1">
                          {path.subjects.map((subject, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {subject}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stats - Show Coming Soon message or stats */}
                    {path.isComingSoon ? (
                      <div className="text-center py-4">
                        <p className="text-xs sm:text-sm text-gray-500 italic">
                          Exciting educational games are on the way! Stay tuned for updates.
                        </p>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{path.duration}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                          <span>{path.students.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Star className="w-3 h-3 sm:w-4 sm:h-4 text-yellow-500" />
                          <span>{path.rating}</span>
                        </div>
                      </div>
                    )}

                    {path.isComingSoon ? (
                      <Button variant="outline" className="w-full" disabled>
                        Coming Soon
                        <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2 opacity-50" />
                      </Button>
                    ) : (
                      <Link href={`/subject/${path.id}`}>
                        <Button variant="outline" className="w-full">
                          Start Learning
                          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-2" />
                        </Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

      </div>

      <StudentBottomNav />
    </div>
  );
}
