import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Upload, FileText, Plus, ExternalLink, Pencil, Trash2 } from "lucide-react";
import { API_BASE_URL, getPdfContentPreviewProxyUrl } from "@/lib/api-config";
import PdfPreviewPanel from "@/components/shared/PdfPreviewPanel";
import {
  fetchProducts,
  fetchProductCurriculum,
  provisionProductCurriculum,
  productLabel,
  getProductCatalogTags,
  getSubjectsForClass,
  getProductClassNumbers,
  isLevelBasedProduct,
  normalizeClassNumber,
  type Product,
} from "@/lib/products";
import { extractPlainSubjectName } from "@/lib/subject-names";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type ContentRow = {
  _id: string;
  title: string;
  type: string;
  fileUrl?: string;
  description?: string;
};

const CONTENT_TYPES = ["TextBook", "Workbook", "Material", "Audio"] as const;

function isPdfContent(fileUrl?: string, type?: string) {
  if (!fileUrl?.trim()) return false;
  if (/\.pdf(\?|$)/i.test(fileUrl)) return true;
  return type === "TextBook" || type === "Workbook" || type === "Material";
}

function catalogSubjectMatches(dbPlain: string, catalogName: string) {
  const a = dbPlain.toLowerCase().trim();
  const b = catalogName.toLowerCase().trim();
  if (a === b) return true;
  const alias: Record<string, string[]> = {
    maths: ["math", "mathematics"],
    mathematics: ["maths", "math"],
    math: ["maths", "mathematics"],
  };
  if ((alias[b] || []).includes(a)) return true;
  if ((alias[a] || []).includes(b)) return true;
  return a.includes(b) || b.includes(a);
}

function StepLabel({ n, label }: { n: number; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-navy)] text-xs font-bold text-white">
        {n}
      </span>
      <span className="text-sm font-medium text-[var(--brand-navy)]">{label}</span>
    </div>
  );
}

function SelectionPill({
  active,
  onClick,
  disabled,
  children,
  className,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-full px-4 py-2.5 text-sm font-medium transition-all",
        active
          ? "bg-[var(--brand-navy)] text-white shadow-md shadow-slate-900/10"
          : "bg-white text-slate-700 border border-slate-200 hover:border-slate-300 hover:bg-slate-50",
        disabled && "opacity-60 cursor-not-allowed",
        className,
      )}
    >
      {children}
    </button>
  );
}

