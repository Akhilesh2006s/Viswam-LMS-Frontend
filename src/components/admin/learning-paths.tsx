import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { BookOpen, ChevronRight, Loader2 } from 'lucide-react';
import { useLocation } from 'wouter';
import { API_BASE_URL } from '@/lib/api-config';
import { AdminPageShell } from '@/components/admin/admin-ui';
import { resolveIsAsliPrepExclusive } from '@/lib/school-program';
import {
  extractPlainSubjectName,
  getLearningPathClassLabel,
  isSoftDeletedSubjectName,
} from '@/lib/subject-names';

function isActiveCatalogSubject(subject: {
  name?: string;
  isActive?: boolean;
}): boolean {
  if (!subject) return false;
  if (subject.isActive === false) return false;
  if (isSoftDeletedSubjectName(subject.name || '')) return false;
  return true;
}

function isActiveCatalogContent(item: {
  isActive?: boolean;
  contentChannel?: string;
  subject?: { name?: string; isActive?: boolean } | string;
}): boolean {
  if (
    item?.contentChannel &&
    item.contentChannel !== 'learning_path' &&
    item.contentChannel !== 'curriculum' &&
    item.contentChannel !== 'ott'
  ) {
    return false;
  }
  if (item?.isActive === false) return false;
  const subj = item.subject;
  if (subj != null && typeof subj === 'object') {
    if (subj.isActive === false) return false;
    if (isSoftDeletedSubjectName(subj.name || '')) return false;
  }
  return true;
}

function subjectMatchesClassFilter(
  row: {
    name?: string;
    classNumber?: string;
    asliPrepContent?: Array<{ classNumber?: string }>;
  },
  classFilter: string
): boolean {
  if (classFilter === 'all') return true;
  const label = getLearningPathClassLabel(row);
  return label === classFilter;
}

function getContentSubjectId(content: any): string | null {
  const subj = content?.subject;
  if (subj == null) return null;
  if (typeof subj === 'object' && subj._id != null) return String(subj._id);
  if (typeof subj === 'string' && subj.trim()) return subj.trim();
  return null;
}

/** Collapse duplicate Subject rows (e.g. BIO vs Biology vs BIOLOGY) for the same class. */
function normalizeSubjectNameForMerge(name: string): string {
  const plain = extractPlainSubjectName(name || '').trim().toLowerCase();
  if (/^bio(logy)?$/.test(plain) || plain === 'bio') return 'biology';
  return plain;
}

function groupKeyForSubjectRow(row: {
  name?: string;
  classNumber?: string;
  asliPrepContent?: any[];
}): string {
  const classLabel =
    getLearningPathClassLabel(row) ||
    String(row.classNumber || '').trim() ||
    'none';
  return `${classLabel}::${normalizeSubjectNameForMerge(row.name || '')}`;
}

