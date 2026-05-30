import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Brain, 
  Trophy, 
  Target, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Filter,
  TrendingUp,
  Users,
  Award,
  Star,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { API_BASE_URL } from '@/lib/api-config';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

interface IQActivity {
  _id: string;
  title: string;
  description: string;
  type: 'iq-test' | 'rank-boost' | 'challenge' | 'quiz';
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  points: number;
  duration: number; // in minutes
  subject?: {
    _id: string;
    name: string;
  };
  board?: string;
  classNumber?: string;
  questions: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  participants?: number;
  averageScore?: number;
  completionRate?: number;
}

export default function IQRankBoostActivities() {
  const { toast } = useToast();
  const [activities, setActivities] = useState<IQActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterDifficulty, setFilterDifficulty] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<IQActivity | null>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [boards, setBoards] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'iq-test' as 'iq-test' | 'rank-boost' | 'challenge' | 'quiz',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard' | 'expert',
    points: 100,
    duration: 30,
    subject: '',
    board: '',
    classNumber: '',
    questions: 10,
    isActive: true
  });

  useEffect(() => {
    fetchActivities();
    fetchSubjects();
    fetchBoards();
  }, []);

  const fetchActivities = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/super-admin/iq-rank-activities`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setActivities(data.data || []);
      } else {
        // If endpoint doesn't exist yet, use empty array
        setActivities([]);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
      setActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSubjects = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const url = `${API_BASE_URL}/api/super-admin/subjects`;
      console.log('🌐 Fetching subjects from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubjects(data.data || []);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Failed to fetch subjects:', errorData);
      }
    } catch (error: any) {
      console.error('Error fetching subjects:', error);
      
      // Handle network errors specifically
      if (error instanceof TypeError) {
        if (error.message === 'Failed to fetch' || error.message.includes('ERR_NAME_NOT_RESOLVED') || error.message.includes('ERR_NETWORK')) {
          console.error('Network error: Cannot connect to server');
        }
      }
    }
  };

  const fetchBoards = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const url = `${API_BASE_URL}/api/super-admin/boards`;
      console.log('🌐 Fetching boards from:', url);
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBoards(data.data || []);
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Failed to fetch boards:', errorData);
      }
    } catch (error: any) {
      console.error('Error fetching boards:', error);
      
      // Handle network errors specifically
      if (error instanceof TypeError) {
        if (error.message === 'Failed to fetch' || error.message.includes('ERR_NAME_NOT_RESOLVED') || error.message.includes('ERR_NETWORK')) {
          console.error('Network error: Cannot connect to server');
        }
      }
    }
  };

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/super-admin/iq-rank-activities`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Activity created successfully'
        });
        setIsCreateModalOpen(false);
        resetForm();
        fetchActivities();
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.message || 'Failed to create activity',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create activity',
        variant: 'destructive'
      });
    }
  };

  const handleUpdate = async () => {
    if (!selectedActivity) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/super-admin/iq-rank-activities/${selectedActivity._id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Activity updated successfully'
        });
        setIsEditModalOpen(false);
        setSelectedActivity(null);
        resetForm();
        fetchActivities();
      } else {
        const data = await response.json();
        toast({
          title: 'Error',
          description: data.message || 'Failed to update activity',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update activity',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this activity?')) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`${API_BASE_URL}/api/super-admin/iq-rank-activities/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Activity deleted successfully'
        });
        fetchActivities();
      } else {
        toast({
          title: 'Error',
          description: 'Failed to delete activity',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete activity',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      type: 'iq-test',
      difficulty: 'medium',
      points: 100,
      duration: 30,
      subject: '',
      board: '',
      classNumber: '',
      questions: 10,
      isActive: true
    });
  };

  const openEditModal = (activity: IQActivity) => {
    setSelectedActivity(activity);
    setFormData({
      title: activity.title,
      description: activity.description,
      type: activity.type,
      difficulty: activity.difficulty,
      points: activity.points,
      duration: activity.duration,
      subject: activity.subject?._id || '',
      board: activity.board || '',
      classNumber: activity.classNumber || '',
      questions: activity.questions,
      isActive: activity.isActive
    });
    setIsEditModalOpen(true);
  };

  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || activity.type === filterType;
    const matchesDifficulty = filterDifficulty === 'all' || activity.difficulty === filterDifficulty;
    return matchesSearch && matchesType && matchesDifficulty;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'iq-test':
        return <Brain className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'rank-boost':
        return <Trophy className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'challenge':
        return <Target className="w-3 h-3 sm:w-4 sm:h-4" />;
      case 'quiz':
        return <Award className="w-3 h-3 sm:w-4 sm:h-4" />;
      default:
        return <Star className="w-3 h-3 sm:w-4 sm:h-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'iq-test':
        return 'bg-purple-100 text-purple-700';
      case 'rank-boost':
        return 'bg-yellow-100 text-yellow-700';
      case 'challenge':
        return 'bg-red-100 text-red-700';
      case 'quiz':
        return 'bg-blue-100 text-blue-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="sa-premium-inner-page sa-premium-inner space-y-5 sm:space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((classNum) => {
          const classActivities = activities.filter(a => a.classNumber === classNum.toString());
          const activeCount = classActivities.filter(a => a.isActive).length;
          const totalQuestions = classActivities.reduce((sum, a) => sum + (a.questions || 0), 0);
          const totalParticipants = classActivities.reduce((sum, a) => sum + (a.participants || 0), 0);

           return (
             <Card key={classNum} className="sa-iq-class-card text-white transition-shadow">
               <CardHeader>
                 <div className="flex items-center gap-3">
                   <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25 font-bold text-lg">
                     {classNum}
                   </div>
                   <div>
                     <CardTitle className="text-base text-white sm:text-lg">Class {classNum}</CardTitle>
                     <CardDescription className="text-white/75">IQ &amp; rank boost</CardDescription>
                   </div>
                 </div>
               </CardHeader>
               <CardContent className="space-y-3">
                 <div className="grid grid-cols-2 gap-2 text-xs sm:text-sm">
                   <div className="rounded-lg bg-white/10 px-2 py-1.5">
                     <span className="text-white/70">Activities</span>
                     <p className="font-bold">{classActivities.length}</p>
                   </div>
                   <div className="rounded-lg bg-white/10 px-2 py-1.5">
                     <span className="text-white/70">Active</span>
                     <p className="font-bold">{activeCount}</p>
                   </div>
                   <div className="rounded-lg bg-white/10 px-2 py-1.5">
                     <span className="text-white/70">Questions</span>
                     <p className="font-bold">{totalQuestions}</p>
                   </div>
                   <div className="rounded-lg bg-white/10 px-2 py-1.5">
                     <span className="text-white/70">Participants</span>
                     <p className="font-bold">{totalParticipants}</p>
                   </div>
                 </div>
                 <p className="text-center text-xs text-white/80">Create activities below to enrich this class.</p>
               </CardContent>
             </Card>
           );
        })}
      </div>

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create IQ/Rank Boost Activity</DialogTitle>
            <DialogDescription>
              Create a new activity to boost student IQ and rankings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter activity title"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter activity description"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iq-test">IQ Test</SelectItem>
                    <SelectItem value="rank-boost">Rank Boost</SelectItem>
                    <SelectItem value="challenge">Challenge</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>Points</Label>
                <Input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Questions</Label>
                <Input
                  type="number"
                  value={formData.questions}
                  onChange={(e) => setFormData({ ...formData, questions: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Subject (Optional)</Label>
                <Select
                  value={formData.subject || '__none__'}
                  onValueChange={(value) => setFormData({ ...formData, subject: value === '__none__' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject._id} value={subject._id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Board (Optional)</Label>
                <Select
                  value={formData.board || '__none__'}
                  onValueChange={(value) => setFormData({ ...formData, board: value === '__none__' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select board" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {boards.map((board) => (
                      <SelectItem key={board._id || board.code} value={board.code || board._id}>
                        {board.name || board.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Class Number (Optional)</Label>
              <Input
                value={formData.classNumber}
                onChange={(e) => setFormData({ ...formData, classNumber: e.target.value })}
                placeholder="e.g., 10, 11, 12"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} className="bg-gradient-to-r from-sky-300 to-teal-400 hover:from-sky-400 hover:to-teal-500 text-white">Create Activity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit IQ/Rank Boost Activity</DialogTitle>
            <DialogDescription>
              Update activity details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Same form fields as create modal */}
            <div>
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iq-test">IQ Test</SelectItem>
                    <SelectItem value="rank-boost">Rank Boost</SelectItem>
                    <SelectItem value="challenge">Challenge</SelectItem>
                    <SelectItem value="quiz">Quiz</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value: any) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                    <SelectItem value="expert">Expert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>Points</Label>
                <Input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div>
                <Label>Questions</Label>
                <Input
                  type="number"
                  value={formData.questions}
                  onChange={(e) => setFormData({ ...formData, questions: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Subject (Optional)</Label>
                <Select
                  value={formData.subject || '__none__'}
                  onValueChange={(value) => setFormData({ ...formData, subject: value === '__none__' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subject" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject._id} value={subject._id}>
                        {subject.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Board (Optional)</Label>
                <Select
                  value={formData.board || '__none__'}
                  onValueChange={(value) => setFormData({ ...formData, board: value === '__none__' ? '' : value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select board" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">None</SelectItem>
                    {boards.map((board) => (
                      <SelectItem key={board._id || board.code} value={board.code || board._id}>
                        {board.name || board.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Class Number (Optional)</Label>
              <Input
                value={formData.classNumber}
                onChange={(e) => setFormData({ ...formData, classNumber: e.target.value })}
                placeholder="e.g., 10, 11, 12"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Update Activity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

