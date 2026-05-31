import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Package, Plus, Loader2, Trash2, X, Save, Layers, GraduationCap } from "lucide-react";
import {
  fetchProducts,
  deleteProduct,
  updateProduct,
  type Product,
  type ProductStructureType,
  type SubjectsByClass,
  isLevelBasedProduct,
  normalizeClassNumber,
  getProductClassNumbers,
  getProductLevelNumbers,
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

export type ProductCatalogEdit = {
  structureType: ProductStructureType;
  catalogClassNumbers: string[];
  sameSubjectsForAllClasses: boolean;
  catalogSubjects: string[];
  subjectsByClass: SubjectsByClass;
  catalogCategories: string[];
};

function productToEdit(p: Product): ProductCatalogEdit {
  const slotNumbers = isLevelBasedProduct(p)
    ? getProductLevelNumbers(p)
    : getProductClassNumbers(p);
  return {
    structureType: p.structureType || "class_based",
    catalogClassNumbers: slotNumbers,
    sameSubjectsForAllClasses: p.sameSubjectsForAllClasses !== false,
    catalogSubjects: [...(p.catalogSubjects || [])],
    subjectsByClass: { ...(p.subjectsByClass || {}) },
    catalogCategories: [...(p.catalogCategories || [])],
  };
}

function validateClassBased(edit: ProductCatalogEdit): string | null {
  if (edit.structureType !== "class_based") return null;
  if (!edit.catalogClassNumbers.length) {
    return "Add at least one class for this product.";
  }
  return null;
}

function validateLevelBased(edit: ProductCatalogEdit): string | null {
  if (edit.structureType !== "level_based") return null;
  if (!edit.catalogClassNumbers.length) {
    return "Add at least one level for this product.";
  }
  return null;
}

function validateCatalog(edit: ProductCatalogEdit): string | null {
  return validateClassBased(edit) || validateLevelBased(edit);
}

function buildSavePayload(edit: ProductCatalogEdit) {
  if (edit.structureType === "level_based") {
    return {
      structureType: edit.structureType,
      catalogClassNumbers: edit.catalogClassNumbers,
      catalogCategories: edit.catalogCategories,
    };
  }
  return {
    structureType: edit.structureType,
    catalogClassNumbers: edit.catalogClassNumbers,
    sameSubjectsForAllClasses: edit.sameSubjectsForAllClasses,
    catalogSubjects: edit.sameSubjectsForAllClasses ? edit.catalogSubjects : [],
    subjectsByClass: edit.sameSubjectsForAllClasses ? {} : edit.subjectsByClass,
  };
}

function TagChips({
  tags,
  emptyHint,
  onRemove,
}: {
  tags: string[];
  emptyHint: string;
  onRemove?: (name: string) => void;
}) {
  if (!tags.length) {
    return <p className="text-xs text-slate-400">{emptyHint}</p>;
  }
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((s) => (
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

function TagInputRow({
  placeholder,
  onAdd,
}: {
  placeholder: string;
  onAdd: (name: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const submit = () => {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setDraft("");
  };
  return (
    <div className="flex gap-2 max-w-md">
      <Input
        placeholder={placeholder}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), submit())}
        className="h-9"
      />
      <Button type="button" variant="outline" size="sm" onClick={submit}>
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

function SlotNumbersEditor({
  numbers,
  onChange,
  variant,
}: {
  numbers: string[];
  onChange: (next: string[]) => void;
  variant: "class" | "level";
}) {
  const label = variant === "level" ? "Level" : "Class";
  const Icon = variant === "level" ? Layers : GraduationCap;
  const add = (raw: string) => {
    const cn = normalizeClassNumber(raw);
    if (!cn || numbers.includes(cn)) return;
    onChange([...numbers, cn].sort((a, b) => Number(a) - Number(b)));
  };
  return (
    <div className="space-y-2">
      <Label className="text-[var(--brand-navy)] flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-[var(--brand-emerald)]" />
        {label}s <span className="text-red-600">*</span>
      </Label>
      <TagChips
        tags={numbers.map((n) => `${label} ${n}`)}
        emptyHint={`Required — add ${label.toLowerCase()} numbers (e.g. 1, 2, 10) and press Enter.`}
        onRemove={(chip) => {
          const n = chip.replace(new RegExp(`^${label}\\s+`, "i"), "");
          onChange(numbers.filter((c) => c !== n));
        }}
      />
      <TagInputRow placeholder={`${label} number, press Enter`} onAdd={add} />
    </div>
  );
}

function SubjectTagsEditor({
  subjects,
  onChange,
  title,
}: {
  subjects: string[];
  onChange: (next: string[]) => void;
  title?: string;
}) {
  const add = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || subjects.some((s) => s.toLowerCase() === trimmed.toLowerCase())) return;
    onChange([...subjects, trimmed]);
  };
  return (
    <div className="space-y-2">
      {title ? <p className="text-xs font-medium text-[var(--brand-navy)]">{title}</p> : null}
      <TagChips
        tags={subjects}
        emptyHint="No subjects yet."
        onRemove={(n) => onChange(subjects.filter((s) => s !== n))}
      />
      <TagInputRow placeholder="Subject name, press Enter" onAdd={add} />
    </div>
  );
}

function ClassBasedCatalogBlock({
  edit,
  onChange,
  showSave,
  onSave,
  saving,
}: {
  edit: ProductCatalogEdit;
  onChange: (next: ProductCatalogEdit) => void;
  showSave?: boolean;
  onSave?: () => void;
  saving?: boolean;
}) {
  const setClasses = (catalogClassNumbers: string[]) => {
    const subjectsByClass = { ...edit.subjectsByClass };
    catalogClassNumbers.forEach((cn) => {
      if (!subjectsByClass[cn]) subjectsByClass[cn] = [];
    });
    Object.keys(subjectsByClass).forEach((cn) => {
      if (!catalogClassNumbers.includes(cn)) delete subjectsByClass[cn];
    });
    onChange({ ...edit, catalogClassNumbers, subjectsByClass });
  };

  return (
    <div className="rounded-xl border border-[var(--brand-emerald)]/20 bg-emerald-50/40 p-4 space-y-4">
      <SlotNumbersEditor
        numbers={edit.catalogClassNumbers}
        onChange={setClasses}
        variant="class"
      />

      <div className="flex items-center gap-2 pt-1">
        <Checkbox
          id="same-subjects-all"
          checked={edit.sameSubjectsForAllClasses}
          onCheckedChange={(checked) =>
            onChange({
              ...edit,
              sameSubjectsForAllClasses: checked === true,
            })
          }
        />
        <Label htmlFor="same-subjects-all" className="font-normal cursor-pointer text-sm">
          Same subjects for all classes
        </Label>
      </div>

      {edit.sameSubjectsForAllClasses ? (
        <div className="space-y-2 pl-0">
          <Label className="text-[var(--brand-navy)]">
            Subjects <span className="text-slate-500 font-normal">(optional)</span>
          </Label>
          <SubjectTagsEditor
            subjects={edit.catalogSubjects}
            onChange={(catalogSubjects) => onChange({ ...edit, catalogSubjects })}
          />
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-slate-600">
            Add subjects separately for each class. Add classes above first.
          </p>
          {edit.catalogClassNumbers.length === 0 ? (
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-2">
              Add at least one class to set subjects per class.
            </p>
          ) : (
            edit.catalogClassNumbers.map((cn) => (
              <div
                key={cn}
                className="rounded-lg border border-white/80 bg-white/70 p-3 space-y-2"
              >
                <SubjectTagsEditor
                  title={`Class ${cn}`}
                  subjects={edit.subjectsByClass[cn] || []}
                  onChange={(list) =>
                    onChange({
                      ...edit,
                      subjectsByClass: { ...edit.subjectsByClass, [cn]: list },
                    })
                  }
                />
              </div>
            ))
          )}
        </div>
      )}

      {showSave && onSave ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full border-[var(--brand-emerald)]/40 text-[var(--brand-emerald)]"
          onClick={onSave}
          disabled={saving || edit.catalogClassNumbers.length === 0}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save catalog setup
        </Button>
      ) : null}
    </div>
  );
}

function LevelBasedCatalogBlock({
  edit,
  onChange,
  showSave,
  onSave,
  saving,
}: {
  edit: ProductCatalogEdit;
  onChange: (next: ProductCatalogEdit) => void;
  showSave?: boolean;
  onSave?: () => void;
  saving?: boolean;
}) {
  const addCategory = (name: string) => {
    const trimmed = name.trim();
    if (
      !trimmed ||
      edit.catalogCategories.some((s) => s.toLowerCase() === trimmed.toLowerCase())
    ) {
      return;
    }
    onChange({ ...edit, catalogCategories: [...edit.catalogCategories, trimmed] });
  };
  return (
    <div className="rounded-xl border border-[var(--brand-emerald)]/20 bg-emerald-50/40 p-4 space-y-4">
      <SlotNumbersEditor
        numbers={edit.catalogClassNumbers}
        onChange={(catalogClassNumbers) => onChange({ ...edit, catalogClassNumbers })}
        variant="level"
      />
      <div className="space-y-2 pt-1 border-t border-[var(--brand-emerald)]/15">
        <Label className="text-[var(--brand-navy)] flex items-center gap-1">
          <Layers className="h-3.5 w-3.5 text-[var(--brand-emerald)]" />
          Categories <span className="text-slate-500 font-normal">(optional)</span>
        </Label>
        <p className="text-xs text-slate-600">
          Category names apply across all levels (e.g. Beginner, Intermediate). Content studio uses
          each level as a separate slot.
        </p>
        <TagChips
          tags={edit.catalogCategories}
          emptyHint="No categories yet."
          onRemove={(n) =>
            onChange({
              ...edit,
              catalogCategories: edit.catalogCategories.filter((s) => s !== n),
            })
          }
        />
        <TagInputRow placeholder="Category name, press Enter" onAdd={addCategory} />
      </div>
      {showSave && onSave ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="w-full border-[var(--brand-emerald)]/40 text-[var(--brand-emerald)]"
          onClick={onSave}
          disabled={saving || edit.catalogClassNumbers.length === 0}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Save catalog setup
        </Button>
      ) : null}
    </div>
  );
}

const emptyForm = (): ProductCatalogEdit => ({
  structureType: "class_based",
  catalogClassNumbers: [],
  sameSubjectsForAllClasses: true,
  catalogSubjects: [],
  subjectsByClass: {},
  catalogCategories: [],
});

export default function ProductManagement() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [deletingCode, setDeletingCode] = useState<string | null>(null);
  const [savingCatalogCode, setSavingCatalogCode] = useState<string | null>(null);
  const [editCatalog, setEditCatalog] = useState<Record<string, ProductCatalogEdit>>({});
  const [form, setForm] = useState<ProductCatalogEdit>(emptyForm());
  const [formMeta, setFormMeta] = useState({ code: "", name: "", description: "" });

  const load = async () => {
    setLoading(true);
    const list = await fetchProducts();
    setProducts(list);
    const map: Record<string, ProductCatalogEdit> = {};
    list.forEach((p) => {
      map[p.code] = productToEdit(p);
    });
    setEditCatalog(map);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    if (!formMeta.code.trim() || !formMeta.name.trim()) return;
    const classErr = validateClassBased(form);
    if (classErr) {
      toast({ title: "Classes required", description: classErr, variant: "destructive" });
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
        code: formMeta.code.trim().toUpperCase().replace(/\s+/g, "_"),
        name: formMeta.name.trim(),
        description: formMeta.description.trim(),
        isPremium: true,
        ...buildSavePayload(form),
      }),
    });
    setCreating(false);
    if (res.ok) {
      setFormMeta({ code: "", name: "", description: "" });
      setForm(emptyForm());
      toast({ title: "Product created" });
      await load();
    } else {
      const j = await res.json().catch(() => ({}));
      toast({ title: "Failed", description: j.message, variant: "destructive" });
    }
  };

  const saveProductCatalog = async (p: Product) => {
    const edit = editCatalog[p.code];
    if (!edit) return;
    const catalogErr = validateCatalog(edit);
    if (catalogErr) {
      toast({ title: "Catalog required", description: catalogErr, variant: "destructive" });
      return;
    }
    setSavingCatalogCode(p.code);
    const result = await updateProduct(p.code, buildSavePayload(edit));
    setSavingCatalogCode(null);
    if (result.ok) {
      toast({
        title: "Saved & synced",
        description: `${p.name} — classes and subjects updated everywhere (Content studio, schools, mobile).`,
      });
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
        description="Class-based products need class numbers; level-based products need level numbers (and optional categories). Use “Same subjects for all classes” when every class shares one subject list."
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
                value={formMeta.code}
                onChange={(e) => setFormMeta({ ...formMeta, code: e.target.value })}
              />
            </div>
            <div>
              <Label>Name</Label>
              <Input
                placeholder="Display name"
                value={formMeta.name}
                onChange={(e) => setFormMeta({ ...formMeta, name: e.target.value })}
              />
            </div>
            <div>
              <Label>Description</Label>
              <Input
                placeholder="Optional"
                value={formMeta.description}
                onChange={(e) => setFormMeta({ ...formMeta, description: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[var(--brand-navy)]">Product structure</Label>
            <RadioGroup
              value={form.structureType}
              onValueChange={(v) =>
                setForm((f) => ({ ...f, structureType: v as ProductStructureType }))
              }
              className="flex flex-wrap gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="class_based" id="structure-class" />
                <Label htmlFor="structure-class" className="font-normal cursor-pointer">
                  Class based
                </Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="level_based" id="structure-level" />
                <Label htmlFor="structure-level" className="font-normal cursor-pointer">
                  Level based
                </Label>
              </div>
            </RadioGroup>
          </div>

          {form.structureType === "level_based" ? (
            <LevelBasedCatalogBlock edit={form} onChange={setForm} />
          ) : (
            <ClassBasedCatalogBlock edit={form} onChange={setForm} />
          )}

          <Button
            type="button"
            className="w-fit rounded-xl bg-[var(--brand-navy)] hover:bg-[var(--brand-navy-hover)]"
            onClick={handleCreate}
            disabled={creating || form.catalogClassNumbers.length === 0}
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
          {products.map((p) => {
            const levelBased = isLevelBasedProduct(p);
            const edit = editCatalog[p.code] || productToEdit(p);
            const slotCount = edit.catalogClassNumbers.length;
            return (
              <Card
                key={p.code}
                className={cn(
                  "rounded-2xl border-2",
                  slotCount > 0 ||
                    edit.catalogSubjects.length > 0 ||
                    edit.catalogCategories.length > 0
                    ? "border-[var(--brand-emerald)]/20"
                    : "border-slate-200",
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base pr-2 text-[var(--brand-navy)]">{p.name}</CardTitle>
                    <div className="flex shrink-0 items-center gap-1 flex-wrap justify-end">
                      <Badge variant="outline" className="text-xs">
                        {levelBased ? "Level based" : "Class based"}
                      </Badge>
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
                              Remove <strong>{p.name}</strong> ({p.code}) from the catalog.
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
                  {slotCount > 0 ? (
                    <p className="text-xs text-slate-500 mt-1">
                      {levelBased ? "Levels" : "Classes"}:{" "}
                      {edit.catalogClassNumbers
                        .map((n) => (levelBased ? `Level ${n}` : `Class ${n}`))
                        .join(", ")}
                    </p>
                  ) : null}
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 line-clamp-2 mb-2">{p.description || "—"}</p>
                  {levelBased ? (
                    <LevelBasedCatalogBlock
                      edit={edit}
                      onChange={(next) =>
                        setEditCatalog((m) => ({ ...m, [p.code]: next }))
                      }
                      showSave
                      onSave={() => saveProductCatalog(p)}
                      saving={savingCatalogCode === p.code}
                    />
                  ) : (
                    <ClassBasedCatalogBlock
                      edit={edit}
                      onChange={(next) =>
                        setEditCatalog((m) => ({ ...m, [p.code]: next }))
                      }
                      showSave
                      onSave={() => saveProductCatalog(p)}
                      saving={savingCatalogCode === p.code}
                    />
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
