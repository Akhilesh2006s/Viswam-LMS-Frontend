import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  Loader2,
  Package,
  Layers,
  Upload,
  FileText,
  Plus,
  BookOpen,
  AlertCircle,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";
import {
  fetchProducts,
  fetchProductCurriculum,
  provisionProductCurriculum,
  productLabel,
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
};

const CONTENT_TYPES = ["TextBook", "Workbook", "Material", "Audio"] as const;

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

function legacyBoardForProduct(code: string) {
  const map: Record<string, string> = {
    VISWAM_PREP: "ASLI_EXCLUSIVE_SCHOOLS",
    VISWAM_SCHOOL: "CBSE",
    MATH_WORKBOOK_G6: "ASLI_EXCLUSIVE_SCHOOLS",
  };
  return map[code] || "ASLI_EXCLUSIVE_SCHOOLS";
}

export default function ProductCurriculumPanel() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [productCode, setProductCode] = useState("");
  const [classesFrom, setClassesFrom] = useState("1");
  const [classesTo, setClassesTo] = useState("12");
  const [catalogClasses, setCatalogClasses] = useState<
    { _id: string; classNumber: string; label: string }[]
  >([]);
  const [subjects, setSubjects] = useState<
    { _id: string; name: string; classNumber?: string }[]
  >([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState<string | null>(null);
  const [contents, setContents] = useState<ContentRow[]>([]);
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
    fetchProducts().then(setProducts);
  }, []);

  const loadCurriculum = async (code: string) => {
    if (!code) return;
    setLoading(true);
    const data = await fetchProductCurriculum(code);
    if (data) {
      setCatalogClasses(data.classes);
      setSubjects(data.subjects);
      if (data.classes.length && !selectedClass) {
        setSelectedClass(data.classes[0].classNumber);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    if (productCode) loadCurriculum(productCode);
  }, [productCode]);

  useEffect(() => {
    if (!selectedSubjectId) {
      setContents([]);
      return;
    }
    const load = async () => {
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
    load();
  }, [selectedSubjectId]);

  const selectedProduct = products.find((p) => p.code === productCode);

  const catalogSubjectNames = useMemo(() => {
    if (selectedProduct?.catalogSubjects?.length) {
      return selectedProduct.catalogSubjects;
    }
    const names = new Set<string>();
    subjects.forEach((s) => {
      const n = extractPlainSubjectName(s.name);
      if (n) names.add(n);
    });
    return [...names];
  }, [selectedProduct, subjects]);

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
      classesFrom: selectedClass,
      classesTo: selectedClass,
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
  const handleProvision = async () => {
    if (!productCode) return;
    setProvisioning(true);
    const result = await provisionProductCurriculum(productCode, {
      classesFrom,
      classesTo,
    });
    setProvisioning(false);
    if (result.ok && result.data) {
      const d = result.data;
      toast({
        title: "Curriculum ready",
        description: `${d.classesCreated} class(es), ${d.subjectsCreated} subject(s) created.`,
      });
      await loadCurriculum(productCode);
    } else {
      toast({ title: "Setup failed", description: result.message, variant: "destructive" });
    }
  };

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

  const handleSaveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubjectId || !productCode || !selectedClass) return;
    if (!contentForm.title.trim() || !contentForm.fileUrl.trim()) {
      toast({ title: "Title and file required", variant: "destructive" });
      return;
    }
    setSavingContent(true);
    const board = legacyBoardForProduct(productCode);
    const res = await fetch(`${API_BASE_URL}/api/super-admin/content`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        title: contentForm.title.trim(),
        description: contentForm.description.trim(),
        type: contentForm.type,
        board,
        subject: selectedSubjectId,
        classNumber: selectedClass,
        productCode,
        contentChannel: "curriculum",
        fileUrl: contentForm.fileUrl,
        date: new Date().toISOString().slice(0, 10),
      }),
    });
    setSavingContent(false);
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      toast({ title: "Content added" });
      setContentForm({ title: "", type: "TextBook", description: "", fileUrl: "" });
      setUploadFile(null);
      const sub = selectedSubjectId;
      setSelectedSubjectId(null);
      setTimeout(() => setSelectedSubjectId(sub), 0);
    } else {
      toast({ title: "Failed", description: json.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Package className="h-5 w-5 text-slate-600" />
            Set up product curriculum
          </CardTitle>
          <p className="text-sm text-slate-500 font-normal">
            <strong>Product</strong> = book line (e.g. Abacus). <strong>Subjects</strong> = topics under
            that product (add them in <strong>Products</strong> first). Setup creates classes, then one
            subject row per class for each topic.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1 sm:col-span-2">
              <Label>Product (book line)</Label>
              <Select
                value={productCode || "_"}
                onValueChange={(v) => {
                  setProductCode(v === "_" ? "" : v);
                  setSelectedClass("");
                  setSelectedSubjectId(null);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_">Select…</SelectItem>
                  {products.map((p) => (
                    <SelectItem key={p.code} value={p.code}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Classes from</Label>
              <Input value={classesFrom} onChange={(e) => setClassesFrom(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Classes to</Label>
              <Input value={classesTo} onChange={(e) => setClassesTo(e.target.value)} />
            </div>
          </div>
          <Button
            type="button"
            onClick={handleProvision}
            disabled={!productCode || provisioning}
            className="bg-slate-900 hover:bg-slate-800"
          >
            {provisioning ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Layers className="h-4 w-4 mr-2" />
            )}
            Create classes & subjects for this product
          </Button>

          {productCode && selectedProduct && (
            <div className="rounded-xl border border-[var(--brand-emerald)]/25 bg-emerald-50/50 p-4 space-y-2">
              <p className="text-sm font-semibold text-[var(--brand-navy)] flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-[var(--brand-emerald)]" />
                Subjects on this product
                {catalogSubjectNames.length > 0 && (
                  <Badge variant="secondary" className="font-normal">
                    {catalogSubjectNames.length}
                  </Badge>
                )}
              </p>
              {catalogSubjectNames.length === 0 ? (
                <p className="text-sm text-amber-800 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                  No subjects yet. Open <strong>Products</strong> in the sidebar, edit this product,
                  and add subjects (e.g. Abacus, Mental Math, Workbook).
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {catalogSubjectNames.map((name) => (
                    <Badge
                      key={name}
                      className="bg-white border border-[var(--brand-emerald)]/30 text-[var(--brand-navy)] px-3 py-1"
                    >
                      {name}
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-slate-600">
                After setup, pick a <strong>class</strong> → <strong>subject</strong> below to upload
                content. The product name ({selectedProduct.name}) is not the same as a subject — even
                if one subject is also called &quot;Abacus&quot;.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {!productCode ? (
        <Card className="border-dashed border-slate-200">
          <CardContent className="py-12 text-center text-sm text-slate-500">
            Select a product and run setup to create classes and subjects.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-12">
          <Card className="lg:col-span-3 border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">Classes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 max-h-[480px] overflow-y-auto">
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin mx-auto text-slate-400" />
              ) : catalogClasses.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">Run setup above first.</p>
              ) : (
                catalogClasses.map((c) => (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => {
                      setSelectedClass(c.classNumber);
                      setSelectedSubjectId(null);
                    }}
                    className={cn(
                      "w-full text-left rounded-lg px-3 py-2 text-sm font-medium",
                      selectedClass === c.classNumber
                        ? "bg-slate-900 text-white"
                        : "hover:bg-slate-100 text-slate-700",
                    )}
                  >
                    {c.label}
                  </button>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-4 border-slate-200 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-700">
                Subjects {selectedClass ? `· Class ${selectedClass}` : ""}
              </CardTitle>
              <p className="text-xs text-slate-500 font-normal">
                Click a subject to upload content. Amber rows need one-click setup for this class.
              </p>
            </CardHeader>
            <CardContent className="space-y-1 max-h-[480px] overflow-y-auto">
              {!selectedClass ? (
                <p className="text-xs text-slate-500 py-4">Select a class on the left.</p>
              ) : catalogSubjectNames.length === 0 ? (
                <p className="text-xs text-amber-700 py-4">Add subjects on the Products page first.</p>
              ) : subjectSlotsForClass.length === 0 ? (
                <p className="text-xs text-slate-500 py-4">Run setup above.</p>
              ) : (
                subjectSlotsForClass.map((slot) => {
                  const isSettingUp = settingUpSubject === slot.name;
                  return (
                    <button
                      key={`${slot.name}-${slot.subjectId || "pending"}`}
                      type="button"
                      onClick={() => handleSubjectClick(slot)}
                      disabled={isSettingUp}
                      className={cn(
                        "w-full text-left rounded-lg px-3 py-2.5 text-sm flex items-center justify-between gap-2 transition-colors",
                        !slot.provisioned &&
                          "bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-950 cursor-pointer",
                        slot.provisioned &&
                          selectedSubjectId === slot.subjectId &&
                          "bg-[var(--brand-emerald)]/10 ring-2 ring-[var(--brand-emerald)]/40 font-semibold text-[var(--brand-navy)]",
                        slot.provisioned &&
                          selectedSubjectId !== slot.subjectId &&
                          "hover:bg-slate-50 text-slate-800 border border-transparent",
                      )}
                    >
                      <span>{slot.name}</span>
                      {isSettingUp ? (
                        <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                      ) : slot.provisioned ? (
                        <Badge
                          variant="outline"
                          className="text-[10px] shrink-0 border-emerald-200 text-emerald-800"
                        >
                          Ready
                        </Badge>
                      ) : (
                        <Badge className="text-[10px] shrink-0 bg-amber-200 text-amber-950 hover:bg-amber-300">
                          Set up
                        </Badge>
                      )}
                    </button>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="lg:col-span-5 border-slate-200 shadow-sm">
            <CardHeader className="pb-2 flex flex-row items-center justify-between gap-2">
              <CardTitle className="text-sm font-medium text-slate-700">Upload content</CardTitle>
              {selectedSlot || selectedSubject ? (
                <Badge variant="outline" className="font-normal shrink-0 border-[var(--brand-emerald)]/40">
                  {selectedSlot?.name || extractPlainSubjectName(selectedSubject?.name || "")}
                </Badge>
              ) : null}
            </CardHeader>
            <CardContent className="space-y-4 max-h-[480px] overflow-y-auto">
              {!selectedSubjectId ? (
                <p className="text-xs text-slate-500 py-6 text-center">
                  Select a subject to upload textbook, workbook, or PDF.
                </p>
              ) : (
                <>
                  <p className="text-xs text-slate-600">
                    Product <span className="font-medium">{productLabel(productCode, products)}</span>
                    {" · "}
                    Subject <span className="font-medium">{selectedSlot?.name || "—"}</span>
                    {" · "}
                    Class <span className="font-medium">{selectedClass}</span>
                  </p>
                  <form onSubmit={handleSaveContent} className="space-y-3 border-t border-slate-100 pt-3">
                    <div className="space-y-1">
                      <Label>Title</Label>
                      <Input
                        value={contentForm.title}
                        onChange={(e) => setContentForm((f) => ({ ...f, title: e.target.value }))}
                        placeholder="Chapter 1 — Introduction"
                      />
                    </div>
                    <div className="space-y-1">
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
                        <SelectTrigger>
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
                    <div className="space-y-1">
                      <Label>File (PDF / audio)</Label>
                      <Input
                        type="file"
                        accept=".pdf,.mp3,.wav,application/pdf,audio/*"
                        onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!uploadFile || uploading}
                        onClick={handleUploadFile}
                      >
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Upload className="h-4 w-4 mr-1" />
                        )}
                        Upload file
                      </Button>
                      {contentForm.fileUrl ? (
                        <p className="text-xs text-emerald-700 truncate">✓ {contentForm.fileUrl}</p>
                      ) : null}
                    </div>
                    <div className="space-y-1">
                      <Label>Description (optional)</Label>
                      <Textarea
                        rows={2}
                        value={contentForm.description}
                        onChange={(e) =>
                          setContentForm((f) => ({ ...f, description: e.target.value }))
                        }
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={savingContent}
                      className="w-full bg-slate-900 hover:bg-slate-800"
                    >
                      {savingContent ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <Plus className="h-4 w-4 mr-2" />
                      )}
                      Add to curriculum
                    </Button>
                  </form>

                  {contents.length > 0 ? (
                    <div className="border-t border-slate-100 pt-3 space-y-2">
                      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        In this subject
                      </p>
                      {contents.map((c) => (
                        <div
                          key={c._id}
                          className="flex items-center gap-2 rounded-lg border border-slate-100 p-2 text-sm"
                        >
                          <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="flex-1 truncate">{c.title}</span>
                          <Badge variant="secondary" className="text-xs">
                            {c.type}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
