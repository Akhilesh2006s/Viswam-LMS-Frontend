import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { productLabel, type Product } from "@/lib/products";

export type ProductAssignmentRow = {
  id: string;
  productCode: string;
  classesFrom: string;
  classesTo: string;
  maxStrength: string;
};

export function newProductAssignmentRow(
  productCode = "",
  defaults?: Partial<Omit<ProductAssignmentRow, "id">>,
): ProductAssignmentRow {
  return {
    id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    productCode,
    classesFrom: defaults?.classesFrom ?? "6",
    classesTo: defaults?.classesTo ?? "10",
    maxStrength: defaults?.maxStrength ?? "30",
  };
}

export function deriveProductsFromAssignments(rows: ProductAssignmentRow[]) {
  const valid = rows.filter((r) => r.productCode?.trim());
  const productCodes = [...new Set(valid.map((r) => r.productCode))];
  const primaryProductCode = valid[0]?.productCode || productCodes[0] || "";
  return { productCodes, primaryProductCode };
}

export function assignmentsFromLegacy(
  productCodes: string[],
  schoolDetails?: { classesFrom?: string; classesTo?: string },
): ProductAssignmentRow[] {
  if (!productCodes?.length) {
    return [newProductAssignmentRow()];
  }
  return productCodes.map((code) =>
    newProductAssignmentRow(code, {
      classesFrom: schoolDetails?.classesFrom || "6",
      classesTo: schoolDetails?.classesTo || "10",
      maxStrength: "30",
    }),
  );
}

export function normalizeAssignmentsFromApi(
  assignments: ProductAssignmentRow[] | undefined,
  productCodes: string[] | undefined,
  schoolDetails?: { classesFrom?: string; classesTo?: string },
): ProductAssignmentRow[] {
  if (assignments?.length) {
    return assignments.map((a, i) => ({
      id: a.id || `row-${i}`,
      productCode: a.productCode || "",
      classesFrom: a.classesFrom ?? "6",
      classesTo: a.classesTo ?? "10",
      maxStrength: String(a.maxStrength ?? 30),
    }));
  }
  return assignmentsFromLegacy(productCodes || [], schoolDetails);
}

type Props = {
  rows: ProductAssignmentRow[];
  onChange: (rows: ProductAssignmentRow[]) => void;
  catalogProducts: Product[];
  fieldClass?: string;
};

export function SchoolProductAssignmentEditor({
  rows,
  onChange,
  catalogProducts,
  fieldClass = "",
}: Props) {
  const updateRow = (id: string, patch: Partial<ProductAssignmentRow>) => {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const removeRow = (id: string) => {
    if (rows.length <= 1) return;
    onChange(rows.filter((r) => r.id !== id));
  };

  const addRow = () => {
    const lastCode = rows[rows.length - 1]?.productCode || catalogProducts[0]?.code || "";
    onChange([...rows, newProductAssignmentRow(lastCode)]);
  };

  return (
    <div className="space-y-3 sm:col-span-2 lg:col-span-3">
      <div>
        <Label>Book products sold to this school *</Label>
        <p className="text-xs text-gray-500 mt-1">
          Max students applies to each class in the range (e.g. 50 for Class 6, 50 for Class 7, …).
          Add one row per sale. You can repeat the same product with a different class range (e.g.
          Abacus 1–5 and Abacus 6–10). Set the locked max students here — the school cannot change it.
        </p>
      </div>
      <div className="space-y-3">
        {rows.map((row, index) => (
          <div
            key={row.id}
            className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50/80 p-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_0.55fr_0.55fr_0.7fr_auto]"
          >
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
              <Label className="text-xs">
                Product {index + 1}
              </Label>
              <Select
                value={row.productCode || undefined}
                onValueChange={(v) => updateRow(row.id, { productCode: v })}
              >
                <SelectTrigger className={fieldClass}>
                  <SelectValue placeholder="Select book" />
                </SelectTrigger>
                <SelectContent>
                  {catalogProducts.map((p) => (
                    <SelectItem key={p.code} value={p.code}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Classes from</Label>
              <Input
                className={fieldClass}
                placeholder="e.g. 1"
                value={row.classesFrom}
                onChange={(e) => updateRow(row.id, { classesFrom: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Classes to</Label>
              <Input
                className={fieldClass}
                placeholder="e.g. 10"
                value={row.classesTo}
                onChange={(e) => updateRow(row.id, { classesTo: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Max students per class *</Label>
              <Input
                className={fieldClass}
                type="number"
                min={1}
                placeholder="e.g. 40"
                value={row.maxStrength}
                onChange={(e) => updateRow(row.id, { maxStrength: e.target.value })}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-6 shrink-0 text-red-500 hover:text-red-700 hover:bg-red-50"
              disabled={rows.length <= 1}
              onClick={() => removeRow(row.id)}
              aria-label="Remove product row"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" size="sm" onClick={addRow} className="rounded-lg">
        <Plus className="mr-2 h-4 w-4" />
        Add another product / range
      </Button>
      {rows.some((r) => r.productCode) ? (
        <p className="text-xs text-slate-500">
          Primary product:{" "}
          <span className="font-medium text-slate-700">
            {productLabel(deriveProductsFromAssignments(rows).primaryProductCode, catalogProducts)}
          </span>
        </p>
      ) : null}
    </div>
  );
}