function consolidateDuplicateSubjectCards(rows: any[]): any[] {
  const byKey = new Map<string, any>();

  for (const row of rows) {
    if (!isActiveCatalogSubject(row)) continue;
    const key = groupKeyForSubjectRow(row);
    const rowId = String(row._id || row.id);
    const incoming = [...(row.asliPrepContent || [])].filter((c) =>
      isActiveCatalogContent(c)
    );

    if (!byKey.has(key)) {
      byKey.set(key, {
        ...row,
        mergedSubjectIds: [rowId],
        asliPrepContent: incoming,
      });
      continue;
    }

    const agg = byKey.get(key)!;
    const idSet = new Set<string>(
      Array.isArray(agg.mergedSubjectIds)
        ? agg.mergedSubjectIds
        : [String(agg._id || agg.id)]
    );
    idSet.add(rowId);
    agg.mergedSubjectIds = Array.from(idSet);

    const seen = new Set(
      (agg.asliPrepContent || []).map((c: any) => String(c._id))
    );
    for (const c of incoming) {
      const cid = String(c._id);
      if (!seen.has(cid)) {
        seen.add(cid);
        agg.asliPrepContent.push(c);
      }
    }

    if ((row.name || '').length > (agg.name || '').length) {
      agg.name = row.name;
    }
    if ((!agg.description || !String(agg.description).trim()) && row.description) {
      agg.description = row.description;
    }
    if (
      (agg.classNumber == null || String(agg.classNumber).trim() === '') &&
      row.classNumber != null
    ) {
      agg.classNumber = row.classNumber;
    }
  }

  const result = Array.from(byKey.values()).map((agg) => {
    const contents = (agg.asliPrepContent || []).slice().sort((a: any, b: any) => {
      const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });
    const ids: string[] =
      agg.mergedSubjectIds && agg.mergedSubjectIds.length > 0
        ? agg.mergedSubjectIds
        : [String(agg._id || agg.id)];

    const countBySubject = new Map<string, number>();
    for (const c of contents) {
      const sid = getContentSubjectId(c);
      if (!sid) continue;
      countBySubject.set(sid, (countBySubject.get(sid) || 0) + 1);
    }

    let primaryId = String(agg._id || agg.id);
    let max = -1;
    for (const sid of ids) {
      const n = countBySubject.get(sid) || 0;
      if (n > max) {
        max = n;
        primaryId = sid;
      }
    }
    if (max <= 0) {
      primaryId = ids[0];
    }

    const inferredClass =
      (agg.classNumber != null && String(agg.classNumber).trim() !== ''
        ? String(agg.classNumber).trim()
        : null) ||
      (() => {
        for (const c of contents) {
          const cn = c?.classNumber != null && String(c.classNumber).trim() !== ''
            ? String(c.classNumber).trim()
            : '';
          if (cn) return cn;
        }
        return null;
      })();

    return {
      ...agg,
      _id: primaryId,
      id: primaryId,
      mergedSubjectIds: ids,
      asliPrepContent: contents,
      totalContent: contents.length,
      ...(inferredClass ? { classNumber: inferredClass } : {}),
    };
  });

  return result.sort((a: any, b: any) =>
    (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
  );
}

export default function AdminLearningPaths() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [subjectsWithContent, setSubjectsWithContent] = useState<any[]>([]);
  const [classFilter, setClassFilter] = useState<string>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [isAsliPrepExclusive, setIsAsliPrepExclusive] = useState(false);

  useEffect(() => {
    const loadProgram = async () => {
      try {
        const token = localStorage.getItem('authToken');
        if (!token) return;
        const res = await fetch(`${API_BASE_URL}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (res.ok) {
          const data = await res.json();
          setIsAsliPrepExclusive(resolveIsAsliPrepExclusive(data?.user));
        }
      } catch {
        /* ignore */
      }
    };
    void loadProgram();
  }, []);

  const classOptionsFromData = useMemo(() => {
    const classSet = new Set<string>();
    subjectsWithContent.forEach((subj: any) => {
      const label = getLearningPathClassLabel(subj);
      if (label) classSet.add(label);
    });
    return Array.from(classSet).sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return a.localeCompare(b, undefined, { numeric: true });
    });
  }, [subjectsWithContent]);

  const subjectNameOptions = useMemo(() => {
    const names = new Set<string>();
    subjectsWithContent.forEach((subj: any) => {
      if (!subjectMatchesClassFilter(subj, classFilter)) return;
      names.add(extractPlainSubjectName(subj.name || '').trim());
    });
    return Array.from(names).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [subjectsWithContent, classFilter]);

  const filteredSubjectsWithContent = useMemo(() => {
    return subjectsWithContent.filter((subj: any) => {
      if (!subjectMatchesClassFilter(subj, classFilter)) return false;
      if (subjectFilter === 'all') return true;
      return (
        extractPlainSubjectName(subj.name || '').toLowerCase() ===
        subjectFilter.toLowerCase()
      );
    });
  }, [subjectsWithContent, classFilter, subjectFilter]);

  const tableRows = useMemo(() => {
    return filteredSubjectsWithContent
      .map((subj: any) => {
        const classLabel = getLearningPathClassLabel(subj) || 'Unassigned';
        const displayName = extractPlainSubjectName(subj.name || '');
        const primaryId = String(subj._id || subj.id);
        const mergedIds: string[] = Array.isArray(subj.mergedSubjectIds)
          ? subj.mergedSubjectIds.map(String)
          : [primaryId];
        const otherIds = mergedIds.filter((id) => id !== primaryId);
        const viewHref =
          otherIds.length > 0
            ? `/admin/subject/${primaryId}?merge=${encodeURIComponent(otherIds.join(','))}`
            : `/admin/subject/${primaryId}`;
        return {
          key: mergedIds.slice().sort().join('-'),
          classLabel,
          displayName,
          itemCount: subj.totalContent || subj.asliPrepContent?.length || 0,
          viewHref,
        };
      })
      .sort((a, b) => {
        const classCmp =
          a.classLabel === 'Unassigned'
            ? 1
            : b.classLabel === 'Unassigned'
              ? -1
              : a.classLabel.localeCompare(b.classLabel, undefined, { numeric: true });
        if (classCmp !== 0) return classCmp;
        return a.displayName.localeCompare(b.displayName, undefined, { sensitivity: 'base' });
      });
  }, [filteredSubjectsWithContent]);

  const totalContentItemsInView = useMemo(
    () =>
      filteredSubjectsWithContent.reduce(
        (sum: number, subj: any) => sum + (subj.asliPrepContent?.length || 0),
        0
      ),
    [filteredSubjectsWithContent]
  );

  useEffect(() => {
    setSubjectFilter('all');
  }, [classFilter]);

  const loadLearningPaths = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };

      const [subjectsResponse, contentResponse] = await Promise.all([
        fetch(`${API_BASE_URL}/api/admin/subjects`, { headers }),
        fetch(`${API_BASE_URL}/api/admin/learning-paths/content`, { headers }),
      ]);

      let subjectsArray: any[] = [];
      if (subjectsResponse.ok) {
        const data = await subjectsResponse.json();
        const rows = Array.isArray(data) ? data : data.data || data.subjects || [];
        subjectsArray = rows.filter((s: { name?: string; isActive?: boolean }) =>
          isActiveCatalogSubject(s)
        );
      }

      let allContent: any[] = [];
      if (contentResponse.ok) {
        const contentData = await contentResponse.json();
        allContent = contentData.data || contentData || [];
        if (!Array.isArray(allContent)) allContent = [];
      }

      const bySubjectId = new Map<string, any[]>();
      for (const item of allContent) {
        if (!isActiveCatalogContent(item)) continue;
        const sid = getContentSubjectId(item);
        if (!sid) continue;
        if (!bySubjectId.has(sid)) bySubjectId.set(sid, []);
        bySubjectId.get(sid)!.push(item);
      }

      const consumedIds = new Set<string>();
      const merged: any[] = [];

      for (const subject of subjectsArray) {
        if (!isActiveCatalogSubject(subject)) continue;
        const subjectId = String(subject._id || subject.id);
        const asliPrepContent = (bySubjectId.get(subjectId) || [])
          .slice()
          .sort((a: any, b: any) => {
            const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
            const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
            return tb - ta;
          });
        consumedIds.add(subjectId);
        merged.push({
          _id: subject._id || subject.id,
          id: subject._id || subject.id,
          name: subject.name || 'Unknown Subject',
          description: subject.description || '',
          board: subject.board || '',
          classNumber: subject.classNumber,
          asliPrepContent,
          totalContent: asliPrepContent.length,
        });
      }

      // Subjects that only appear on content (e.g. catalog row missing from /subjects response)
      bySubjectId.forEach((items, subjectId) => {
        if (consumedIds.has(subjectId)) return;
        const activeItems = items.filter((item) => isActiveCatalogContent(item));
        if (activeItems.length === 0) return;
        const sorted = activeItems.slice().sort((a: any, b: any) => {
          const ta = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
          const tb = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
          return tb - ta;
        });
        const first = sorted[0];
        const populated = first?.subject;
        const nameFromPopulate =
          typeof populated === 'object' && populated?.name
            ? populated.name
            : 'Subject';
        if (isSoftDeletedSubjectName(nameFromPopulate)) return;
        merged.push({
          _id: subjectId,
          id: subjectId,
          name: nameFromPopulate,
          description: `Content for ${nameFromPopulate}`,
          board: first?.board || '',
          classNumber: first?.classNumber,
          asliPrepContent: sorted,
          totalContent: sorted.length,
        });
      });

      const consolidated = consolidateDuplicateSubjectCards(merged).filter(
        (row) =>
          isActiveCatalogSubject(row) &&
          (row.asliPrepContent?.length ?? 0) > 0
      );
      setSubjectsWithContent(consolidated);
    } catch (error) {
      console.error('Failed to fetch subjects with content:', error);
      setSubjectsWithContent([]);
    } finally {
      setLoading(false);
    }
  }, [isAsliPrepExclusive]);

  useEffect(() => {
    void loadLearningPaths();
  }, [loadLearningPaths]);

  const uniqueClassCount = useMemo(() => {
    const classes = new Set(
      filteredSubjectsWithContent.map((subj: any) => getLearningPathClassLabel(subj) || 'Unassigned')
    );
    return classes.size;
  }, [filteredSubjectsWithContent]);

  return (
    <AdminPageShell
      variant="premium"
      className="max-w-none w-full"
      title="Learning Paths"
      description="Textbooks and videos from Content Studio for your licensed classes. Open a subject to view all materials."
      actions={
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="lp-class-filter" className="text-xs text-slate-500">
              Class
            </Label>
            <Select value={classFilter} onValueChange={setClassFilter}>
              <SelectTrigger id="lp-class-filter" className="w-[180px] rounded-xl border-slate-200 bg-white">
                <SelectValue placeholder="All classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {classOptionsFromData.map((c) => (
                  <SelectItem key={c} value={c}>
                    Class {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="lp-subject-filter" className="text-xs text-slate-500">
              Subject
            </Label>
            <Select value={subjectFilter} onValueChange={setSubjectFilter}>
              <SelectTrigger id="lp-subject-filter" className="w-[200px] rounded-xl border-slate-200 bg-white">
                <SelectValue placeholder="All subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjectNameOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      }
    >
      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
        <Badge variant="secondary">{uniqueClassCount} classes</Badge>
        <Badge variant="secondary">{filteredSubjectsWithContent.length} subjects</Badge>
        <Badge variant="secondary">{totalContentItemsInView} items</Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-slate-600">
          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          Loading learning paths…
        </div>
      ) : subjectsWithContent.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-700">No learning content yet</h3>
          <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
            Content appears when Super Admin uploads materials in Content Studio for your licensed
            classes.
          </p>
        </div>
      ) : tableRows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-700">No matches</h3>
          <p className="mt-2 text-sm text-slate-500">Try &quot;All classes&quot; or &quot;All subjects&quot;.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="w-[100px] text-right">Items</TableHead>
                <TableHead className="w-[140px] text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tableRows.map((row) => (
                <TableRow
                  key={row.key}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => setLocation(row.viewHref)}
                >
                  <TableCell>
                    <Badge variant="outline" className="font-medium">
                      {row.classLabel === 'Unassigned' ? 'Unassigned' : `Class ${row.classLabel}`}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">{row.displayName}</TableCell>
                  <TableCell className="text-right text-slate-600">{row.itemCount}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-sky-700 hover:text-sky-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLocation(row.viewHref);
                      }}
                    >
                      View
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </AdminPageShell>
  );
}