export default function ProductCurriculumPanel() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [productCode, setProductCode] = useState("");
  const [catalogClasses, setCatalogClasses] = useState<
    { _id: string; classNumber: string; label: string }[]
  >([]);
  const [subjects, setSubjects] = useState<
    { _id: string; name: string; classNumber?: string; board?: string; productCode?: string }[]
  >([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [contents, setContents] = useState<ContentRow[]>([]);
  const [previewContentId, setPreviewContentId] = useState<string | null>(null);
  const [editingContentId, setEditingContentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [settingUpSubject, setSettingUpSubject] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [savingContent, setSavingContent] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [contentForm, setContentForm] = useState({
    title: "",
    type: "TextBook" as (typeof CONTENT_TYPES)[number],
    description: "",
    fileUrl: "",
  });

  const token = () => localStorage.getItem("authToken") || "";
  const headers = () => ({
    Authorization: `Bearer ${token()}`,
    "Content-Type": "application/json",
  });

  useEffect(() => {
    fetchProducts().then((list) => {
      setProducts(list);
      if (list.length && !productCode) {
        setProductCode(list[0].code);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once on mount
  }, []);

  /** Load DB curriculum; provision only when catalog classes are missing for this product. */
  const syncCurriculumForProduct = async (code: string, productList: Product[]) => {
    if (!code) {
      setCatalogClasses([]);
      setSubjects([]);
      setLoading(false);
      setProvisioning(false);
      return;
    }
    const product = productList.find((p) => p.code === code);
    const classNums = product ? getProductClassNumbers(product) : [];

    setLoading(true);
    let data = await fetchProductCurriculum(code);

    const existingClassNums = new Set(
      (data?.classes || []).map((c) => normalizeClassNumber(String(c.classNumber))),
    );
    const needsProvision =
      classNums.length > 0 &&
      classNums.some((n) => !existingClassNums.has(normalizeClassNumber(n)));

    if (needsProvision) {
      setProvisioning(true);
      const result = await provisionProductCurriculum(code, { classNumbers: classNums });
      setProvisioning(false);
      if (!result.ok) {
        toast({
          title: "Could not sync curriculum",
          description: result.message,
          variant: "destructive",
        });
      } else {
        data = await fetchProductCurriculum(code);
      }
    }

    if (data) {
      setCatalogClasses(data.classes);
      setSubjects(data.subjects);
      setSelectedClass((prev) => {
        if (prev && data.classes.some((c) => String(c.classNumber) === prev)) return prev;
        if (classNums.length) return classNums[0];
        return data.classes[0]?.classNumber || "";
      });
    } else {
      setCatalogClasses([]);
      setSubjects([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!productCode || products.length === 0) return;
    void syncCurriculumForProduct(productCode, products);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- sync when product changes or list first loads
  }, [productCode, products.length]);

  const reloadContents = async () => {
    if (!selectedSubjectId) {
      setContents([]);
      return;
    }
    const res = await fetch(
      `${API_BASE_URL}/api/super-admin/content?subject=${selectedSubjectId}&includeInactive=true`,
      { headers: headers() },
    );
    if (res.ok) {
      const json = await res.json();
      const rows = (json.data || []).filter(
        (c: ContentRow & { contentChannel?: string }) =>
          !c.contentChannel || c.contentChannel === "curriculum",
      );
      setContents(rows);
    }
  };

  useEffect(() => {
    if (!selectedSubjectId) {
      setContents([]);
      setEditingContentId(null);
      return;
    }
    void reloadContents();
    setEditingContentId(null);
    setContentForm({ title: "", type: "TextBook", description: "", fileUrl: "" });
    setUploadFile(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload when subject changes
  }, [selectedSubjectId]);

  useEffect(() => {
    if (!contents.length) {
      setPreviewContentId(null);
      return;
    }
    setPreviewContentId((prev) => {
      if (prev && contents.some((c) => c._id === prev)) return prev;
      return contents[0]._id;
    });
  }, [contents]);

  const previewContent = useMemo(
    () => contents.find((c) => c._id === previewContentId) || null,
    [contents, previewContentId],
  );

  const draftPreviewUrl =
    contentForm.fileUrl && isPdfContent(contentForm.fileUrl, contentForm.type)
      ? contentForm.fileUrl
      : "";

  const selectedProduct = products.find((p) => p.code === productCode);

  const catalogSubjectNames = useMemo(() => {
    const fromClass =
      selectedProduct && selectedClass
        ? getSubjectsForClass(selectedProduct, selectedClass)
        : [];
    if (fromClass.length) return fromClass;
    const fromCatalog = getProductCatalogTags(selectedProduct);
    if (fromCatalog.length) {
      return fromCatalog;
    }
    const names = new Set<string>();
    subjects.forEach((s) => {
      const n = extractPlainSubjectName(s.name);
      if (n) names.add(n);
    });
    return [...names];
  }, [selectedProduct, selectedClass, subjects]);

  const subjectSlotsForClass = useMemo(() => {
    if (!selectedClass) return [];
    const provisioned = subjects.filter((s) => String(s.classNumber) === selectedClass);
    const slots = catalogSubjectNames.map((name) => {
      const row = provisioned.find((s) =>
        catalogSubjectMatches(extractPlainSubjectName(s.name), name),
      );
      return { name, subjectId: row?._id, provisioned: !!row };
    });
    provisioned.forEach((s) => {
      const plain = extractPlainSubjectName(s.name);
      if (!slots.some((sl) => sl.name.toLowerCase() === plain.toLowerCase())) {
        slots.push({ name: plain, subjectId: s._id, provisioned: true });
      }
    });
    return slots;
  }, [catalogSubjectNames, subjects, selectedClass]);

  const handleSubjectClick = async (slot: {
    name: string;
    subjectId?: string;
    provisioned: boolean;
  }) => {
    if (slot.provisioned && slot.subjectId) {
      setSelectedSubjectId(slot.subjectId);
      return;
    }
    if (!productCode || !selectedClass) return;
    setSettingUpSubject(slot.name);
    const result = await provisionProductCurriculum(productCode, {
      classNumbers: [selectedClass],
    });
    setSettingUpSubject(null);
    if (!result.ok) {
      toast({ title: "Could not set up subject", description: result.message, variant: "destructive" });
      return;
    }
    const data = await fetchProductCurriculum(productCode);
    if (data) {
      setCatalogClasses(data.classes);
      setSubjects(data.subjects);
      const row = data.subjects.find(
        (s) =>
          String(s.classNumber) === selectedClass &&
          catalogSubjectMatches(extractPlainSubjectName(s.name), slot.name),
      );
      if (row) {
        setSelectedSubjectId(row._id);
        toast({ title: "Ready", description: `${slot.name} is set up for Class ${selectedClass}.` });
      } else {
        toast({
          title: "Run full setup",
          description: `Click "Create classes & subjects" above, then select ${slot.name} again.`,
          variant: "destructive",
        });
      }
    }
  };

  const selectedSubject = subjects.find((s) => s._id === selectedSubjectId);
  const selectedSlot = subjectSlotsForClass.find((s) => s.subjectId === selectedSubjectId);
  const handleUploadFile = async () => {
    if (!uploadFile) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", uploadFile);
    fd.append("contentType", contentForm.type);
    const res = await fetch(
      `${API_BASE_URL}/api/super-admin/content/upload-file?contentType=${encodeURIComponent(contentForm.type)}`,
      { method: "POST", headers: { Authorization: `Bearer ${token()}` }, body: fd },
    );
    setUploading(false);
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.fileUrl) {
      setContentForm((f) => ({ ...f, fileUrl: json.fileUrl }));
      toast({ title: "File uploaded", description: "Save content to attach to this subject." });
    } else {
      toast({ title: "Upload failed", description: json.message, variant: "destructive" });
    }
  };

  const resetContentForm = () => {
    setEditingContentId(null);
    setContentForm({ title: "", type: "TextBook", description: "", fileUrl: "" });
    setUploadFile(null);
  };

  const startEditContent = (row: ContentRow) => {
    setEditingContentId(row._id);
    setPreviewContentId(row._id);
    const type = CONTENT_TYPES.includes(row.type as (typeof CONTENT_TYPES)[number])
      ? (row.type as (typeof CONTENT_TYPES)[number])
      : "TextBook";
    setContentForm({
      title: row.title,
      type,
      description: row.description || "",
      fileUrl: row.fileUrl || "",
    });
    setUploadFile(null);
  };

  const handleDeleteContent = async (contentId: string) => {
    if (!confirm("Delete this chapter from the curriculum? This cannot be undone.")) return;
    const res = await fetch(`${API_BASE_URL}/api/super-admin/content/${contentId}`, {
      method: "DELETE",
      headers: headers(),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast({
        title: "Could not delete",
        description: json.message || "Delete failed",
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Chapter removed" });
    if (previewContentId === contentId) setPreviewContentId(null);
    if (editingContentId === contentId) resetContentForm();
    await reloadContents();
  };

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !productCode || !selectedClass) return;
    if (!contentForm.title.trim() || !contentForm.fileUrl.trim()) {
      toast({ title: "Title and file required", variant: "destructive" });
      return;
    }
    setSavingContent(true);
    const subjectRow = subjects.find((s) => s._id === selectedSubjectId);
    const board = String(subjectRow?.board || productCode).toUpperCase();
    const payload = {
      title: contentForm.title.trim(),
      description: contentForm.description.trim(),
      fileUrl: contentForm.fileUrl,
      classNumber: selectedClass,
    };

    const res = editingContentId
      ? await fetch(`${API_BASE_URL}/api/super-admin/content/${editingContentId}`, {
          method: "PUT",
          headers: headers(),
          body: JSON.stringify(payload),
        })
      : await fetch(`${API_BASE_URL}/api/super-admin/content`, {
          method: "POST",
          headers: headers(),
          body: JSON.stringify({
            ...payload,
            type: contentForm.type,
            board,
            subject: selectedSubjectId,
            productCode,
            contentChannel: "curriculum",
            date: new Date().toISOString().slice(0, 10),
          }),
        });

    setSavingContent(false);
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      toast({ title: editingContentId ? "Chapter updated" : "Content added" });
      const keepId = editingContentId;
      resetContentForm();
      await reloadContents();
      if (keepId) setPreviewContentId(keepId);
    } else {
      toast({ title: "Failed", description: json.message, variant: "destructive" });
    }
  };

  const classNums = selectedProduct ? getProductClassNumbers(selectedProduct) : [];
  const subjectCount = selectedProduct ? getProductCatalogTags(selectedProduct).length : 0;

  const showPreview =
    (previewContent?.fileUrl && isPdfContent(previewContent.fileUrl, previewContent.type)) ||
    draftPreviewUrl;

  return (
    <div className="space-y-10">
      {/* Product */}
      <section className="rounded-2xl border border-slate-200/70 bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="w-full max-w-md space-y-2">
            <Label className="text-slate-600">Product line</Label>
            <Select
              value={productCode || "_"}
              onValueChange={(v) => {
                setProductCode(v === "_" ? "" : v);
                setSelectedClass("");
                setSelectedSubjectId(null);
              }}
            >
              <SelectTrigger className="h-11 text-base">
                <SelectValue placeholder="Choose a product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_">Choose a product…</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.code} value={p.code}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {productCode && selectedProduct ? (
            <div className="flex flex-wrap items-center gap-3">
              {loading || provisioning ? (
                <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Syncing catalog…
                </span>
              ) : (
                <>
                  {classNums.length > 0 && (
                    <span className="text-sm text-slate-600">
                      <span className="font-semibold text-[var(--brand-navy)]">{classNums.length}</span>{" "}
                      {selectedProduct && isLevelBasedProduct(selectedProduct) ? "levels" : "classes"}
                    </span>
                  )}
                  {subjectCount > 0 && (
                    <span className="text-sm text-slate-600">
                      <span className="font-semibold text-[var(--brand-navy)]">{subjectCount}</span>{" "}
                      subjects
                    </span>
                  )}
                </>
              )}
            </div>
          ) : null}
        </div>
      </section>

      {!productCode ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/80 py-24 text-center">
          <p className="text-base text-slate-500">Choose a product to start uploading curriculum.</p>
        </div>
      ) : (
        <>
          {/* Classes — horizontal */}
          <section>
            <StepLabel
              n={1}
              label={
                selectedProduct && isLevelBasedProduct(selectedProduct)
                  ? "Pick a level"
                  : "Pick a class"
              }
            />
            {loading || provisioning ? (
              <div className="flex items-center gap-2 py-4 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="text-sm">Loading classes…</span>
              </div>
            ) : catalogClasses.length === 0 ? (
              <p className="text-sm text-slate-500 py-2">
                {getProductClassNumbers(selectedProduct!).length === 0
                  ? "Add classes on the Products page first."
                  : "Save catalog on the Products page, then re-select this product."}
              </p>
            ) : (
              <div className="flex flex-wrap gap-2.5">
                {catalogClasses.map((c) => (
                  <SelectionPill
                    key={c._id}
                    active={selectedClass === c.classNumber}
                    onClick={() => {
                      setSelectedClass(c.classNumber);
                      setSelectedSubjectId(null);
                    }}
                  >
                    {c.label}
                  </SelectionPill>
                ))}
              </div>
            )}
          </section>

          {/* Subjects — horizontal */}
          {selectedClass ? (
            <section>
              <StepLabel n={2} label={`Pick a subject · Class ${selectedClass}`} />
              {subjectSlotsForClass.length === 0 ? (
                <p className="text-sm text-slate-500">No subjects for this class yet.</p>
              ) : (
                <div className="flex flex-wrap gap-2.5">
                  {subjectSlotsForClass.map((slot) => {
                    const isSettingUp = settingUpSubject === slot.name;
                    const active = selectedSubjectId === slot.subjectId;
                    return (
                      <SelectionPill
                        key={`${slot.name}-${slot.subjectId || "pending"}`}
                        active={!!active && slot.provisioned}
                        disabled={isSettingUp}
                        onClick={() => handleSubjectClick(slot)}
                        className={cn(
                          !slot.provisioned && "border-amber-300 bg-amber-50 text-amber-950",
                          active && slot.provisioned && "ring-2 ring-[var(--brand-emerald)]/50",
                        )}
                      >
                        {isSettingUp ? (
                          <Loader2 className="h-4 w-4 animate-spin inline mr-1" />
                        ) : null}
                        {slot.name}
                        {!slot.provisioned && !isSettingUp ? (
                          <span className="ml-1.5 text-xs opacity-80">· tap to set up</span>
                        ) : null}
                      </SelectionPill>
                    );
                  })}
                </div>
              )}
            </section>
          ) : null}

          {/* Workspace: upload + preview side by side */}
          {selectedSubjectId ? (
            <section className="space-y-6">
              <StepLabel n={3} label="Upload & preview" />

              <div
                className={cn(
                  "grid gap-8",
                  showPreview ? "xl:grid-cols-[minmax(320px,380px)_1fr]" : "max-w-xl",
                )}
              >
                {/* Upload panel */}
                <div className="rounded-2xl border border-slate-200/70 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                  <div>
                    <p className="text-lg font-semibold text-[var(--brand-navy)]">
                      {selectedSlot?.name || extractPlainSubjectName(selectedSubject?.name || "")}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {productLabel(productCode, products)} · Class {selectedClass}
                    </p>
                  </div>

                  <form onSubmit={handleSaveContent} className="space-y-5">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        className="h-11"
                        value={contentForm.title}
                        onChange={(e) => setContentForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="Chapter 1"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={contentForm.type}
                          onValueChange={(v) =>
                            setContentForm((f) => ({
                              ...f,
                              type: v as (typeof CONTENT_TYPES)[number],
                            }))
                          }
                        >
                          <SelectTrigger className="h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {CONTENT_TYPES.map((t) => (
                              <SelectItem key={t} value={t}>
                                {t}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2 col-span-2">
                        <Label>PDF or audio file</Label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Input
                            type="file"
                            accept=".pdf,.mp3,.wav,application/pdf,audio/*"
                            className="h-11 flex-1"
                            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="h-11 shrink-0"
                            disabled={!uploadFile || uploading}
                            onClick={handleUploadFile}
                          >
                            {uploading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4 mr-2" />
                            )}
                            Upload
                          </Button>
                        </div>
                        {contentForm.fileUrl ? (
                          <p className="text-xs text-emerald-700">File ready to save</p>
                        ) : null}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description (optional)</Label>
                      <Textarea
                        rows={3}
                        className="resize-none"
                        value={contentForm.description}
                        onChange={(e) =>
                          setContentForm((f) => ({ ...f, description: e.target.value }))
                        }
                      />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        type="submit"
                        disabled={savingContent}
                        className="flex-1 h-11 rounded-xl bg-[var(--brand-navy)] hover:bg-[var(--brand-navy-hover)]"
                      >
                        {savingContent ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : editingContentId ? (
                          <Pencil className="h-4 w-4 mr-2" />
                        ) : (
                          <Plus className="h-4 w-4 mr-2" />
                        )}
                        {editingContentId ? "Save changes" : "Add to curriculum"}
                      </Button>
                      {editingContentId ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="h-11"
                          onClick={resetContentForm}
                        >
                          Cancel
                        </Button>
                      ) : null}
                    </div>
                  </form>

                  {contents.length > 0 ? (
                    <div className="pt-4 border-t border-slate-100 space-y-3">
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                        Chapters in this subject
                      </p>
                      <ul className="space-y-2">
                        {contents.map((c) => (
                          <li
                            key={c._id}
                            className={cn(
                              "flex items-center gap-2 rounded-xl border px-3 py-2 transition-all",
                              previewContentId === c._id || editingContentId === c._id
                                ? "border-[var(--brand-emerald)] bg-[var(--brand-emerald)]/10 shadow-sm"
                                : "border-slate-200 bg-slate-50 hover:bg-white",
                            )}
                          >
                            <button
                              type="button"
                              className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm font-medium text-[var(--brand-navy)]"
                              onClick={() => setPreviewContentId(c._id)}
                            >
                              <FileText className="h-4 w-4 shrink-0 opacity-50" />
                              <span className="truncate">{c.title}</span>
                            </button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 shrink-0 text-slate-600"
                              onClick={() => startEditContent(c)}
                            >
                              <Pencil className="h-3.5 w-3.5 mr-1" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-8 shrink-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => void handleDeleteContent(c._id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>

                {/* PDF preview — large */}
                {showPreview ? (
                  <div className="rounded-2xl border border-slate-200/70 bg-white overflow-hidden shadow-sm min-h-[min(82vh,920px)] flex flex-col">
                    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                      <div>
                        <p className="font-semibold text-[var(--brand-navy)]">
                          {previewContent?.title || contentForm.title || "Preview"}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {previewContent
                            ? `${previewContent.type} · Class ${selectedClass}`
                            : "Unsaved draft"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="rounded-full"
                          onClick={() => {
                            const url = previewContent?.fileUrl || draftPreviewUrl;
                            const title = previewContent?.title || contentForm.title;
                            const target = getPdfContentPreviewProxyUrl(url, title);
                            if (target) window.open(target, "_blank", "noopener,noreferrer");
                          }}
                        >
                          <ExternalLink className="h-4 w-4 mr-1.5" />
                          Full screen
                        </Button>
                        {previewContent ? (
                          <>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-full"
                              onClick={() => startEditContent(previewContent)}
                            >
                              <Pencil className="h-4 w-4 mr-1.5" />
                              Edit
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="rounded-full text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => void handleDeleteContent(previewContent._id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1.5" />
                              Delete
                            </Button>
                          </>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex-1 bg-slate-100/60 p-2 sm:p-4">
                      <PdfPreviewPanel
                        fileUrl={previewContent?.fileUrl || draftPreviewUrl}
                        title={previewContent?.title || contentForm.title}
                        className="w-full"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="hidden xl:flex rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 items-center justify-center min-h-[400px] p-8">
                    <p className="text-sm text-slate-400 text-center max-w-xs">
                      Upload a PDF and add it to curriculum, or select a chapter below to preview.
                    </p>
                  </div>
                )}
              </div>

              {/* Mobile: preview below upload */}
              {showPreview ? (
                <div className="xl:hidden rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
                  <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
                    <p className="font-medium text-[var(--brand-navy)]">
                      {previewContent?.title || "Preview"}
                    </p>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const url = previewContent?.fileUrl || draftPreviewUrl;
                        const target = getPdfContentPreviewProxyUrl(
                          url,
                          previewContent?.title || contentForm.title,
                        );
                        if (target) window.open(target, "_blank");
                      }}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <PdfPreviewPanel
                    fileUrl={previewContent?.fileUrl || draftPreviewUrl}
                    title={previewContent?.title || contentForm.title}
                  />
                </div>
              ) : null}
            </section>
          ) : selectedClass ? (
            <p className="text-sm text-slate-500 py-8 text-center rounded-2xl bg-slate-50 border border-slate-100">
              Select a subject above to upload and preview content.
            </p>
          ) : null}
        </>
      )}
    </div>
  );
}
