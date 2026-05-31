import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Grid3X3,
  LayoutList,
  Loader2,
  Pencil,
  Play,
  Plus,
  Search,
  Trash2,
  Upload,
  Youtube,
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api-config";
import {
  fetchProducts,
  fetchProductCurriculum,
  fetchAdminProductWorkspace,
  fetchAdminProductCurriculum,
  getProductCatalogTags,
  type Product,
} from "@/lib/products";
import { extractPlainSubjectName } from "@/lib/subject-names";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import ProductSubjectPicker, {
  type ProductSubjectSelection,
} from "@/components/super-admin/ProductSubjectPicker";

const PAGE_SIZES = [24, 48, 96] as const;

type LinkRow = {
  _id: string;
  title: string;
  fileUrl: string;
  classNumber?: string;
  productCode?: string;
  createdAt?: string;
  subject?: { _id?: string; name?: string; classNumber?: string };
};

function youtubeVideoId(url: string): string {
  try {
    if (url.includes("youtu.be/")) {
      return url.split("youtu.be/")[1]?.split(/[?&]/)[0] || "";
    }
    if (url.includes("youtube.com")) {
      return new URL(url).searchParams.get("v") || "";
    }
  } catch {
    /* ignore */
  }
  return "";
}

function youtubeThumb(url: string, quality: "mq" | "hq" = "hq") {
  const id = youtubeVideoId(url);
  if (!id) return "";
  return `https://img.youtube.com/vi/${id}/${quality}default.jpg`;
}

function isYoutubeUrl(url: string) {
  const u = url.toLowerCase();
  return u.includes("youtube.com") || u.includes("youtu.be");
}

function parseBulkUrls(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => isYoutubeUrl(line));
}

export type LearningPathLibraryVariant = "super-admin" | "admin";

type SuperAdminLearningPathsProps = {
  /** School admin: view-only library scoped to licensed products. */
  variant?: LearningPathLibraryVariant;
};

