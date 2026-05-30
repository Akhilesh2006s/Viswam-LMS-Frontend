import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Package, Plus, Loader2, Trash2, X, BookOpen, Save } from "lucide-react";
import {
  fetchProducts,
  deleteProduct,
  updateProduct,
  type Product,
} from "@/lib/products";
import { API_BASE_URL } from "@/lib/api-config";
import { SuperAdminPageHeader } from "@/components/super-admin/premium";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

function SubjectChips({
  subjects,
  onRemove,
}: {
  subjects: string[];
  onRemove?: (name: string) => void;
}) {
  if (!subjects.length) {
    return <p className="text-xs text-slate-400">No subjects yet — add at least one.</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {subjects.map((s) => (
        <Badge
          key={s}
          variant="secondary"
          className="gap-1 pr-1 bg-[var(--brand-emerald)]/10 text-[var(--brand-navy)] border border-[var(--brand-emerald)]/25"
        >
          {s}
          {onRemove && (
            <button
              type="button"
              className="rounded-full hover:bg-red-100 p-0.5"
              onClick={() => onRemove(s)}
              aria-label={`Remove ${s}`}
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </Badge>
      ))}
    </div>
  );
}

function SubjectEditor({
  subjects,
  onChange,
  onSave,
  saving,
}: {
  subjects: string[];
  onChange: (next: string[]) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    if (subjects.some((s) => s.toLowerCase() === name.toLowerCase())) {
      setDraft("");
      return;
    }
    onChange([...subjects, name]);
    setDraft("");
  };

  return (
    <div className="space-y-2 mt-3 pt-3 border-t border-slate-100">
      <p className="text-xs font-semibold text-[var(--brand-navy)] flex items-center gap-1">
        <BookOpen className="h-3.5 w-3.5 text-[var(--brand-emerald)]" />
        Subjects (products under this book line)
      </p>
      <SubjectChips subjects={subjects} onRemove={(n) => onChange(subjects.filter((s) => s !== n))} />
      <div className="flex gap-2">
        <Input
          placeholder="e.g. Abacus, Mathematics"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
          className="h-9"
        />
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <Button
        type="button"
        size="sm"
        variant="outline"
        className="w-full border-[var(--brand-emerald)]/40 text-[var(--brand-emerald)]"
        onClick={onSave}
        disabled={saving || subjects.length === 0}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
        Save subjects
      </Button>
    </div>
  );
}

export default function ProductManagement() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);
  const [savingSubjectsCode, setSavingSubjectsCode] = useState<string | null>(null);
  const [editSubjects, setEditSubjects] = useState<Record<string, string[]>>({});
  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    catalogSubjects: [] as string[],
  });
  const [newSubjectDraft, setNewSubjectDraft] = useState("");

  const load = async () => {
    setLoading(true);
    const list = await fetchProducts();
    setProducts(list);
    const map: Record<string, string[]> = {};
    list.forEach((p) => {
      map[p.code] = [...(p.catalogSubjects || [])];
    });
    setEditSubjects(map);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const addSubjectToForm = () => {
    const name = newSubjectDraft.trim();
    if (!name) return;
    if (form.catalogSubjects.some((s) => s.toLowerCase() === name.toLowerCase())) {
      setNewSubjectDraft("");
      return;
    }
    setForm((f) => ({ ...f, catalogSubjects: [...f.catalogSubjects, name] }));
    setNewSubjectDraft("");
  };

  const handleCreate = async () => {
    if (!form.code.trim() || !form.name.trim()) return;
    if (form.catalogSubjects.length === 0) {
      toast({
        title: "Add at least one subject",
        description: "Each product needs subjects (e.g. Abacus, Mathematics).",
        variant: "destructive",
      });
      return;
    }
    setCreating(true);
    const token = localStorage.getItem("authToken");
    const res = await fetch(`${API_BASE_URL}/api/super-admin/products`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token || ""}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        code: form.code.trim().toUpperCase().replace(/\s+/g, "_"),
        name: form.name.trim(),
        description: form.description.trim(),
        catalogSubjects: form.catalogSubjects,
        isPremium: true,
      }),
    });
    setCreating(false);
    if (res.ok) {
      setForm({ code: "", name: "", description: "", catalogSubjects: [] });
      setNewSubjectDraft("");
      toast({ title: "Product created" });
      await load();
    } else {
      const j = await res.json().catch(() => ({}));
      toast({ title: "Failed", description: j.message, variant: "destructive" });
    }
  };

  const saveProductSubjects = async (p: Product) => {
    const subjects = editSubjects[p.code] || [];
    if (!subjects.length) {
      toast({ title: "Add at least one subject", variant: "destructive" });
      return;
    }
    setSavingSubjectsCode(p.code);
    const result = await updateProduct(p.code, { catalogSubjects: subjects });
    setSavingSubjectsCode(null);
    if (result.ok) {
      toast({ title: "Subjects saved", description: p.name });
      await load();
    } else {
      toast({ title: "Failed", description: result.message, variant: "destructive" });
    }
  };

  const handleDelete = async (p: Product) => {
    setDeletingCode(p.code);
    const result = await deleteProduct(p.code);
    setDeletingCode(null);
    if (result.ok) {
      toast({ title: "Deleted", description: `"${p.name}" was removed from the catalog.` });
      await load();
    } else {
      toast({
        title: "Cannot delete",
        description: result.message || "Failed to delete product",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="sa-premium-scope space-y-6">
      <SuperAdminPageHeader
        title="Product catalog"
        description="Each product is a book line. Add multiple subjects per product — then use Content studio, Learning paths, and Viswam OTT per product → subject → class."
        icon={Package}
      />

      <Card className="rounded-2xl border-2 border-[var(--brand-navy)]/10">
        <CardHeader>
          <CardTitle className="text-lg text-[var(--brand-navy)]">Add product</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <Label>Code</Label>
              <Input
                placeholder="e.g. ABACUS"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
              />
            </div>
            <div>
              <Label>Name</Label>
              <Input
                placeholder="Display name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                placeholder="Optional"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
          </div>
          <div className="rounded-xl border border-[var(--brand-emerald)]/20 bg-emerald-50/40 p-4 space-y-2">
            <Label className="text-[var(--brand-navy)]">Subjects for this product</Label>
            <SubjectChips
              subjects={form.catalogSubjects}
              onRemove={(n) =>
                setForm((f) => ({
                  ...f,
                  catalogSubjects: f.catalogSubjects.filter((s) => s !== n),
                }))
              }
            />
            <div className="flex gap-2 max-w-md">
              <Input
                placeholder="Subject name, press Enter"
                value={newSubjectDraft}
                onChange={(e) => setNewSubjectDraft(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSubjectToForm())}
              />
              <Button type="button" variant="outline" onClick={addSubjectToForm}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <Button
            type="button"
            className="w-fit rounded-xl bg-[var(--brand-navy)] hover:bg-[var(--brand-navy-hover)]"
            onClick={handleCreate}
            disabled={creating}
          >
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
            Create product
          </Button>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-emerald)]" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <Card
              key={p.code}
              className={cn(
                "rounded-2xl border-2",
                (editSubjects[p.code]?.length || 0) > 0
                  ? "border-[var(--brand-emerald)]/20"
                  : "border-amber-200/80",
              )}
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base pr-2 text-[var(--brand-navy)]">{p.name}</CardTitle>
                  <div className="flex shrink-0 items-center gap-1">
                    {p.isPremium ? (
                      <Badge className="bg-[var(--brand-emerald)]">Premium</Badge>
                    ) : (
                      <Badge variant="outline">Standard</Badge>
                    )}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50"
                          disabled={deletingCode === p.code}
                          aria-label={`Delete ${p.name}`}
                        >
                          {deletingCode === p.code ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete product?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Remove <strong>{p.name}</strong> ({p.code}) from the catalog. This
                            cannot be undone. Products assigned to schools must be unassigned first.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => handleDelete(p)}
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                <p className="text-xs font-mono text-slate-500">{p.code}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 line-clamp-2">{p.description || "—"}</p>
                <SubjectEditor
                  subjects={editSubjects[p.code] || []}
                  onChange={(next) => setEditSubjects((m) => ({ ...m, [p.code]: next }))}
                  onSave={() => saveProductSubjects(p)}
                  saving={savingSubjectsCode === p.code}
                />
                {p.allowedContentTypes?.length ? (
                  <p className="mt-2 text-xs text-slate-400">
                    Content types: {p.allowedContentTypes.join(", ")}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
