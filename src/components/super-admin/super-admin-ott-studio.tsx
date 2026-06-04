import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Plus,
  Trash2,
  Upload,
  Shield,
  Play,
  Lock,
  Users,
  Filter,
  Eye,
  Grid3X3,
  LayoutList,
  Film,
  HardDrive,
  CheckCircle2,
} from "lucide-react";
import { formatFileSize } from "@/lib/format-bytes";
import { API_BASE_URL } from "@/lib/api-config";
import { resolveMediaUrl } from "@/lib/media-url";
import { EduOTTVideoPlayerDialog } from "@/components/eduott/EduOTTVideoPlayerDialog";
import type { EduOTTVideoCardItem } from "@/components/eduott/EduOTTVideoCard";
import { fetchProducts, productLabel, type Product } from "@/lib/products";
import { extractPlainSubjectName } from "@/lib/subject-names";
import { useToast } from "@/hooks/use-toast";
import { OttMonthlyQuotaCard } from "@/components/ott/OttMonthlyQuotaCard";
import type { SchoolOttQuota } from "@/lib/ott/quota-api";
import ProductSubjectPicker, {
  type ProductSubjectSelection,
} from "@/components/super-admin/ProductSubjectPicker";
import { OttSchoolAccessEditor } from "@/components/super-admin/OttSchoolAccessEditor";
import {
  ensureRestrictionsShape,
  type OttRestrictionsPayload,
} from "@/lib/ott-restrictions";

type SchoolRow = { _id: string; name: string; adminEmail?: string; restrictions: OttRestrictionsPayload };
type OttRow = {
  _id: string;
  title: string;
  fileUrl: string;
  size?: number;
  fileSizeBytes?: number;
  maxStreamQuality?: string;
  productCode?: string;
  subject?: { name?: string };
  classNumber?: string;
  createdAt?: string;
};

type OttRestrictions = OttRestrictionsPayload;

const PLANS = ["basic", "standard", "premium", "enterprise"];
const STATUSES = [
  { value: "active", label: "Active", className: "bg-emerald-100 text-emerald-800" },
  { value: "throttled", label: "Throttled", className: "bg-amber-100 text-amber-800" },
  { value: "suspended", label: "Suspended", className: "bg-red-100 text-red-800" },
];

