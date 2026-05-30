export type OttVideo = {
  id: string;
  title: string;
  description?: string;
  durationSeconds: number;
  thumbnailUrl?: string;
  videoUrl?: string;
  youtubeUrl?: string;
  isYouTubeVideo?: boolean;
  views: number;
  createdAt: string;
  subjectId?: string;
  subjectName: string;
  classLabel: string;
  chapter?: string;
  module?: string;
  teacherName?: string;
};

export type OttCourse = {
  id: string;
  name: string;
  videos: OttVideo[];
  totalLessons: number;
  avgProgress: number;
};

export type OttWatchProgress = {
  videoId: string;
  positionSeconds: number;
  durationSeconds: number;
  updatedAt: string;
  completed?: boolean;
};

export type OttCategoryId =
  | "continue"
  | "recommended"
  | "trending"
  | "recent"
  | "popular-subjects"
  | "abacus"
  | "financial"
  | "competition"
  | "featured"
  | "top-rated"
  | "new-releases";

export type OttContentSection = {
  id: OttCategoryId;
  title: string;
  subtitle?: string;
  videos: OttVideo[];
};
