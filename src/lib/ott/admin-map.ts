import { extractPlainSubjectName, getSubjectClassLabel } from '@/lib/subject-names';
import { resolveContentDurationSeconds } from '@/lib/eduott-video-utils';
import type { OttVideo } from '@/lib/ott/types';

export type AdminOttSourceRow = {
  _id: string;
  title: string;
  description?: string;
  duration?: number;
  durationSeconds?: number;
  videoUrl?: string;
  fileUrl?: string;
  thumbnailUrl?: string;
  views?: number;
  createdAt?: string;
  subjectId?: string;
  subjectName?: string;
  classNumber?: string;
  size?: number;
};

export function mapAdminRowToOttVideo(row: AdminOttSourceRow): OttVideo {
  const durationSeconds = resolveContentDurationSeconds({
    duration: row.duration,
    durationSeconds: row.durationSeconds,
  });
  const classLabel =
    getSubjectClassLabel({
      name: row.subjectName,
      classNumber: row.classNumber,
    }) || '';
  return {
    id: row._id,
    title: row.title,
    description: row.description,
    durationSeconds,
    thumbnailUrl: row.thumbnailUrl,
    videoUrl: row.videoUrl || row.fileUrl,
    views: row.views ?? 0,
    createdAt: row.createdAt || new Date().toISOString(),
    subjectId: row.subjectId,
    subjectName: extractPlainSubjectName(row.subjectName || '') || 'Subject',
    classLabel,
  };
}