export default function SuperAdminOttStudio() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [videos, setVideos] = useState<OttRow[]>([]);
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [schoolId, setSchoolId] = useState("");
  const [restrictions, setRestrictions] = useState<OttRestrictions | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [catalogClassFilter, setCatalogClassFilter] = useState("all");
  const [catalogProductFilter, setCatalogProductFilter] = useState("all");
  const [catalogSubjectFilter, setCatalogSubjectFilter] = useState("all");
  const [catalogView, setCatalogView] = useState<"grid" | "list">("grid");
  const [studioTab, setStudioTab] = useState<"upload" | "restrictions" | "catalog">("upload");

  useEffect(() => {
    const applyOttTab = (raw: string | null) => {
      if (raw === "upload" || raw === "restrictions" || raw === "catalog") {
        setStudioTab(raw);
      }
    };
    try {
      const params = new URLSearchParams(window.location.search);
      applyOttTab(params.get("sa_ott_tab"));
      const fromSession = sessionStorage.getItem("superAdminOttTab");
      if (fromSession) applyOttTab(fromSession);
    } catch {
      /* ignore */
    }
    const onOttTab = (e: Event) => {
      const tab = (e as CustomEvent<{ tab?: string }>).detail?.tab;
      if (tab) applyOttTab(tab);
    };
    window.addEventListener("viswam-sa-ott-tab", onOttTab);
    return () => window.removeEventListener("viswam-sa-ott-tab", onOttTab);
  }, []);

  const [lastAddedMessage, setLastAddedMessage] = useState<{
    title: string;
    productName: string;
    subject: string;
    classNumber: string;
    sizeLabel: string;
  } | null>(null);
  const [previewVideo, setPreviewVideo] = useState<EduOTTVideoCardItem | null>(null);
  const [contentTarget, setContentTarget] = useState<Partial<ProductSubjectSelection>>({});
  const [form, setForm] = useState({
    title: "",
    fileUrl: "",
    fileSizeBytes: 0,
    maxStreamQuality: "720p",
  });

  const headers = () => ({
    Authorization: `Bearer ${localStorage.getItem("authToken") || ""}`,
  });
  const jsonHeaders = () => ({
    ...headers(),
    "Content-Type": "application/json",
  });

  const probeClientFileSize = async (fileUrl: string): Promise<number> => {
    const url = resolveMediaUrl(fileUrl);
    if (!url) return 0;
    try {
      const res = await fetch(url, { method: "HEAD" });
      const cl = res.headers.get("content-length");
      const n = cl ? parseInt(cl, 10) : 0;
      return Number.isFinite(n) && n > 0 ? n : 0;
    } catch {
      return 0;
    }
  };

  const loadVideosAndSchools = async () => {
    const [v, sch] = await Promise.all([
      fetch(`${API_BASE_URL}/api/super-admin/curriculum/channel-content?channel=ott`, {
        headers: jsonHeaders(),
      }),
      fetch(`${API_BASE_URL}/api/super-admin/ott/schools`, { headers: jsonHeaders() }),
    ]);
    if (v.ok) {
      const j = await v.json();
      const rows: OttRow[] = j.data || [];
      const enriched = await Promise.all(
        rows.map(async (row) => {
          const existing = Number(row.size ?? row.fileSizeBytes) || 0;
          if (existing > 0) return { ...row, size: existing };
          const probed = await probeClientFileSize(row.fileUrl);
          return probed > 0 ? { ...row, size: probed } : row;
        }),
      );
      setVideos(enriched);
    }
    if (sch.ok) {
      const j = await sch.json();
      setSchools(j.data || []);
    }
  };

  const load = async () => {
    setLoading(true);
    const p = await fetchProducts();
    setProducts(p);
    await loadVideosAndSchools();
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const [schoolQuota, setSchoolQuota] = useState<SchoolOttQuota | null>(null);
  const [quotaResetting, setQuotaResetting] = useState(false);

  const loadSchoolQuota = async (sid: string) => {
    const { fetchSuperAdminSchoolOttQuota } = await import("@/lib/ott/quota-api");
    setSchoolQuota(await fetchSuperAdminSchoolOttQuota(sid));
  };

  useEffect(() => {
    if (!schoolId) {
      setRestrictions(null);
      setSchoolQuota(null);
      return;
    }
    fetch(`${API_BASE_URL}/api/super-admin/ott/schools/${schoolId}/restrictions`, {
      headers: jsonHeaders(),
    })
      .then((r) => r.json())
      .then((j) => setRestrictions(ensureRestrictionsShape(j.data || null)));
    void loadSchoolQuota(schoolId);
  }, [schoolId]);

  const filteredVideos = useMemo(() => {
    return videos.filter((v) => {
      if (catalogClassFilter !== "all" && String(v.classNumber) !== catalogClassFilter) {
        return false;
      }
      if (catalogProductFilter !== "all") {
        const code = String(v.productCode || "").trim();
        if (code !== catalogProductFilter) return false;
      }
      if (catalogSubjectFilter !== "all") {
        const name = extractPlainSubjectName(v.subject?.name || "").toLowerCase();
        if (name !== catalogSubjectFilter.toLowerCase()) return false;
      }
      return true;
    });
  }, [videos, catalogClassFilter, catalogProductFilter, catalogSubjectFilter]);

  const catalogSubjectNames = useMemo(() => {
    const names = new Set<string>();
    videos.forEach((v) => {
      const n = extractPlainSubjectName(v.subject?.name || "");
      if (n) names.add(n);
    });
    return [...names].sort();
  }, [videos]);

  const catalogProductOptions = useMemo(() => {
    const codes = new Set<string>();
    videos.forEach((v) => {
      const code = String(v.productCode || "").trim();
      if (code) codes.add(code);
    });
    return [...codes]
      .sort()
      .map((code) => ({ code, label: productLabel(code, products) || code }));
  }, [videos, products]);

  const ottRowToPlayer = (v: OttRow): EduOTTVideoCardItem => ({
    _id: v._id,
    id: v._id,
    title: v.title,
    fileUrl: v.fileUrl,
    videoUrl: resolveMediaUrl(v.fileUrl),
  });

  const previewMeta = (v: OttRow) => ({
    fileSizeBytes: Number(v.size ?? v.fileSizeBytes) || 0,
    classNumber: v.classNumber,
    subjectName: extractPlainSubjectName(v.subject?.name || ""),
    maxStreamQuality: v.maxStreamQuality,
    productCode: v.productCode,
  });

  const catalogTotalBytes = useMemo(
    () => videos.reduce((s, v) => s + (Number(v.size ?? v.fileSizeBytes) || 0), 0),
    [videos],
  );

  const videoClassNumbers = useMemo(() => {
    const nums = new Set<string>();
    videos.forEach((v) => {
      if (v.classNumber) nums.add(String(v.classNumber));
    });
    return [...nums].sort((a, b) => Number(a) - Number(b));
  }, [videos]);

  const handleUploadFile = async () => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    fd.append("contentType", "Video");
    const res = await fetch(
      `${API_BASE_URL}/api/super-admin/content/upload-file?contentType=Video`,
      { method: "POST", headers: headers(), body: fd },
    );
    setUploading(false);
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.fileUrl) {
      const bytes = Number(json.size) || file.size || 0;
      setForm((f) => ({ ...f, fileUrl: json.fileUrl, fileSizeBytes: bytes }));
      toast({
        title: "Uploaded",
        description: `Ready to add (${formatFileSize(bytes)})`,
      });
    } else {
      toast({ title: "Upload failed", description: json.message, variant: "destructive" });
    }
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contentTarget.classNumber) {
      toast({ title: "Select a class", variant: "destructive" });
      return;
    }
    if (!contentTarget.catalogSubject || !contentTarget.subjectId) {
      toast({
        title: "Select product & subject",
        description: "Set up curriculum for that class if the subject is not linked yet.",
        variant: "destructive",
      });
      return;
    }
    if (!form.fileUrl || form.fileUrl.includes("youtube")) {
      toast({
        title: "Upload required",
        description: "OTT videos must be uploaded files, not YouTube links.",
        variant: "destructive",
      });
      return;
    }
    setSaving(true);
    const res = await fetch(`${API_BASE_URL}/api/super-admin/curriculum/channel-content`, {
      method: "POST",
      headers: jsonHeaders(),
      body: JSON.stringify({
        contentChannel: "ott",
        productCode: contentTarget.productCode,
        subjectId: contentTarget.subjectId,
        classNumber: contentTarget.classNumber,
        title: form.title,
        fileUrl: form.fileUrl,
        size: form.fileSizeBytes,
        maxStreamQuality: form.maxStreamQuality,
      }),
    });
    setSaving(false);
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      const addedTitle = form.title.trim() || "Untitled";
      const productName =
        products.find((p) => p.code === contentTarget.productCode)?.name ||
        contentTarget.productCode ||
        "Product";
      const subjectLabel = contentTarget.catalogSubject || "Subject";
      const classLabel = contentTarget.classNumber || "";
      const sizeLabel = formatFileSize(form.fileSizeBytes);

      setLastAddedMessage({
        title: addedTitle,
        productName,
        subject: subjectLabel,
        classNumber: classLabel,
        sizeLabel,
      });

      toast({
        title: "Added to OTT catalog",
        description: `${addedTitle} · Class ${classLabel} · ${subjectLabel}`,
      });

      setForm((f) => ({ ...f, title: "", fileUrl: "", fileSizeBytes: 0 }));
      setFile(null);
      setContentTarget((prev) => ({
        ...prev,
        catalogSubject: "",
        classNumber: "",
        subjectId: "",
      }));
      loadVideosAndSchools();
    } else {
      toast({ title: "Failed", description: json.message, variant: "destructive" });
    }
  };

  const saveRestrictions = async () => {
    if (!schoolId || !restrictions) return;
    const res = await fetch(
      `${API_BASE_URL}/api/super-admin/ott/schools/${schoolId}/restrictions`,
      { method: "PUT", headers: jsonHeaders(), body: JSON.stringify(restrictions) },
    );
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      toast({ title: "Restrictions saved" });
      setRestrictions(json.data);
      await loadSchoolQuota(schoolId);
    } else {
      toast({ title: "Failed", description: json.message, variant: "destructive" });
    }
  };

  const resetSchoolQuota = async () => {
    if (!schoolId) return;
    if (
      !window.confirm(
        "Reset this school's OTT download quota for the current month? Students can download again within the GB limit.",
      )
    ) {
      return;
    }
    setQuotaResetting(true);
    const { resetSuperAdminSchoolOttQuota } = await import("@/lib/ott/quota-api");
    const result = await resetSuperAdminSchoolOttQuota(schoolId);
    setQuotaResetting(false);
    if (result.ok) {
      toast({ title: result.message || "Quota reset" });
      if (result.quota) setSchoolQuota(result.quota);
      else await loadSchoolQuota(schoolId);
    } else {
      toast({ title: "Failed", description: result.message, variant: "destructive" });
    }
  };

  const statusMeta = STATUSES.find((s) => s.value === restrictions?.status);

  return (
    <div className="viswam-ott-admin-cinema viswam-ott-admin-cinema-light">
      <section className="viswam-ott-admin-hero">
        <div className="viswam-ott-admin-hero-inner">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/90 mb-2">
            Premium streaming
          </p>
          <h1 className="viswam-ott-admin-hero-title">Viswam OTT Studio</h1>
          <p className="viswam-ott-admin-hero-sub">
            Upload cinematic lessons, configure school access, and curate your platform catalog — like a
            premium OTT control room.
          </p>
        </div>
      </section>

      <div className="viswam-ott-admin-tabs" role="tablist">
        {(
          [
            { id: "upload" as const, label: "Upload" },
            { id: "restrictions" as const, label: "School access" },
            { id: "catalog" as const, label: "Catalog" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={studioTab === t.id}
            className={cn("viswam-ott-admin-tab", studioTab === t.id && "viswam-ott-admin-tab-active")}
            onClick={() => {
              setStudioTab(t.id);
              if (t.id !== "upload") setLastAddedMessage(null);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="viswam-ott-admin-notice px-4 sm:px-6">
        <Lock className="h-5 w-5 text-[var(--brand-gold)] shrink-0 mt-0.5" />
        <div className="space-y-1 text-left">
          <p className="font-semibold text-white">Strict student visibility</p>
          <ul className="list-disc pl-4 text-slate-400 space-y-0.5 text-sm">
            <li>
              Only students in the <strong className="text-slate-200">same class</strong> see videos in EduOTT.
            </li>
            <li>
              Product must be in the class library with a valid school license.
            </li>
            <li>Server-side OTT plan limits always apply.</li>
          </ul>
        </div>
      </div>

      <div className="viswam-ott-admin-body space-y-6">
      {studioTab === "upload" && (
        <div className="viswam-ott-admin-panel max-w-2xl mx-auto">
        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader className="px-0 pt-0 pb-4">
            <CardTitle className="viswam-ott-upload-title text-lg flex items-center justify-center gap-2 text-emerald-800">
              <Play className="h-5 w-5 text-emerald-600" />
              Upload OTT video
            </CardTitle>
            <p className="viswam-ott-upload-sub text-sm font-normal text-center">
              Choose product, subject, and class in order — then upload your video file.
            </p>
          </CardHeader>
          <CardContent className="px-0 pb-0">
            <form onSubmit={handleSaveVideo} className="viswam-ott-upload-form space-y-4">
              <ProductSubjectPicker
                products={products}
                value={contentTarget}
                onChange={setContentTarget}
                className="ott-picker-mint"
              />

              <div className="viswam-ott-mint-field space-y-1">
                <Label>Video title</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Chapter 1 — Introduction"
                />
              </div>
              <div className="viswam-ott-mint-field space-y-2">
                <Label>Video file</Label>
                <Input
                  type="file"
                  accept="video/*"
                  onChange={(e) => {
                    const picked = e.target.files?.[0] || null;
                    setFile(picked);
                    if (picked) {
                      setForm((f) => ({ ...f, fileSizeBytes: picked.size }));
                    }
                  }}
                />
                {file ? (
                  <p className="text-xs text-slate-600 flex items-center gap-1">
                    <HardDrive className="h-3.5 w-3.5" />
                    Selected: {file.name} · {formatFileSize(file.size)}
                  </p>
                ) : null}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!file || uploading}
                  onClick={handleUploadFile}
                  className="viswam-ott-btn-upload-outline"
                >
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  Upload to server
                </Button>
                {form.fileUrl ? (
                  <p className="text-xs text-emerald-700 flex flex-wrap items-center gap-2">
                    <span className="truncate">Ready to publish</span>
                    <Badge variant="secondary" className="shrink-0 bg-emerald-100 text-emerald-900">
                      {formatFileSize(form.fileSizeBytes)}
                    </Badge>
                  </p>
                ) : null}
              </div>
              <div className="viswam-ott-mint-field space-y-1">
                <Label>Max quality</Label>
                <Select
                  value={form.maxStreamQuality}
                  onValueChange={(v) => setForm((f) => ({ ...f, maxStreamQuality: v }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="480p">480p</SelectItem>
                    <SelectItem value="720p">720p</SelectItem>
                    <SelectItem value="1080p">1080p</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {lastAddedMessage ? (
                <div
                  className="viswam-ott-added-banner rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-4 flex gap-3"
                  role="status"
                >
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-600 mt-0.5" />
                  <div className="min-w-0 flex-1 space-y-1">
                    <p className="font-semibold text-emerald-900">Video added to OTT catalog</p>
                    <p className="text-sm text-emerald-800">
                      <strong>{lastAddedMessage.title}</strong> is live for students in{" "}
                      <strong>Class {lastAddedMessage.classNumber}</strong>.
                    </p>
                    <p className="text-xs text-emerald-700/90 flex flex-wrap gap-1 items-center">
                      <span>{lastAddedMessage.productName}</span>
                      <span>·</span>
                      <span>{lastAddedMessage.subject}</span>
                      {lastAddedMessage.sizeLabel ? (
                        <>
                          <span>·</span>
                          <span>{lastAddedMessage.sizeLabel}</span>
                        </>
                      ) : null}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-emerald-400 text-emerald-800 hover:bg-emerald-100"
                        onClick={() => setStudioTab("catalog")}
                      >
                        View in catalog
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="text-emerald-700"
                        onClick={() => setLastAddedMessage(null)}
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={saving}
                className="viswam-ott-btn-primary"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
                Add to OTT catalog
              </Button>
            </form>
          </CardContent>
        </Card>
        </div>
      )}

      {studioTab === "restrictions" && (
        <div className="viswam-ott-admin-panel viswam-ott-restrictions-panel max-w-3xl mx-auto">
        <Card className="border-0 bg-transparent shadow-none">
          <CardHeader className="px-0 pt-0">
            <CardTitle className="text-lg flex items-center justify-center gap-2 text-emerald-950">
              <Shield className="h-5 w-5 text-emerald-600" />
              School OTT restrictions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label>School</Label>
              <Select value={schoolId || "_"} onValueChange={(v) => setSchoolId(v === "_" ? "" : v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select school" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_">Select…</SelectItem>
                  {schools.map((s) => (
                    <SelectItem key={s._id} value={s._id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {restrictions && statusMeta ? (
              <>
                <div className="flex flex-wrap gap-2 items-center">
                  <Badge className={statusMeta.className}>{statusMeta.label}</Badge>
                  <Badge variant="outline">Plan: {restrictions.plan}</Badge>
                </div>
                <OttMonthlyQuotaCard
                  quota={schoolQuota}
                  variant="super-admin"
                  onReset={() => void resetSchoolQuota()}
                  resetting={quotaResetting}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>Plan</Label>
                    <Select
                      value={restrictions.plan}
                      onValueChange={(v) => setRestrictions((r) => (r ? { ...r, plan: v } : r))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PLANS.map((p) => (
                          <SelectItem key={p} value={p}>
                            {p}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Status</Label>
                    <Select
                      value={restrictions.status}
                      onValueChange={(v) => setRestrictions((r) => (r ? { ...r, status: v } : r))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                  <span className="text-sm text-slate-700">Downloads enabled</span>
                  <Switch
                    checked={!!restrictions.features?.downloads}
                    onCheckedChange={(c) =>
                      setRestrictions((r) =>
                        r ? { ...r, features: { ...r.features, downloads: c } } : r,
                      )
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-slate-100 px-3 py-2">
                  <span className="text-sm text-slate-700">HD streaming (legacy)</span>
                  <Switch
                    checked={!!restrictions.features?.hdStreaming}
                    onCheckedChange={(c) =>
                      setRestrictions((r) =>
                        r ? { ...r, features: { ...r.features, hdStreaming: c } } : r,
                      )
                    }
                  />
                </div>
                <p className="text-xs text-slate-500">
                  OTT is mobile download-only on the website (no streaming). Quota resets each calendar
                  month. Downloads cannot be removed by students once saved.
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label>School monthly download quota (GB)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={1}
                      value={restrictions.limits?.schoolMonthlyDownloadGB ?? 10}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        setRestrictions((r) =>
                          r
                            ? {
                                ...r,
                                limits: {
                                  ...r.limits,
                                  schoolMonthlyDownloadGB: Number.isFinite(v) ? v : 0,
                                },
                              }
                            : r,
                        );
                      }}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label>Default per-student cap (GB, optional)</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.5}
                      placeholder="No individual cap"
                      value={restrictions.limits?.defaultStudentMonthlyDownloadGB ?? ""}
                      onChange={(e) => {
                        const v = e.target.value === "" ? 0 : Number(e.target.value);
                        setRestrictions((r) =>
                          r
                            ? {
                                ...r,
                                limits: {
                                  ...r.limits,
                                  defaultStudentMonthlyDownloadGB: Number.isFinite(v) ? v : 0,
                                },
                              }
                            : r,
                        );
                      }}
                    />
                  </div>
                </div>
                <OttSchoolAccessEditor
                  restrictions={restrictions}
                  videos={videos}
                  onChange={setRestrictions}
                />

                <Button
                  type="button"
                  onClick={saveRestrictions}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Save restrictions
                </Button>
              </>
            ) : (
              <p className="text-sm text-slate-500">Select a school to configure OTT limits.</p>
            )}
          </CardContent>
        </Card>
        </div>
      )}

      {studioTab === "catalog" && (
      <div className="viswam-ott-admin-catalog">
        <div className="h-1 bg-gradient-to-r from-[var(--brand-navy)] via-[var(--brand-emerald)] to-[var(--brand-gold)]" />
        <CardHeader className="viswam-ott-admin-catalog-header space-y-3">
          <CardTitle className="text-base font-bold flex items-center justify-center gap-2">
            OTT catalog ({filteredVideos.length}
            {filteredVideos.length !== videos.length ? ` of ${videos.length}` : ""})
          </CardTitle>
          {catalogTotalBytes > 0 ? (
            <p className="text-sm font-semibold text-[var(--brand-navy)] flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-[var(--brand-emerald)]" />
              Total storage: {formatFileSize(catalogTotalBytes)}
            </p>
          ) : null}
          {videos.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <div className="flex rounded-lg border border-slate-200 overflow-hidden h-9">
                <Button
                  type="button"
                  variant={catalogView === "grid" ? "default" : "ghost"}
                  size="icon"
                  className={cn(
                    "h-9 w-9 rounded-none",
                    catalogView === "grid" && "bg-[var(--brand-navy)] hover:bg-[var(--brand-navy-hover)]",
                  )}
                  onClick={() => setCatalogView("grid")}
                  aria-label="Grid view"
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant={catalogView === "list" ? "default" : "ghost"}
                  size="icon"
                  className={cn(
                    "h-9 w-9 rounded-none",
                    catalogView === "list" && "bg-[var(--brand-navy)] hover:bg-[var(--brand-navy-hover)]",
                  )}
                  onClick={() => setCatalogView("list")}
                  aria-label="List view"
                >
                  <LayoutList className="h-4 w-4" />
                </Button>
              </div>
              <Select value={catalogClassFilter} onValueChange={setCatalogClassFilter}>
                <SelectTrigger className="w-[130px] h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All classes</SelectItem>
                  {videoClassNumbers.map((c) => (
                    <SelectItem key={c} value={c}>
                      Class {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={catalogProductFilter} onValueChange={setCatalogProductFilter}>
                <SelectTrigger className="w-[160px] h-9">
                  <SelectValue placeholder="Product" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All products</SelectItem>
                  {catalogProductOptions.map((p) => (
                    <SelectItem key={p.code} value={p.code}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={catalogSubjectFilter} onValueChange={setCatalogSubjectFilter}>
                <SelectTrigger className="w-[140px] h-9">
                  <SelectValue placeholder="Subject" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All subjects</SelectItem>
                  {catalogSubjectNames.map((n) => (
                    <SelectItem key={n} value={n}>
                      {n}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {loading ? (
            <Loader2 className="h-6 w-6 animate-spin mx-auto text-[var(--brand-emerald)]" />
          ) : videos.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No OTT videos yet.</p>
          ) : filteredVideos.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-6">No videos match these filters.</p>
          ) : catalogView === "grid" ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredVideos.map((v) => (
                <OttCatalogCard
                  key={v._id}
                  row={v}
                  onWatch={() => setPreviewVideo(ottRowToPlayer(v))}
                  onDelete={async () => {
                    if (!confirm(`Remove "${v.title}" from OTT catalog?`)) return;
                    await fetch(
                      `${API_BASE_URL}/api/super-admin/curriculum/channel-content/${v._id}`,
                      { method: "DELETE", headers: jsonHeaders() },
                    );
                    if (previewVideo?._id === v._id) setPreviewVideo(null);
                    loadVideosAndSchools();
                  }}
                />
              ))}
            </div>
          ) : (
            <ul className="space-y-3">
              {filteredVideos.map((v) => (
                <li
                  key={v._id}
                  className={cn(
                    "rounded-xl border border-slate-200 bg-white overflow-hidden",
                    "hover:border-[var(--brand-emerald)]/40 transition-colors",
                  )}
                >
                  <div className="flex flex-col sm:flex-row">
                    <button
                      type="button"
                      className="relative sm:w-56 shrink-0 aspect-video bg-slate-900 flex items-center justify-center group"
                      onClick={() => setPreviewVideo(ottRowToPlayer(v))}
                    >
                      <Film className="h-10 w-10 text-slate-600" />
                      <span className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="rounded-full bg-[var(--brand-emerald)] p-3">
                          <Play className="h-6 w-6 text-white fill-white" />
                        </span>
                      </span>
                    </button>
                    <div className="flex-1 p-4 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-semibold text-[var(--brand-navy)]">{v.title}</p>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            type="button"
                            size="sm"
                            className="bg-[var(--brand-emerald)] hover:bg-[var(--brand-emerald-hover)] h-8"
                            onClick={() => setPreviewVideo(ottRowToPlayer(v))}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Watch
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={async () => {
                              if (!confirm(`Remove "${v.title}"?`)) return;
                              await fetch(
                                `${API_BASE_URL}/api/super-admin/curriculum/channel-content/${v._id}`,
                                { method: "DELETE", headers: jsonHeaders() },
                              );
                              loadVideosAndSchools();
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge className="bg-[var(--brand-navy)] text-white">
                          Class {v.classNumber || "—"}
                        </Badge>
                        <Badge
                          variant="outline"
                          className="border-[var(--brand-emerald)] text-[var(--brand-emerald)]"
                        >
                          {extractPlainSubjectName(v.subject?.name || "—")}
                        </Badge>
                        <Badge variant="secondary">{v.maxStreamQuality || "720p"}</Badge>
                        <Badge
                          className={cn(
                            "gap-1 font-semibold",
                            (v.size ?? 0) > 0
                              ? "bg-[var(--brand-gold)]/20 text-[var(--brand-navy)] border-amber-300"
                              : "bg-amber-50 text-amber-800",
                          )}
                        >
                          <HardDrive className="h-3 w-3" />
                          {formatFileSize(v.size ?? v.fileSizeBytes)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </div>
      )}
      </div>

      <EduOTTVideoPlayerDialog
        video={previewVideo}
        open={!!previewVideo}
        onOpenChange={(open) => !open && setPreviewVideo(null)}
        meta={
          previewVideo
            ? previewMeta(
                videos.find((x) => x._id === previewVideo._id) || {
                  _id: previewVideo._id || "",
                  title: previewVideo.title,
                  fileUrl: previewVideo.fileUrl || "",
                },
              )
            : undefined
        }
      />
    </div>
  );
}

function OttCatalogCard({
  row,
  onWatch,
  onDelete,
}: {
  row: OttRow;
  onWatch: () => void;
  onDelete: () => void;
}) {
  const bytes = Number(row.size ?? row.fileSizeBytes) || 0;
  const sizeLabel = formatFileSize(bytes);
  const hasSize = bytes > 0;
  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--brand-emerald)]/40 hover:shadow-xl">
      <button
        type="button"
        className="relative w-full aspect-video bg-gradient-to-br from-[var(--brand-navy)] via-slate-800 to-teal-900 flex items-center justify-center"
        onClick={onWatch}
      >
        <Film className="h-14 w-14 text-white/25" />
        <span className="absolute inset-0 flex items-center justify-center bg-black/25 opacity-90 transition-opacity group-hover:bg-black/40">
          <span className="rounded-full bg-[var(--brand-emerald)] p-4 shadow-xl ring-4 ring-[var(--brand-gold)]/40">
            <Play className="h-8 w-8 fill-white text-white" />
          </span>
        </span>
        <div className="absolute top-2 left-2 flex flex-wrap gap-1">
          <Badge className="bg-black/75 text-white border-0 shadow">Class {row.classNumber || "—"}</Badge>
          <Badge className="bg-[var(--brand-gold)]/95 text-[var(--brand-navy)] border-0 shadow">
            {row.maxStreamQuality || "720p"}
          </Badge>
        </div>
        <div
          className={cn(
            "absolute bottom-2 right-2 rounded-lg px-2.5 py-1.5 shadow-lg border",
            hasSize
              ? "bg-[var(--brand-gold)] text-[var(--brand-navy)] border-amber-300"
              : "bg-black/85 text-white border-white/20",
          )}
        >
          <p className="text-[10px] font-semibold uppercase leading-none opacity-80">Size</p>
          <p className="text-sm font-bold leading-tight">{sizeLabel}</p>
        </div>
      </button>
      <div className="space-y-3 p-4">
        <h3 className="font-bold leading-snug text-[var(--brand-navy)] line-clamp-2 min-h-[2.75rem]">
          {row.title}
        </h3>
        <div
          className={cn(
            "flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5",
            hasSize
              ? "border-[var(--brand-navy)]/15 bg-[var(--brand-navy)]/5"
              : "border-amber-200 bg-amber-50",
          )}
        >
          <span className="flex items-center gap-2 text-sm font-medium text-slate-600">
            <HardDrive className="h-4 w-4 text-[var(--brand-emerald)]" />
            File size
          </span>
          <span
            className={cn(
              "text-base font-bold tabular-nums",
              hasSize ? "text-[var(--brand-navy)]" : "text-amber-700",
            )}
          >
            {sizeLabel}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge variant="outline" className="border-emerald-200 text-[var(--brand-emerald)]">
            {extractPlainSubjectName(row.subject?.name || "Product")}
          </Badge>
          <Badge variant="secondary">{row.maxStreamQuality || "720p"}</Badge>
        </div>
        <p className="text-[11px] text-slate-500 flex items-center gap-1">
          <Lock className="h-3 w-3" />
          Stream only — students cannot download
        </p>
        <div className="flex gap-2 pt-1">
          <Button
            type="button"
            className="flex-1 bg-[var(--brand-emerald)] hover:bg-[var(--brand-emerald-hover)] shadow-sm"
            onClick={onWatch}
          >
            <Eye className="mr-2 h-4 w-4" />
            Preview
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="border-red-200 hover:bg-red-50"
            onClick={onDelete}
            title="Remove from catalog"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>
    </article>
  );
}
