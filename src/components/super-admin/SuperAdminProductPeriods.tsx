import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  fetchProducts,
  fetchProductCurriculum,
  provisionProductCurriculum,
  productLabel,
  getProductClassNumbers,
  getSubjectsForClass,
  type Product,
} from '@/lib/products';
import { extractPlainSubjectName } from '@/lib/subject-names';
import {
  createProductPeriod,
  deleteProductPeriod,
  fetchProductPeriods,
  searchProductPeriodContentOptions,
  setProductPeriodContents,
  type PeriodAssignSource,
  type PeriodContentOption,
  type ProductPeriod,
} from '@/lib/product-periods';
import { SuperAdminEmptyState } from '@/components/super-admin/premium';
import { SA_BTN_ACCENT, SA_BTN_OUTLINE, SA_INPUT } from '@/components/super-admin/premium/sa-classes';
import {
  Loader2,
  Plus,
  Trash2,
  Clock,
  Layers2,
  ChevronDown,
  ChevronRight,
  X,
  BookOpen,
  Film,
} from 'lucide-react';

function catalogSubjectMatches(dbPlain: string, catalogName: string) {
  const a = dbPlain.toLowerCase().trim();
  const b = catalogName.toLowerCase().trim();
  if (a === b) return true;
  const alias: Record<string, string[]> = {
    maths: ['math', 'mathematics'],
    mathematics: ['maths', 'math'],
    math: ['maths', 'mathematics'],
  };
  if ((alias[b] || []).includes(a)) return true;
  if ((alias[a] || []).includes(b)) return true;
  return a.includes(b) || b.includes(a);
}

function SelectionPill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-3 py-2 text-sm font-medium transition-all',
        active
          ? 'bg-[var(--brand-navy)] text-white shadow-md'
          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50',
      )}
    >
      {children}
    </button>
  );
}

type PeriodEditorState = {
  selectedClass: string;
  selectedSubjectId: string | null;
  searchQ: string;
  pickExistingIds: string[];
  assignSource: PeriodAssignSource | null;
};

const emptyEditor = (): PeriodEditorState => ({
  selectedClass: '',
  selectedSubjectId: null,
  searchQ: '',
  pickExistingIds: [],
  assignSource: null,
});