export default function SuperAdminLearningPaths({
  variant = "super-admin",
}: SuperAdminLearningPathsProps = {}) {
  const isSchoolAdmin = variant === "admin";
  const readOnly = isSchoolAdmin;
  const apiBase = isSchoolAdmin ? "/api/admin" : "/api/super-admin";
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [productCode, setProductCode] = useState("");
  const [classes, setClasses] = useState<{ classNumber: string; label: string }[]>([]);
  const [subjects, setSubjects] = useState<{ _id: string; name: string; classNumber?: string }[]>([]);
  const [links, setLinks] = useState<LinkRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<LinkRow | null>(null);
  const [addMode, setAddMode] = useState<"single" | "bulk">("single");
  const [preview, setPreview] = useState<LinkRow | null>(null);

  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterSubject, setFilterSubject] = useState("all");
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title">("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZES)[number]>(48);

  const [form, setForm] = useState({
    title: "",
    youtubeUrl: "",
  });
  const [bulkText, setBulkText] = useState("");
  const [bulkTitlePrefix, setBulkTitlePrefix] = useState("");
  const [contentTarget, setContentTarget] = useState<Partial<ProductSubjectSelection>>({});

  const headers = useCallback(
    () => ({
      Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
      "Content-Type": "application/json",
    }),
    [],
  );

  const loadLinks = useCallback(async () => {
    const qs = new URLSearchParams({ channel: "learning_path" });
    if (productCode) qs.set("productCode", productCode);
    const res = await fetch(
      `${API_BASE_URL}${apiBase}/curriculum/channel-content?${qs}`,
      { headers: headers() },
    );
    if (res.ok) {
      const j = await res.json();
      setLinks(j.data || []);
      if (isSchoolAdmin && j.message && !(j.data || []).length) {
        toast({ title: j.message, variant: "destructive" });
      }
    }
  }, [productCode, headers, apiBase, isSchoolAdmin, toast]);

  const load = useCallback(async () => {
    setLoading(true);
    if (isSchoolAdmin) {
      const ws = await fetchAdminProductWorkspace();
      const codes = new Set(
        [
          ws?.admin?.primaryProductCode,
          ...(ws?.admin?.productCodes || []),
        ].filter(Boolean) as string[],
      );
      setProducts((ws?.products || []).filter((p) => codes.has(p.code)));
      if (!productCode && ws?.admin?.primaryProductCode) {
        setProductCode(ws.admin.primaryProductCode);
      }
    } else {
      const p = await fetchProducts();
      setProducts(p);
    }
    await loadLinks();
    setLoading(false);
  }, [loadLinks, isSchoolAdmin, productCode]);

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    loadLinks();
    setPage(1);
  }, [productCode]);

  useEffect(() => {
    if (!productCode) {
      setClasses([]);
      setSubjects([]);
      return;
    }
    const loadCurriculum = isSchoolAdmin
      ? fetchAdminProductCurriculum
      : fetchProductCurriculum;
    loadCurriculum(productCode).then((data) => {
      if (data) {
        setClasses(data.classes);
        setSubjects(data.subjects);
      }
    });
  }, [productCode, isSchoolAdmin]);

  const productName = products.find((p) => p.code === productCode)?.name || "All products";

  const subjectFilterOptions = useMemo(() => {
    const p = products.find((x) => x.code === productCode);
    const fromCatalog = getProductCatalogTags(p);
    if (fromCatalog.length) return fromCatalog;
    const names = new Set<string>();
    subjects.forEach((s) => {
      const n = extractPlainSubjectName(s.name);
      if (n) names.add(n);
    });
    return [...names];
  }, [products, productCode, subjects]);

  const filteredLinks = useMemo(() => {
    const q = search.trim().toLowerCase();
    let rows = [...links];
    if (filterClass !== "all") {
      rows = rows.filter((r) => String(r.classNumber) === filterClass);
    }
    if (filterSubject !== "all") {
      rows = rows.filter((r) => {
        const subName = extractPlainSubjectName(r.subject?.name || "").toLowerCase();
        return subName === filterSubject.toLowerCase();
      });
    }
    if (q) {
      rows = rows.filter((r) => {
        const title = (r.title || "").toLowerCase();
        const sub = extractPlainSubjectName(r.subject?.name || "").toLowerCase();
        const cls = String(r.classNumber || "");
        return title.includes(q) || sub.includes(q) || cls.includes(q);
      });
    }
    rows.sort((a, b) => {
      if (sortBy === "title") return (a.title || "").localeCompare(b.title || "");
      const ta = new Date(a.createdAt || 0).getTime();
      const tb = new Date(b.createdAt || 0).getTime();
      return sortBy === "oldest" ? ta - tb : tb - ta;
    });
    return rows;
  }, [links, search, filterClass, filterSubject, sortBy, subjects]);

  const totalPages = Math.max(1, Math.ceil(filteredLinks.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pageRows = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredLinks.slice(start, start + pageSize);
  }, [filteredLinks, safePage, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [search, filterClass, filterSubject, sortBy, pageSize, productCode]);

  const stats = useMemo(
    () => ({
      total: links.length,
      showing: filteredLinks.length,
      products: new Set(links.map((l) => l.productCode).filter(Boolean)).size,
    }),
    [links, filteredLinks],
  );

  const createLink = async (payload: {
    subjectId: string;
    title: string;
    fileUrl: string;
    classNumber?: string;
  }) => {
    const res = await fetch(`${API_BASE_URL}${apiBase}/curriculum/channel-content`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({
        contentChannel: "learning_path",
        productCode: productCode || contentTarget.productCode,
        subjectId: payload.subjectId,
        classNumber: payload.classNumber,
        title: payload.title,
        fileUrl: payload.fileUrl,
      }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(json.message || "Failed to add");
    return json;
  };

  const handleAddSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = form.youtubeUrl.trim();
    if (!isYoutubeUrl(url)) {
      toast({
        title: "YouTube only",
        description: "Paste a valid youtube.com or youtu.be link.",
        variant: "destructive",
      });
      return;
    }
    if (!contentTarget.subjectId || !contentTarget.productCode) {
      toast({
        title: "Select product, subject & class",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    try {
      await createLink({
        subjectId: contentTarget.subjectId,
        classNumber: contentTarget.classNumber,
        title: form.title.trim() || "Learning path video",
        fileUrl: url,
      });
      toast({ title: "Video added" });
      setForm({ title: "", youtubeUrl: "" });
      await loadLinks();
    } catch (err) {
      toast({
        title: "Could not add",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleBulkAdd = async () => {
    const urls = parseBulkUrls(bulkText);
    if (!urls.length) {
      toast({ title: "No YouTube URLs found", variant: "destructive" });
      return;
    }
    if (!contentTarget.subjectId || !contentTarget.productCode) {
      toast({
        title: "Select product, subject & class for bulk import",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    setBulkProgress({ done: 0, total: urls.length });
    let ok = 0;
    let fail = 0;
    for (let i = 0; i < urls.length; i++) {
      const title = bulkTitlePrefix.trim()
        ? `${bulkTitlePrefix.trim()} ${i + 1}`
        : `Video ${i + 1}`;
      try {
        await createLink({
          subjectId: contentTarget.subjectId!,
          classNumber: contentTarget.classNumber,
          title,
          fileUrl: urls[i],
        });
        ok++;
      } catch {
        fail++;
      }
      setBulkProgress({ done: i + 1, total: urls.length });
    }
    setSaving(false);
    setBulkProgress(null);
    toast({
      title: "Bulk import finished",
      description: `${ok} added${fail ? `, ${fail} failed` : ""}.`,
    });
    setBulkText("");
    await loadLinks();
  };

  const resolveSubjectId = (row: LinkRow) => {
    if (row.subject?._id) return String(row.subject._id);
    const plain = extractPlainSubjectName(row.subject?.name || "");
    const match = subjects.find(
      (s) =>
        String(s.classNumber) === String(row.classNumber) &&
        extractPlainSubjectName(s.name).toLowerCase() === plain.toLowerCase(),
    );
    return match?._id;
  };

  const openEdit = (row: LinkRow) => {
    setEditing(row);
    setForm({ title: row.title, youtubeUrl: row.fileUrl });
    setContentTarget({
      productCode: row.productCode || productCode,
      classNumber: row.classNumber,
      subjectId: resolveSubjectId(row),
    });
    setEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing || readOnly) return;
    const url = form.youtubeUrl.trim();
    if (!isYoutubeUrl(url)) {
      toast({
        title: "YouTube only",
        description: "Paste a valid youtube.com or youtu.be link.",
        variant: "destructive",
      });
      return;
    }
    if (!contentTarget.subjectId) {
      toast({ title: "Select subject & class", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        title: form.title.trim() || editing.title,
        fileUrl: url,
        subjectId: contentTarget.subjectId,
        classNumber: contentTarget.classNumber,
        productCode: contentTarget.productCode || editing.productCode,
      };
      let res = await fetch(
        `${API_BASE_URL}${apiBase}/curriculum/channel-content/${editing._id}`,
        { method: "PUT", headers: headers(), body: JSON.stringify(payload) },
      );
      if (res.status === 404 && apiBase === "/api/super-admin") {
        res = await fetch(`${API_BASE_URL}/api/super-admin/content/${editing._id}`, {
          method: "PUT",
          headers: headers(),
          body: JSON.stringify({
            title: payload.title,
            fileUrl: payload.fileUrl,
            classNumber: payload.classNumber,
          }),
        });
      }
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          json.message ||
            (res.status === 404
              ? "Video not found — restart the backend or refresh the page."
              : "Failed to update"),
        );
      }
      toast({ title: "Video updated" });
      setEditOpen(false);
      setEditing(null);
      setForm({ title: "", youtubeUrl: "" });
      if (preview?._id === editing._id) setPreview(null);
      await loadLinks();
    } catch (err) {
      toast({
        title: "Could not update",
        description: err instanceof Error ? err.message : "Error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this YouTube link from learning paths?")) return;
    if (readOnly) return;
    const res = await fetch(`${API_BASE_URL}${apiBase}/curriculum/channel-content/${id}`, {
      method: "DELETE",
      headers: headers(),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast({
        title: "Could not remove",
        description:
          json.message ||
          (res.status === 404
            ? "Route not found — restart the backend (npm start in backend folder), then try again."
            : "Delete failed"),
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Video removed" });
    if (preview?._id === id) setPreview(null);
    if (editing?._id === id) {
      setEditOpen(false);
      setEditing(null);
    }
    await loadLinks();
  };

  const previewEmbedId = preview ? youtubeVideoId(preview.fileUrl) : "";

  return (
    <div className="space-y-0 -mx-1 sm:-mx-2">
      {/* Hero — Viswam navy / emerald / gold */}
      <div className="relative overflow-hidden rounded-2xl bg-[var(--brand-navy)] text-white p-6 sm:p-8 shadow-xl border border-[var(--brand-emerald)]/25">
        <div
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[var(--brand-emerald)]/25 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-20 left-1/3 h-48 w-48 rounded-full bg-[var(--brand-gold)]/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[var(--brand-gold)] via-[var(--brand-emerald)] to-[var(--brand-gold)]"
          aria-hidden
        />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--brand-gold)]/40 bg-[var(--brand-gold)]/15 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-[var(--brand-gold)]">
              <Youtube className="h-3.5 w-3.5 text-white" />
              YouTube only
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
              Learning path library
            </h2>
            <p className="text-white/90 text-sm sm:text-base leading-relaxed">
              {readOnly
                ? "View YouTube lessons added by Super Admin for your school’s products. Filter by product, class, and subject."
                : "Manage hundreds of YouTube lessons in one place. Filter by product, class, and subject. Uploaded files stay in "}
              {!readOnly && (
                <>
                  <span className="font-semibold text-[var(--brand-emerald)]">Viswam OTT</span> — this tab is links only.
                </>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <StatPill label="In library" value={stats.total} />
            <StatPill label="Matching filters" value={stats.showing} highlight />
            {!readOnly && (
              <Button
                size="lg"
                className="bg-[var(--brand-emerald)] hover:bg-[var(--brand-emerald-hover)] text-white shadow-lg shadow-emerald-900/30 h-11 px-6 font-semibold"
                onClick={() => setAddOpen(true)}
              >
                <Plus className="h-5 w-5 mr-2" />
                Add videos
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="sticky top-0 z-20 mt-4 rounded-xl border-2 border-[var(--brand-navy)]/10 bg-white shadow-md p-3 sm:p-4 space-y-3">
        <div className="flex flex-col xl:flex-row gap-3 xl:items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--brand-navy)]/50" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title, subject, or class…"
              className="pl-10 h-11 text-base border-[var(--brand-navy)]/15 focus-visible:ring-[var(--brand-emerald)]"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <Select
              value={productCode || "_all"}
              onValueChange={(v) => {
                setProductCode(v === "_all" ? "" : v);
                setFilterClass("all");
                setFilterSubject("all");
              }}
            >
              <SelectTrigger className="w-[180px] h-11">
                <SelectValue placeholder="Product" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">All products</SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.code} value={p.code}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-[130px] h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All classes</SelectItem>
                {classes.map((c) => (
                  <SelectItem key={c.classNumber} value={c.classNumber}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-[160px] h-11">
                <SelectValue placeholder="Subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All subjects</SelectItem>
                {subjectFilterOptions.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
              <SelectTrigger className="w-[130px] h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="oldest">Oldest</SelectItem>
                <SelectItem value="title">Title A–Z</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex rounded-lg border border-[var(--brand-navy)]/15 overflow-hidden h-11">
              <Button
                type="button"
                variant={viewMode === "grid" ? "default" : "ghost"}
                className={cn(
                  "rounded-none h-11 px-3",
                  viewMode === "grid" && "bg-[var(--brand-navy)] hover:bg-[var(--brand-navy-hover)]",
                )}
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant={viewMode === "list" ? "default" : "ghost"}
                className={cn(
                  "rounded-none h-11 px-3",
                  viewMode === "list" && "bg-[var(--brand-navy)] hover:bg-[var(--brand-navy-hover)]",
                )}
                onClick={() => setViewMode("list")}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-[var(--text-secondary)]">
          <span>
            <strong className="text-[var(--brand-navy)]">{productName}</strong>
            {" · "}
            Page {safePage} of {totalPages}
            {" · "}
            {filteredLinks.length} video{filteredLinks.length === 1 ? "" : "s"}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">Per page</span>
            <Select
              value={String(pageSize)}
              onValueChange={(v) => setPageSize(Number(v) as (typeof PAGE_SIZES)[number])}
            >
              <SelectTrigger className="w-20 h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Catalog */}
      <div className="mt-4 min-h-[420px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="h-10 w-10 animate-spin text-[var(--brand-emerald)]" />
            <p className="text-slate-500">Loading your video library…</p>
          </div>
        ) : filteredLinks.length === 0 ? (
          <EmptyLibrary
            hasProduct={!!productCode}
            onAdd={() => setAddOpen(true)}
            searchActive={!!search.trim()}
            readOnly={readOnly}
          />
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 sm:gap-5">
            {pageRows.map((row) => (
              <VideoCard
                key={row._id}
                row={row}
                onOpen={() => setPreview(row)}
                onEdit={() => openEdit(row)}
                onDelete={() => handleDelete(row._id)}
                readOnly={readOnly}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {pageRows.map((row) => (
              <VideoListRow
                key={row._id}
                row={row}
                onOpen={() => setPreview(row)}
                onEdit={() => openEdit(row)}
                onDelete={() => handleDelete(row._id)}
                readOnly={readOnly}
              />
            ))}
          </div>
        )}

        {filteredLinks.length > 0 && (
          <PaginationBar
            page={safePage}
            totalPages={totalPages}
            onPage={setPage}
          />
        )}
      </div>

      {/* Add sheet — super admin only */}
      {!readOnly && (
      <Sheet open={addOpen} onOpenChange={setAddOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-[var(--brand-navy)]">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand-emerald)]/15">
                <Youtube className="h-5 w-5 text-[var(--brand-emerald)]" />
              </span>
              Add YouTube videos
            </SheetTitle>
            <SheetDescription>
              Set up curriculum (classes + subjects) first, then add one link or paste many URLs.
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            <ProductSubjectPicker
              products={products}
              value={contentTarget}
              onChange={(next) => {
                setContentTarget(next);
                if (next.productCode) setProductCode(next.productCode);
              }}
            />

            <div className="flex gap-1 p-1 bg-[var(--brand-navy)]/5 rounded-lg border border-[var(--brand-navy)]/10">
              <Button
                type="button"
                variant={addMode === "single" ? "default" : "ghost"}
                className={cn(
                  "flex-1",
                  addMode === "single" && "bg-[var(--brand-navy)] hover:bg-[var(--brand-navy-hover)]",
                )}
                size="sm"
                onClick={() => setAddMode("single")}
              >
                Single
              </Button>
              <Button
                type="button"
                variant={addMode === "bulk" ? "default" : "ghost"}
                className={cn(
                  "flex-1",
                  addMode === "bulk" && "bg-[var(--brand-navy)] hover:bg-[var(--brand-navy-hover)]",
                )}
                size="sm"
                onClick={() => setAddMode("bulk")}
              >
                <Upload className="h-4 w-4 mr-1" />
                Bulk paste
              </Button>
            </div>

            {addMode === "single" ? (
              <form onSubmit={handleAddSingle} className="space-y-4">
                <div className="space-y-1">
                  <Label>Title</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Lesson title"
                  />
                </div>
                <div className="space-y-1">
                  <Label>YouTube URL</Label>
                  <Input
                    value={form.youtubeUrl}
                    onChange={(e) => setForm((f) => ({ ...f, youtubeUrl: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=..."
                  />
                </div>
                <Button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-[var(--brand-emerald)] hover:bg-[var(--brand-emerald-hover)] h-11 font-semibold"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Add video
                </Button>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1">
                  <Label>Title prefix (optional)</Label>
                  <Input
                    value={bulkTitlePrefix}
                    onChange={(e) => setBulkTitlePrefix(e.target.value)}
                    placeholder="e.g. Abacus L1"
                  />
                  <p className="text-xs text-slate-500">Videos become “Prefix 1”, “Prefix 2”, …</p>
                </div>
                <div className="space-y-1">
                  <Label>YouTube URLs — one per line</Label>
                  <textarea
                    className="flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    placeholder={"https://www.youtube.com/watch?v=...\nhttps://youtu.be/..."}
                  />
                  <p className="text-xs text-slate-500">
                    {parseBulkUrls(bulkText).length} valid URL
                    {parseBulkUrls(bulkText).length === 1 ? "" : "s"} detected
                  </p>
                </div>
                {bulkProgress && (
                  <div className="space-y-2">
                    <Progress value={(bulkProgress.done / bulkProgress.total) * 100} />
                    <p className="text-xs text-center text-slate-600">
                      {bulkProgress.done} / {bulkProgress.total}
                    </p>
                  </div>
                )}
                <Button
                  type="button"
                  disabled={saving || !contentTarget.subjectId}
                  className="w-full bg-[var(--brand-emerald)] hover:bg-[var(--brand-emerald-hover)] h-11 font-semibold"
                  onClick={handleBulkAdd}
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  Import {parseBulkUrls(bulkText).length || 0} videos
                </Button>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
      )}

      {/* Edit sheet — super admin only */}
      {!readOnly && (
        <Sheet
          open={editOpen}
          onOpenChange={(o) => {
            setEditOpen(o);
            if (!o) setEditing(null);
          }}
        >
          <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-[var(--brand-navy)]">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[var(--brand-navy)]/10">
                  <Pencil className="h-5 w-5 text-[var(--brand-navy)]" />
                </span>
                Edit video
              </SheetTitle>
              <SheetDescription>
                Update title, YouTube link, or move to another class/subject.
              </SheetDescription>
            </SheetHeader>

            <form onSubmit={handleSaveEdit} className="mt-6 space-y-4">
              <ProductSubjectPicker
                products={products}
                value={contentTarget}
                onChange={(next) => {
                  setContentTarget(next);
                  if (next.productCode) setProductCode(next.productCode);
                }}
              />
              <div className="space-y-1">
                <Label>Title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Lesson title"
                />
              </div>
              <div className="space-y-1">
                <Label>YouTube URL</Label>
                <Input
                  value={form.youtubeUrl}
                  onChange={(e) => setForm((f) => ({ ...f, youtubeUrl: e.target.value }))}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
              </div>
              <Button
                type="submit"
                disabled={saving}
                className="w-full bg-[var(--brand-emerald)] hover:bg-[var(--brand-emerald-hover)] h-11 font-semibold"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Save changes
              </Button>
            </form>
          </SheetContent>
        </Sheet>
      )}

      {/* Preview dialog */}
      <Dialog open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden gap-0">
          {preview && (
            <>
              <div className="aspect-video bg-black w-full">
                {previewEmbedId ? (
                  <iframe
                    title={preview.title}
                    src={`https://www.youtube.com/embed/${previewEmbedId}?rel=0`}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-white">
                    <Youtube className="h-16 w-16 opacity-40" />
                  </div>
                )}
              </div>
              <div className="p-5 space-y-3">
                <DialogHeader>
                  <DialogTitle className="text-lg pr-8">{preview.title}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-wrap gap-2">
                  <Badge>Class {preview.classNumber}</Badge>
                  <Badge variant="outline">
                    {extractPlainSubjectName(preview.subject?.name || "")}
                  </Badge>
                  {preview.productCode && (
                    <Badge variant="secondary">{preview.productCode}</Badge>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" asChild>
                    <a href={preview.fileUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open on YouTube
                    </a>
                  </Button>
                  {!readOnly && (
                    <>
                      <Button variant="outline" onClick={() => openEdit(preview)}>
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete(preview._id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatPill({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl px-4 py-3 min-w-[108px] border backdrop-blur-sm",
        highlight
          ? "bg-white/15 border-[var(--brand-gold)]/50 shadow-inner"
          : "bg-white/10 border-white/25",
      )}
    >
      <p
        className={cn(
          "text-2xl sm:text-3xl font-bold tabular-nums text-white",
          highlight && "text-[var(--brand-gold)]",
        )}
      >
        {value.toLocaleString()}
      </p>
      <p className="text-[11px] font-semibold text-white/80 uppercase tracking-wider mt-0.5">
        {label}
      </p>
    </div>
  );
}

function VideoCard({
  row,
  onOpen,
  onEdit,
  onDelete,
  readOnly = false,
}: {
  row: LinkRow;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  readOnly?: boolean;
}) {
  const thumb = youtubeThumb(row.fileUrl, "hq");
  return (
    <article
      className="group rounded-2xl overflow-hidden bg-white border-2 border-slate-200 shadow-sm hover:shadow-xl hover:border-[var(--brand-emerald)]/50 transition-all duration-200 cursor-pointer"
      onClick={onOpen}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
      role="button"
      tabIndex={0}
    >
      <div className="relative aspect-video bg-slate-900 overflow-hidden">
        {thumb ? (
          <img
            src={thumb}
            alt=""
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Youtube className="h-14 w-14 text-slate-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="rounded-full bg-[var(--brand-emerald)] p-4 shadow-2xl ring-4 ring-[var(--brand-gold)]/40">
            <Play className="h-8 w-8 text-white fill-white" />
          </span>
        </div>
        <Badge className="absolute top-2 left-2 bg-[var(--brand-navy)] border border-[var(--brand-emerald)]/30 text-white font-medium">
          Class {row.classNumber}
        </Badge>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-semibold text-[var(--brand-navy)] line-clamp-2 text-sm sm:text-base leading-snug min-h-[2.5rem]">
          {row.title}
        </h3>
        <p className="text-xs text-[var(--brand-emerald)] font-medium truncate">
          {extractPlainSubjectName(row.subject?.name || "Subject")}
        </p>
        {!readOnly && (
          <div
            className="flex gap-2 pt-2 border-t border-slate-100"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs"
              onClick={onEdit}
            >
              <Pencil className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex-1 h-8 text-xs text-red-600 border-red-200 hover:bg-red-50"
              onClick={onDelete}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}

function VideoListRow({
  row,
  onOpen,
  onEdit,
  onDelete,
  readOnly = false,
}: {
  row: LinkRow;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
  readOnly?: boolean;
}) {
  const thumb = youtubeThumb(row.fileUrl, "mq");
  return (
    <div
      className="flex gap-4 p-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer items-center"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onOpen()}
    >
      <div className="w-40 sm:w-52 shrink-0 aspect-video rounded-lg overflow-hidden bg-slate-900">
        {thumb ? (
          <img src={thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Youtube className="h-8 w-8 text-slate-500" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0 py-1">
        <p className="font-semibold text-slate-900 truncate text-base">{row.title}</p>
        <p className="text-sm text-slate-500 mt-1">
          Class {row.classNumber} · {extractPlainSubjectName(row.subject?.name || "")}
        </p>
      </div>
      <div className="flex gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
        <Button variant="outline" size="sm" onClick={onOpen}>
          <Play className="h-4 w-4" />
        </Button>
        {!readOnly && (
          <>
            <Button variant="outline" size="sm" onClick={onEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-red-600 border-red-200 hover:bg-red-50"
              onClick={onDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function PaginationBar({
  page,
  totalPages,
  onPage,
}: {
  page: number;
  totalPages: number;
  onPage: (p: number) => void;
}) {
  const pages: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, page + 2);
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <div className="flex items-center justify-center gap-2 py-8 mt-4">
      <Button
        variant="outline"
        size="icon"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      {start > 1 && (
        <>
          <Button variant="ghost" size="sm" onClick={() => onPage(1)}>
            1
          </Button>
          {start > 2 && <span className="text-slate-400">…</span>}
        </>
      )}
      {pages.map((p) => (
        <Button
          key={p}
          variant={p === page ? "default" : "ghost"}
          size="sm"
          className={cn(
            "min-w-9",
            p === page && "bg-[var(--brand-navy)] hover:bg-[var(--brand-navy-hover)]",
          )}
          onClick={() => onPage(p)}
        >
          {p}
        </Button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-slate-400">…</span>}
          <Button variant="ghost" size="sm" onClick={() => onPage(totalPages)}>
            {totalPages}
          </Button>
        </>
      )}
      <Button
        variant="outline"
        size="icon"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
}

function EmptyLibrary({
  hasProduct,
  onAdd,
  searchActive,
  readOnly = false,
}: {
  hasProduct: boolean;
  onAdd: () => void;
  searchActive: boolean;
  readOnly?: boolean;
}) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-[var(--brand-emerald)]/30 bg-gradient-to-b from-emerald-50/80 to-white py-20 px-6 text-center">
      <div className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-[var(--brand-navy)] to-[var(--brand-emerald)] flex items-center justify-center mb-6 shadow-lg ring-4 ring-[var(--brand-gold)]/25">
        <Youtube className="h-10 w-10 text-white" />
      </div>
      <h3 className="text-xl font-semibold text-[var(--brand-navy)]">
        {searchActive ? "No videos match your search" : "Your library is empty"}
      </h3>
      <p className="text-slate-500 mt-2 max-w-md mx-auto">
        {searchActive
          ? "Try different filters or clear the search box."
          : readOnly
            ? hasProduct
              ? "No learning-path videos for this product yet. Super Admin adds them in Content studio."
              : "Select a product above, or ask Super Admin to assign products to your school."
            : hasProduct
              ? "Add YouTube links one at a time, or paste hundreds of URLs with bulk import."
              : "Select a product above, then use Add videos to build your catalog."}
      </p>
      {!searchActive && !readOnly && (
        <Button
          className="mt-6 bg-[var(--brand-emerald)] hover:bg-[var(--brand-emerald-hover)] h-11 px-8 font-semibold shadow-md"
          onClick={onAdd}
        >
          <Plus className="h-5 w-5 mr-2" />
          Add videos
        </Button>
      )}
    </div>
  );
}
