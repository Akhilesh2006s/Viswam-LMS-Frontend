import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { BookOpen, ChevronRight, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  extractPlainSubjectName,
  getLearningPathClassLabel,
} from "@/lib/subject-names";
import {
  fetchTeacherLearningPaths,
  type TeacherLearningSubject,
  type TeacherProductScope,
} from "@/lib/teacher-api";

type Props = {
  productScope: TeacherProductScope | null;
  selectedProduct: string;
};

function subjectMatchesClassFilter(row: TeacherLearningSubject, classFilter: string): boolean {
  if (classFilter === "all") return true;
  const label = getLearningPathClassLabel(row);
  return label === classFilter;
}

export function TeacherLearningPathsPanel({ productScope, selectedProduct }: Props) {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<TeacherLearningSubject[]>([]);
  const [classFilter, setClassFilter] = useState("all");
  const [subjectFilter, setSubjectFilter] = useState("all");

  const load = useCallback(async () => {
    setLoading(true);
    const rows = await fetchTeacherLearningPaths();
    setSubjects(rows.filter((s) => (s.asliPrepContent?.length || 0) > 0));
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const scopedSubjects = useMemo(() => {
    if (selectedProduct === "all") return subjects;
    return subjects.filter((s) => s.productCode === selectedProduct);
  }, [subjects, selectedProduct]);

  const classOptions = useMemo(() => {
    const set = new Set<string>();
    scopedSubjects.forEach((subj) => {
      const label = getLearningPathClassLabel(subj);
      if (label) set.add(label);
    });
    return Array.from(set).sort((a, b) => {
      const na = parseInt(a, 10);
      const nb = parseInt(b, 10);
      if (!Number.isNaN(na) && !Number.isNaN(nb)) return na - nb;
      return a.localeCompare(b, undefined, { numeric: true });
    });
  }, [scopedSubjects]);

  const subjectNameOptions = useMemo(() => {
    const names = new Set<string>();
    scopedSubjects.forEach((subj) => {
      if (!subjectMatchesClassFilter(subj, classFilter)) return;
      names.add(extractPlainSubjectName(subj.name || "").trim());
    });
    return Array.from(names).filter(Boolean).sort((a, b) => a.localeCompare(b));
  }, [scopedSubjects, classFilter]);

  const filtered = useMemo(() => {
    return scopedSubjects.filter((subj) => {
      if (!subjectMatchesClassFilter(subj, classFilter)) return false;
      if (subjectFilter === "all") return true;
      return (
        extractPlainSubjectName(subj.name || "").toLowerCase() === subjectFilter.toLowerCase()
      );
    });
  }, [scopedSubjects, classFilter, subjectFilter]);

  const tableRows = useMemo(
    () =>
      filtered
        .map((subj) => {
          const classLabel = getLearningPathClassLabel(subj) || "Unassigned";
          const displayName = extractPlainSubjectName(subj.name || "");
          const productName =
            productScope?.products?.find((p) => p.productCode === subj.productCode)
              ?.productName || subj.productCode || "";
          return {
            key: String(subj._id),
            classLabel,
            displayName,
            productName,
            itemCount: subj.asliPrepContent?.length || 0,
            viewHref: `/teacher/subject/${subj._id}`,
          };
        })
        .sort((a, b) => {
          const classCmp =
            a.classLabel === "Unassigned"
              ? 1
              : b.classLabel === "Unassigned"
                ? -1
                : a.classLabel.localeCompare(b.classLabel, undefined, { numeric: true });
          if (classCmp !== 0) return classCmp;
          return a.displayName.localeCompare(b.displayName, undefined, { sensitivity: "base" });
        }),
    [filtered, productScope?.products],
  );

  const totalItems = useMemo(
    () => filtered.reduce((sum, s) => sum + (s.asliPrepContent?.length || 0), 0),
    [filtered],
  );

  useEffect(() => {
    setSubjectFilter("all");
  }, [classFilter, selectedProduct]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-600">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-emerald-600" />
        Loading learning paths…
      </div>
    );
  }

  if (scopedSubjects.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
        <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-300" />
        <h3 className="text-lg font-semibold text-slate-700">No learning content yet</h3>
        <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
          Materials appear here when they are published for your assigned products, classes, and
          subjects. Ask your school admin to confirm your product assignment.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="teacher-lp-class" className="text-xs text-slate-500">
            Class
          </Label>
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger id="teacher-lp-class" className="w-[180px] rounded-xl border-slate-200 bg-white">
              <SelectValue placeholder="All classes" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All classes</SelectItem>
              {classOptions.map((c) => (
                <SelectItem key={c} value={c}>
                  Class {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="teacher-lp-subject" className="text-xs text-slate-500">
            Subject
          </Label>
          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger id="teacher-lp-subject" className="w-[200px] rounded-xl border-slate-200 bg-white">
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

      <div className="flex flex-wrap gap-2 text-xs text-slate-600">
        <Badge variant="secondary">{classOptions.length} classes</Badge>
        <Badge variant="secondary">{filtered.length} subjects</Badge>
        <Badge variant="secondary">{totalItems} items</Badge>
      </div>

      {tableRows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <BookOpen className="mx-auto mb-4 h-12 w-12 text-slate-300" />
          <h3 className="text-lg font-semibold text-slate-700">No matches</h3>
          <p className="mt-2 text-sm text-slate-500">Try &quot;All classes&quot; or another product filter.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Class</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead className="w-[140px]">Product</TableHead>
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
                      {row.classLabel === "Unassigned" ? "Unassigned" : `Class ${row.classLabel}`}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">{row.displayName}</TableCell>
                  <TableCell className="text-sm text-slate-600">{row.productName}</TableCell>
                  <TableCell className="text-right text-slate-600">{row.itemCount}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="text-emerald-700 hover:text-emerald-900"
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
    </div>
  );
}