export default function SuperAdminProductPeriods() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [productCode, setProductCode] = useState('');
  const [periods, setPeriods] = useState<ProductPeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState('');
  const [expandedPeriodId, setExpandedPeriodId] = useState<string | null>(null);
  const [editorByPeriod, setEditorByPeriod] = useState<Record<string, PeriodEditorState>>({});

  const [catalogClasses, setCatalogClasses] = useState<
    { _id: string; classNumber: string; label: string }[]
  >([]);
  const [subjects, setSubjects] = useState<
    { _id: string; name: string; classNumber?: string; board?: string }[]
  >([]);
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [savingPick, setSavingPick] = useState(false);
  const [existingOptions, setExistingOptions] = useState<PeriodContentOption[]>([]);
  const [searchingExisting, setSearchingExisting] = useState(false);

  const getEditor = (periodId: string): PeriodEditorState =>
    editorByPeriod[periodId] || emptyEditor();

  const patchEditor = (periodId: string, patch: Partial<PeriodEditorState>) => {
    setEditorByPeriod((prev) => ({
      ...prev,
      [periodId]: { ...getEditor(periodId), ...patch },
    }));
  };

  useEffect(() => {
    fetchProducts().then((list) => {
      setProducts(list);
      if (list.length && !productCode) setProductCode(list[0].code);
    });
  }, []);

  const syncCurriculum = useCallback(async (code: string) => {
    if (!code) {
      setCatalogClasses([]);
      setSubjects([]);
      return;
    }
    const product = products.find((p) => p.code === code);
    const classNums = product ? getProductClassNumbers(product) : [];
    setCurriculumLoading(true);
    let data = await fetchProductCurriculum(code);
    if (classNums.length) {
      await provisionProductCurriculum(code, { classNumbers: classNums });
      data = await fetchProductCurriculum(code);
    }
    if (data) {
      setCatalogClasses(data.classes);
      setSubjects(data.subjects);
    }
    setCurriculumLoading(false);
  }, [products]);

  const loadPeriods = useCallback(async () => {
    if (!productCode) {
      setPeriods([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setPeriods(await fetchProductPeriods(productCode));
    } finally {
      setLoading(false);
    }
  }, [productCode]);

  useEffect(() => {
    if (productCode) {
      syncCurriculum(productCode);
      setExpandedPeriodId(null);
      setEditorByPeriod({});
    }
  }, [productCode, syncCurriculum]);

  useEffect(() => {
    loadPeriods();
  }, [loadPeriods]);

  const expandedPeriod = useMemo(
    () => periods.find((p) => p.id === expandedPeriodId) || null,
    [periods, expandedPeriodId],
  );

  const editor = expandedPeriodId ? getEditor(expandedPeriodId) : emptyEditor();

  useEffect(() => {
    if (
      !expandedPeriodId ||
      !productCode ||
      !editor.assignSource ||
      !editor.selectedClass ||
      !editor.selectedSubjectId
    ) {
      setExistingOptions([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearchingExisting(true);
      try {
        const opts = await searchProductPeriodContentOptions(productCode, editor.searchQ, {
          classNumber: editor.selectedClass,
          subjectId: editor.selectedSubjectId || undefined,
          source: editor.assignSource || undefined,
        });
        const inPeriod = new Set(
          (expandedPeriod?.contents || []).map((c) => c.id),
        );
        setExistingOptions(opts.filter((o) => !inPeriod.has(o.id)));
      } finally {
        setSearchingExisting(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [
    editor.searchQ,
    editor.assignSource,
    editor.selectedClass,
    editor.selectedSubjectId,
    expandedPeriodId,
    productCode,
    expandedPeriod?.contents,
  ]);

  const selectedProduct = useMemo(
    () => products.find((p) => p.code === productCode),
    [products, productCode],
  );

  const subjectSlotsForClass = useMemo(() => {
    if (!selectedProduct || !editor.selectedClass) return [];
    const catalogNames = getSubjectsForClass(selectedProduct, editor.selectedClass);
    return catalogNames.map((name) => {
      const row = subjects.find(
        (s) =>
          String(s.classNumber) === editor.selectedClass &&
          catalogSubjectMatches(extractPlainSubjectName(s.name), name),
      );
      return { name, subjectId: row?._id };
    });
  }, [selectedProduct, editor.selectedClass, subjects]);

  const handleAddPeriod = async () => {
    if (!productCode || !newLabel.trim()) {
      toast({ title: 'Enter a period name', variant: 'destructive' });
      return;
    }
    try {
      const created = await createProductPeriod({ productCode, label: newLabel.trim() });
      setNewLabel('');
      await loadPeriods();
      if (created?.id) {
        setExpandedPeriodId(created.id);
        const firstClass = catalogClasses[0]?.classNumber || '';
        setEditorByPeriod((prev) => ({
          ...prev,
          [created.id]: {
            ...emptyEditor(),
            selectedClass: firstClass,
          },
        }));
      }
      toast({
        title: 'Period created',
        description: `Add class, subject, and content inside ${newLabel.trim() || 'this period'}.`,
      });
    } catch (e: unknown) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed',
        variant: 'destructive',
      });
    }
  };

  const handleSavePickedExisting = async (period: ProductPeriod) => {
    const ed = getEditor(period.id);
    if (!ed.pickExistingIds.length) return;
    setSavingPick(true);
    try {
      const ids = [
        ...new Set([...period.contents.map((c) => c.id), ...ed.pickExistingIds]),
      ];
      await setProductPeriodContents(period.id, productCode, ids);
      await loadPeriods();
      patchEditor(period.id, { pickExistingIds: [], assignSource: null, searchQ: '' });
      toast({ title: 'Content added to period' });
    } catch (e: unknown) {
      toast({
        title: 'Error',
        description: e instanceof Error ? e.message : 'Failed',
        variant: 'destructive',
      });
    } finally {
      setSavingPick(false);
    }
  };

  const removeFromPeriod = async (period: ProductPeriod, contentId: string) => {
    const ids = period.contents.map((c) => c.id).filter((id) => id !== contentId);
    await setProductPeriodContents(period.id, productCode, ids);
    await loadPeriods();
    toast({ title: 'Removed from period' });
  };

  const toggleExpand = (periodId: string) => {
    if (expandedPeriodId === periodId) {
      setExpandedPeriodId(null);
      return;
    }
    setExpandedPeriodId(periodId);
    const period = periods.find((p) => p.id === periodId);
    if (!editorByPeriod[periodId]) {
      const firstClass = catalogClasses[0]?.classNumber || '';
      setEditorByPeriod((prev) => ({
        ...prev,
        [periodId]: {
          ...emptyEditor(),
          selectedClass: firstClass,
          pickExistingIds: [],
        },
      }));
    }
    if (period && editorByPeriod[periodId]) {
      patchEditor(periodId, { pickExistingIds: [] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="sa-premium-panel space-y-4 p-5 sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2 min-w-[200px]">
            <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Product
            </Label>
            <Select value={productCode} onValueChange={setProductCode}>
              <SelectTrigger className={cn(SA_INPUT, 'h-11 w-full sm:w-[280px]')}>
                <SelectValue placeholder="Select product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.code} value={p.code}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {selectedProduct ? (
            <p className="text-sm text-slate-600 max-w-md">
              Create <strong>periods for {productLabel(productCode, products)}</strong>, then open a
              period and add content inside it.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end border-t border-slate-100 pt-4">
          <div className="flex-1 space-y-1">
            <Label htmlFor="new-period-label">New period for this product</Label>
            <Input
              id="new-period-label"
              className={SA_INPUT}
              placeholder="e.g. Period 1"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleAddPeriod()}
            />
          </div>
          <Button className={SA_BTN_ACCENT} onClick={() => void handleAddPeriod()} disabled={!productCode}>
            <Plus className="h-4 w-4 mr-2" />
            Add period
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-emerald)]" />
        </div>
      ) : !productCode ? (
        <SuperAdminEmptyState icon={Layers2} title="Select a product" description="Choose a product above." />
      ) : periods.length === 0 ? (
        <SuperAdminEmptyState
          icon={Clock}
          title="No periods for this product yet"
          description={`Add Period 1 for ${selectedProduct?.name || productCode}, then expand it to add class content inside.`}
          action={
            <Button className={SA_BTN_ACCENT} onClick={() => setNewLabel('Period 1')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Period 1
            </Button>
          }
        />
      ) : (
        <div className="space-y-3">
          {periods.map((period) => {
            const isOpen = expandedPeriodId === period.id;
            const ed = getEditor(period.id);

            return (
              <div
                key={period.id}
                className={cn(
                  'sa-premium-panel overflow-hidden p-0 transition-shadow',
                  isOpen && 'ring-2 ring-emerald-400/30',
                )}
              >
                <div className="flex items-center justify-between gap-3 px-5 py-4 bg-gradient-to-r from-emerald-50/80 to-transparent">
                  <button
                    type="button"
                    className="flex flex-1 items-center gap-3 min-w-0 text-left hover:opacity-90"
                    onClick={() => toggleExpand(period.id)}
                  >
                    {isOpen ? (
                      <ChevronDown className="h-5 w-5 text-emerald-700 shrink-0" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-slate-400 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <h3 className="text-lg font-bold text-[var(--brand-navy)]">{period.label}</h3>
                      <p className="text-xs text-slate-500">
                        {period.contents.length} item{period.contents.length === 1 ? '' : 's'} in this
                        period
                      </p>
                    </div>
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="border-emerald-200 text-emerald-800">
                      {productLabel(productCode, products)}
                    </Badge>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-200"
                      onClick={async () => {
                        if (expandedPeriodId === period.id) setExpandedPeriodId(null);
                        await deleteProductPeriod(period.id);
                        toast({ title: 'Period deleted' });
                        await loadPeriods();
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {isOpen ? (
                  <div className="border-t border-slate-100 px-5 pb-5 pt-4 space-y-5">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                        Content in {period.label}
                      </p>
                      {period.contents.length === 0 ? (
                        <p className="text-sm text-slate-500 rounded-lg border border-dashed border-slate-200 p-4">
                          No content yet — pick class and subject, then assign from Content Studio or
                          Viswam OTT.
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {period.contents.map((c) => (
                            <li
                              key={c.id}
                              className="flex items-center justify-between gap-2 rounded-lg border border-slate-100 bg-white px-3 py-2 text-sm"
                            >
                              <div className="min-w-0">
                                <span className="font-medium text-slate-900 block truncate">
                                  {c.title}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {[c.subjectName, c.classNumber ? `Class ${c.classNumber}` : null]
                                    .filter(Boolean)
                                    .join(' · ')}
                                </span>
                              </div>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="shrink-0 text-slate-500 hover:text-red-600"
                                onClick={() => void removeFromPeriod(period, c.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    <div className="rounded-xl border border-emerald-100 bg-emerald-50/40 p-4 space-y-4">
                      <p className="text-sm font-semibold text-[var(--brand-navy)]">
                        Add content inside {period.label}
                      </p>

                      {curriculumLoading ? (
                        <div className="flex items-center gap-2 text-sm text-slate-500">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Loading classes…
                        </div>
                      ) : catalogClasses.length === 0 ? (
                        <p className="text-sm text-slate-500">
                          Set up classes for this product on the Products page first.
                        </p>
                      ) : (
                        <>
                          <div>
                            <Label className="text-xs text-slate-500 mb-2 block">1. Class</Label>
                            <div className="flex flex-wrap gap-2">
                              {catalogClasses.map((c) => (
                                <SelectionPill
                                  key={c._id}
                                  active={ed.selectedClass === c.classNumber}
                                  onClick={() =>
                                    patchEditor(period.id, {
                                      selectedClass: c.classNumber,
                                      selectedSubjectId: null,
                                      assignSource: null,
                                      pickExistingIds: [],
                                    })
                                  }
                                >
                                  {c.label}
                                </SelectionPill>
                              ))}
                            </div>
                          </div>

                          {ed.selectedClass && subjectSlotsForClass.length > 0 ? (
                            <div>
                              <Label className="text-xs text-slate-500 mb-2 block">2. Subject</Label>
                              <div className="flex flex-wrap gap-2">
                                {subjectSlotsForClass.map((slot) => (
                                  <SelectionPill
                                    key={slot.name}
                                    active={ed.selectedSubjectId === slot.subjectId}
                                    onClick={() =>
                                      patchEditor(period.id, {
                                        selectedSubjectId: slot.subjectId || null,
                                        assignSource: null,
                                        pickExistingIds: [],
                                      })
                                    }
                                  >
                                    {slot.name}
                                  </SelectionPill>
                                ))}
                              </div>
                            </div>
                          ) : null}

                          {ed.selectedClass && ed.selectedSubjectId ? (
                            <div className="space-y-3 pt-2 border-t border-emerald-100">
                              <Label className="text-xs text-slate-500 block">3. Assign content</Label>
                              <p className="text-xs text-slate-500">
                                Uses the class and subject above to search Content Studio or Viswam OTT
                                — no duplicate upload here.
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  className={cn(
                                    SA_BTN_OUTLINE,
                                    ed.assignSource === 'studio' &&
                                      'border-emerald-500 bg-emerald-50 text-emerald-900',
                                  )}
                                  onClick={() =>
                                    patchEditor(period.id, {
                                      assignSource:
                                        ed.assignSource === 'studio' ? null : 'studio',
                                      pickExistingIds: [],
                                      searchQ: '',
                                    })
                                  }
                                >
                                  <BookOpen className="h-4 w-4 mr-2" />
                                  {ed.assignSource === 'studio'
                                    ? 'Close Content Studio'
                                    : 'Assign from Content Studio'}
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className={cn(
                                    SA_BTN_OUTLINE,
                                    ed.assignSource === 'ott' &&
                                      'border-violet-400 bg-violet-50 text-violet-900',
                                  )}
                                  onClick={() =>
                                    patchEditor(period.id, {
                                      assignSource: ed.assignSource === 'ott' ? null : 'ott',
                                      pickExistingIds: [],
                                      searchQ: '',
                                    })
                                  }
                                >
                                  <Film className="h-4 w-4 mr-2" />
                                  {ed.assignSource === 'ott'
                                    ? 'Close Viswam OTT'
                                    : 'Assign from Viswam OTT'}
                                </Button>
                              </div>

                              {ed.assignSource ? (
                                <div className="mt-3 space-y-2 rounded-lg border border-slate-200 bg-white p-3">
                                  <p className="text-xs font-medium text-slate-600">
                                    {ed.assignSource === 'studio'
                                      ? 'Content Studio (textbooks, workbooks, materials)'
                                      : 'Viswam OTT (videos for this class & subject)'}
                                  </p>
                                  <Input
                                    className={SA_INPUT}
                                    placeholder="Search by title, topic…"
                                    value={ed.searchQ}
                                    onChange={(e) =>
                                      patchEditor(period.id, { searchQ: e.target.value })
                                    }
                                  />
                                  <div className="max-h-48 overflow-y-auto border rounded-lg p-2">
                                    {searchingExisting ? (
                                      <p className="text-sm text-center py-4 text-slate-500">
                                        Searching…
                                      </p>
                                    ) : existingOptions.length === 0 ? (
                                      <p className="text-sm text-center py-4 text-slate-500">
                                        {ed.assignSource === 'ott'
                                          ? 'No OTT videos for this class & subject — add them in Viswam OTT first.'
                                          : 'No Content Studio items for this class & subject — add them in Content Studio first.'}
                                      </p>
                                    ) : (
                                      existingOptions.map((o) => (
                                        <label
                                          key={o.id}
                                          className="flex gap-2 p-2 rounded hover:bg-slate-50 cursor-pointer text-sm"
                                        >
                                          <input
                                            type="checkbox"
                                            checked={ed.pickExistingIds.includes(o.id)}
                                            onChange={() => {
                                              const ids = ed.pickExistingIds.includes(o.id)
                                                ? ed.pickExistingIds.filter((x) => x !== o.id)
                                                : [...ed.pickExistingIds, o.id];
                                              patchEditor(period.id, { pickExistingIds: ids });
                                            }}
                                          />
                                          <span className="min-w-0 flex-1">
                                            <span className="block truncate font-medium text-slate-900">
                                              {o.title}
                                            </span>
                                            <span className="text-xs text-slate-500">
                                              {[o.type, o.topic].filter(Boolean).join(' · ')}
                                            </span>
                                          </span>
                                        </label>
                                      ))
                                    )}
                                  </div>
                                  <Button
                                    className={SA_BTN_ACCENT}
                                    disabled={!ed.pickExistingIds.length || savingPick}
                                    onClick={() => void handleSavePickedExisting(period)}
                                  >
                                    {savingPick ? (
                                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                    ) : (
                                      <Plus className="h-4 w-4 mr-1" />
                                    )}
                                    Add selected to {period.label}
                                  </Button>
                                </div>
                              ) : null}
                            </div>
                          ) : ed.selectedClass ? (
                            <p className="text-sm text-slate-500 pt-2">
                              Select a subject to assign from Content Studio or Viswam OTT.
                            </p>
                          ) : null}
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="px-5 pb-3 text-xs text-slate-500">
                    Click the row to open and add content inside this period.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
