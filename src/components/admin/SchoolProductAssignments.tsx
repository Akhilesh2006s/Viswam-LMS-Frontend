import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Package, Plus, Save, Trash2, Lock } from "lucide-react";
import {
  fetchAdminProductWorkspace,
  saveProductClassLicenses,
  productLabel,
  type ProductWorkspace,
  type ClassLicenseRow,
} from "@/lib/products";

type DraftLicense = { classId: string; maxStrength: string };

export default function SchoolProductAssignments() {
  const [workspace, setWorkspace] = useState<ProductWorkspace | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeProduct, setActiveProduct] = useState("");
  const [draft, setDraft] = useState<DraftLicense[]>([]);

  const reload = async () => {
    const w = await fetchAdminProductWorkspace();
    setWorkspace(w);
    return w;
  };

  useEffect(() => {
    reload().then((w) => {
      const code = w?.admin.primaryProductCode || w?.products[0]?.code || "";
      setActiveProduct(code);
      loadDraft(code, w);
      setLoading(false);
    });
  }, []);

  const loadDraft = (code: string, w: ProductWorkspace | null = workspace) => {
    const scope = w?.scopes.find((s) => s.productCode === code);
    setDraft(
      (scope?.classLicenses || []).map((l) => ({
        classId: l.classId,
        maxStrength: String(l.maxStrength),
      })),
    );
  };

  const productCodes =
    workspace?.admin.productCodes || workspace?.products.map((p) => p.code) || [];

  const addRow = () => {
    const used = new Set(draft.map((d) => d.classId));
    const nextClass = workspace?.classes.find((c) => !used.has(c._id));
    if (!nextClass) return;
    setDraft([...draft, { classId: nextClass._id, maxStrength: "30" }]);
  };

  const updateRow = (idx: number, patch: Partial<DraftLicense>) => {
    setDraft(draft.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  };

  const removeRow = (idx: number) => {
    setDraft(draft.filter((_, i) => i !== idx));
  };

  const handleSave = async () => {
    if (!activeProduct) return;
    setSaving(true);
    const classLicenses = draft
      .filter((d) => d.classId && Number(d.maxStrength) > 0)
      .map((d) => ({
        classId: d.classId,
        maxStrength: Math.floor(Number(d.maxStrength)),
      }));
    const ok = await saveProductClassLicenses(activeProduct, classLicenses);
    setSaving(false);
    if (ok) {
      const w = await reload();
      loadDraft(activeProduct, w);
    }
  };

  const savedScope = workspace?.scopes.find((s) => s.productCode === activeProduct);

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-sky-600" />
      </div>
    );
  }

  if (!workspace?.products.length) {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          No book products assigned to your school yet. Your distributor must add products to your
          school account first.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Package className="h-6 w-6 text-sky-600" />
        <div>
          <h2 className="text-xl font-bold text-slate-900">Book products & class strength</h2>
          <p className="text-sm text-slate-600 max-w-2xl">
            Each product is a book you purchased. For every class, enter how many copies were sold
            (strength). That number locks how many students can be added to that class — one student
            per book.
          </p>
        </div>
      </div>

      {workspace.admin.productAssignments?.length ? (
        <Card className="border-sky-100 bg-sky-50/50">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm font-medium text-sky-900 mb-2">Sold to your school (class ranges)</p>
            <ul className="space-y-1 text-sm text-sky-800">
              {workspace.admin.productAssignments.map((a, i) => (
                <li key={`${a.productCode}-${a.classesFrom}-${a.classesTo}-${i}`}>
                  {productLabel(a.productCode, workspace.products)} — Class{" "}
                  {a.classesFrom} to {a.classesTo}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {productCodes.map((code) => (
          <Badge
            key={code}
            variant={activeProduct === code ? "default" : "outline"}
            className="cursor-pointer rounded-lg px-3 py-1"
            onClick={() => {
              setActiveProduct(code);
              loadDraft(code);
            }}
          >
            {productLabel(code, workspace.products)}
          </Badge>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Class licenses for {productLabel(activeProduct, workspace.products)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {savedScope?.classLicenses?.length ? (
            <div className="rounded-lg border bg-slate-50 p-3 text-sm">
              <p className="font-medium text-slate-800 mb-2">Current usage</p>
              <ul className="space-y-1">
                {savedScope.classLicenses.map((l: ClassLicenseRow) => (
                  <li key={l.classId} className="flex justify-between gap-2">
                    <span>{l.classLabel}</span>
                    <span className={l.isFull ? "text-red-600 font-semibold" : "text-emerald-700"}>
                      {l.currentCount} / {l.maxStrength} students
                      {l.isFull ? " (full)" : ` · ${l.remaining} left`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {draft.map((row, idx) => (
            <div
              key={`${row.classId}-${idx}`}
              className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_140px_auto]"
            >
              <div>
                <Label>Class</Label>
                <Select value={row.classId} onValueChange={(v) => updateRow(idx, { classId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {(workspace.classes || []).map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        Class {c.classNumber}
                        {c.section ? `-${c.section}` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Book copies sold (max students)</Label>
                <Input
                  type="number"
                  min={1}
                  value={row.maxStrength}
                  onChange={(e) => updateRow(idx, { maxStrength: e.target.value })}
                />
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="mt-6"
                onClick={() => removeRow(idx)}
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </div>
          ))}

          <Button type="button" variant="outline" onClick={addRow}>
            <Plus className="mr-2 h-4 w-4" />
            Add class license
          </Button>

          <Button type="button" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save & lock strength
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
