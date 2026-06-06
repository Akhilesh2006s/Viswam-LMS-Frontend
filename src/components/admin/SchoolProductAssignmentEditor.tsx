import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Trash2, RotateCcw, ChevronDown, BookOpen } from "lucide-react";
import {
  productLabel,
  getProductClassNumbers,
  getProductLevelNumbers,
  getSubjectsForClass,
  isLevelBasedProduct,
  type Product,
} from "@/lib/products";
import { cn } from "@/lib/utils";

export type ClassStrengthSlot = {
  classNumber: string;
  maxStrength: string;
  enabled: boolean;
  subjects: string[];
};

export type ProductAssignmentRow = {
  id: string;
  productCode: string;
  classSlots: ClassStrengthSlot[];
  /** @deprecated derived on save */
  classesFrom?: string;
  classesTo?: string;
  maxStrength?: string;
};

export type ProductAssignmentApi = {
  productCode: string;
  classesFrom: string;
  classesTo: string;
  maxStrength: number;
  classLicenses: { classNumber: string; maxStrength: number; subjects?: string[] }[];
};

function getProductSlotNumbers(product?: Product): string[] {
  if (!product) return [];
  return isLevelBasedProduct(product)
    ? getProductLevelNumbers(product)
    : getProductClassNumbers(product);
}

function slotLabel(product: Product | undefined, classNumber: string) {
  return isLevelBasedProduct(product) ? `Level ${classNumber}` : `Class ${classNumber}`;
}

function classNumbersInRange(from: string, to: string) {
  const lo = parseInt(String(from), 10);
  const hi = parseInt(String(to), 10);
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [];
  const a = Math.min(lo, hi);
  const b = Math.max(lo, hi);
  const out: string[] = [];
  for (let i = a; i <= b; i++) out.push(String(i));
  return out;
}

function slotsFromProduct(product: Product | undefined): ClassStrengthSlot[] {
  const nums = getProductSlotNumbers(product);
  return nums.map((classNumber) => ({
    classNumber,
    maxStrength: "",
    enabled: true,
    subjects: product ? getSubjectsForClass(product, classNumber) : [],
  }));
}

function slotsFromLegacyRow(
  row: Partial<ProductAssignmentRow> & {
    classesFrom?: string;
    classesTo?: string;
    maxStrength?: string;
    classLicenses?: { classNumber: string; maxStrength: number; subjects?: string[] }[];
  },
  product?: Product,
): ClassStrengthSlot[] {
  if (row.classLicenses?.length) {
    const productNums = new Set(product ? getProductSlotNumbers(product) : []);
    return row.classLicenses
      .map((l) => ({
        classNumber: String(l.classNumber),
        maxStrength: String(l.maxStrength ?? ""),
        enabled: true,
        subjects: Array.isArray(l.subjects) && l.subjects.length
          ? [...l.subjects]
          : product
            ? getSubjectsForClass(product, String(l.classNumber))
            : [],
      }))
      .concat(
        product
          ? getProductSlotNumbers(product)
              .filter((n) => !row.classLicenses!.some((l) => String(l.classNumber) === n))
              .map((classNumber) => ({
                classNumber,
                maxStrength: "",
                enabled: false,
                subjects: getSubjectsForClass(product, classNumber),
              }))
          : [],
      );
  }
  if (row.classSlots?.length) return row.classSlots;
  if (product && getProductSlotNumbers(product).length) {
    return slotsFromProduct(product);
  }
  return classNumbersInRange(row.classesFrom || "1", row.classesTo || "10").map((classNumber) => ({
    classNumber,
    maxStrength: String(row.maxStrength ?? ""),
    enabled: true,
    subjects: product ? getSubjectsForClass(product, classNumber) : [],
  }));
}

export function newProductAssignmentRow(productCode = "", product?: Product): ProductAssignmentRow {
  return {
    id:
      typeof crypto !== "undefined" && crypto.randomUUID
        ? crypto.randomUUID()
        : `row-${Date.now()}-${Math.random()}`,
    productCode,
    classSlots: productCode && product ? slotsFromProduct(product) : [],
  };
}

export function assignmentToApiPayload(row: ProductAssignmentRow): ProductAssignmentApi | null {
  if (!row.productCode?.trim()) return null;
  const enabled = row.classSlots.filter(
    (s) => s.enabled && Number(s.maxStrength) > 0,
  );
  if (!enabled.length) return null;
  const nums = enabled.map((s) => parseInt(s.classNumber, 10)).filter((n) => Number.isFinite(n));
  if (!nums.length) return null;
  const classLicenses = enabled.map((s) => {
    const license: { classNumber: string; maxStrength: number; subjects?: string[] } = {
      classNumber: s.classNumber,
      maxStrength: Math.floor(Number(s.maxStrength)),
    };
    if (s.subjects?.length) license.subjects = [...s.subjects];
    return license;
  });
  return {
    productCode: row.productCode,
    classesFrom: String(Math.min(...nums)),
    classesTo: String(Math.max(...nums)),
    maxStrength: classLicenses[0].maxStrength,
    classLicenses,
  };
}

export function deriveProductsFromAssignments(rows: ProductAssignmentRow[]) {
  const valid = rows
    .map(assignmentToApiPayload)
    .filter((r): r is ProductAssignmentApi => !!r);
  const productCodes = [...new Set(valid.map((r) => r.productCode))];
  const primaryProductCode = valid[0]?.productCode || productCodes[0] || "";
  return { productCodes, primaryProductCode };
}

export function assignmentsFromLegacy(
  productCodes: string[],
  schoolDetails?: { classesFrom?: string; classesTo?: string },
  catalogProducts: Product[] = [],
): ProductAssignmentRow[] {
  if (!productCodes?.length) {
    return [newProductAssignmentRow()];
  }
  return productCodes.map((code) => {
    const product = catalogProducts.find((p) => p.code === code);
    return newProductAssignmentRow(code, product);
  });
}

export function normalizeAssignmentsFromApi(
  assignments: (ProductAssignmentRow & {
    classLicenses?: { classNumber: string; maxStrength: number; subjects?: string[] }[];
  })[] | undefined,
  productCodes: string[] | undefined,
  schoolDetails?: { classesFrom?: string; classesTo?: string },
  catalogProducts: Product[] = [],
): ProductAssignmentRow[] {
  if (assignments?.length) {
    return assignments.map((a, i) => {
      const product = catalogProducts.find((p) => p.code === a.productCode);
      return {
        id: a.id || `row-${i}`,
        productCode: a.productCode || "",
        classSlots: slotsFromLegacyRow(a, product),
      };
    });
  }
  return assignmentsFromLegacy(productCodes || [], schoolDetails, catalogProducts);
}

export function isAssignmentRowValid(
  row: ProductAssignmentRow,
  catalogProducts: Product[] = [],
) {
  if (!assignmentToApiPayload(row)) return false;
  const product = catalogProducts.find((p) => p.code === row.productCode);
  if (!product) return true;
  for (const slot of row.classSlots.filter((s) => s.enabled)) {
    if (Number(slot.maxStrength) <= 0) return false;
    const available = getSubjectsForClass(product, slot.classNumber);
    if (available.length > 0 && !(slot.subjects?.length)) return false;
  }
  return true;
}

function normalizeSlotSubjects(subjects: string[] | undefined): string[] {
  return Array.isArray(subjects) ? subjects : [];
}

function ClassSubjectMultiSelect({
  product,
  classNumber,
  selected,
  onChange,
  fieldClass,
}: {
  product: Product;
  classNumber: string;
  selected: string[] | undefined;
  onChange: (subjects: string[]) => void;
  fieldClass?: string;
}) {
  const [open, setOpen] = useState(false);
  const safeSelected = normalizeSlotSubjects(selected);
  const available = getSubjectsForClass(product, classNumber);
  const tagLabel = isLevelBasedProduct(product) ? "categories" : "subjects";
  const tagLabelSingular = isLevelBasedProduct(product) ? "category" : "subject";

  if (!available.length) {
    return (
      <p className="text-[10px] text-violet-700 leading-snug bg-violet-50 border border-violet-100 rounded-md px-2 py-1.5">
        Add {tagLabel} on the <strong>Products</strong> catalog for this{" "}
        {isLevelBasedProduct(product) ? "level" : "class"}, then save the school again.
      </p>
    );
  }

  const toggle = (name: string) => {
    const has = safeSelected.some((s) => s.toLowerCase() === name.toLowerCase());
    if (has) onChange(safeSelected.filter((s) => s.toLowerCase() !== name.toLowerCase()));
    else onChange([...safeSelected, name]);
  };

  const summary =
    safeSelected.length === 0
      ? `Select ${tagLabel}`
      : safeSelected.length === available.length
        ? `All ${tagLabel} (${safeSelected.length})`
        : `${safeSelected.length} ${tagLabel}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "h-9 w-full justify-between text-left font-normal text-xs",
            fieldClass,
            selected.length === 0 && "text-slate-500 border-violet-200",
          )}
        >
          <span className="flex items-center gap-1.5 truncate">
            <BookOpen className="h-3.5 w-3.5 shrink-0 text-violet-600" />
            {summary}
          </span>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-2" align="start">
        <div className="flex items-center justify-between gap-2 px-1 pb-2 border-b border-slate-100 mb-2">
          <p className="text-xs font-semibold text-slate-700 capitalize">{tagLabel}</p>
          <div className="flex gap-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-[10px] px-2"
              onClick={() => onChange([...available])}
            >
              All
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-[10px] px-2"
              onClick={() => onChange([])}
            >
              Clear
            </Button>
          </div>
        </div>
        <ul className="max-h-48 overflow-y-auto space-y-1">
          {available.map((name) => {
            const checked = safeSelected.some((s) => s.toLowerCase() === name.toLowerCase());
            return (
              <li key={name}>
                <label className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50 cursor-pointer text-sm">
                  <Checkbox checked={checked} onCheckedChange={() => toggle(name)} />
                  <span>{name}</span>
                </label>
              </li>
            );
          })}
        </ul>
        {safeSelected.length === 0 ? (
          <p className="text-[10px] text-amber-700 px-1 pt-2">
            Pick at least one {tagLabelSingular}.
          </p>
        ) : null}
      </PopoverContent>
    </Popover>
  );
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

  const removeProductRow = (id: string) => {
    if (rows.length <= 1) return;
    onChange(rows.filter((r) => r.id !== id));
  };

  const addProductRow = () => {
    const lastCode = rows[rows.length - 1]?.productCode || catalogProducts[0]?.code || "";
    const product = catalogProducts.find((p) => p.code === lastCode);
    onChange([...rows, newProductAssignmentRow(lastCode, product)]);
  };

  const onProductSelect = (rowId: string, productCode: string) => {
    const product = catalogProducts.find((p) => p.code === productCode);
    updateRow(rowId, {
      productCode,
      classSlots: productCode && product ? slotsFromProduct(product) : [],
    });
  };

  const updateSlot = (
    rowId: string,
    classNumber: string,
    patch: Partial<ClassStrengthSlot>,
  ) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;
    updateRow(rowId, {
      classSlots: row.classSlots.map((s) =>
        s.classNumber === classNumber
          ? { ...s, subjects: normalizeSlotSubjects(s.subjects), ...patch }
          : { ...s, subjects: normalizeSlotSubjects(s.subjects) },
      ),
    });
  };

  const restoreClass = (rowId: string, classNumber: string) => {
    const row = rows.find((r) => r.id === rowId);
    const product = catalogProducts.find((p) => p.code === row?.productCode);
    updateSlot(rowId, classNumber, {
      enabled: true,
      subjects: product ? getSubjectsForClass(product, classNumber) : [],
    });
  };

  return (
    <div className="space-y-4 sm:col-span-2 lg:col-span-3">
      <div>
        <Label>Book products sold to this school *</Label>
        <p className="text-xs text-slate-500 mt-1.5 max-w-3xl">
          Choose a product — classes or levels from that catalog appear below. Enter max students
          per slot and select which subjects (or categories) this school licenses.
        </p>
      </div>

      <div className="space-y-5">
        {rows.map((row, index) => {
          const product = catalogProducts.find((p) => p.code === row.productCode);
          const enabledSlots = row.classSlots.filter((s) => s.enabled);
          const removedSlots = row.classSlots.filter((s) => !s.enabled);
          const slotWord = isLevelBasedProduct(product) ? "levels" : "classes";

          return (
            <div
              key={row.id}
              className="rounded-xl border border-slate-200/90 bg-white shadow-sm overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-violet-50/50 px-4 py-3">
                <div className="flex-1 min-w-[200px] space-y-1">
                  <Label className="text-xs text-slate-500">Product {index + 1}</Label>
                  <Select
                    value={row.productCode || undefined}
                    onValueChange={(v) => onProductSelect(row.id, v)}
                  >
                    <SelectTrigger className={cn("h-10", fieldClass)}>
                      <SelectValue placeholder="Select book product" />
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
                {row.productCode && enabledSlots.length > 0 ? (
                  <p className="text-xs text-slate-600 self-end pb-2">
                    {enabledSlots.length} {slotWord} licensed
                  </p>
                ) : null}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                  disabled={rows.length <= 1}
                  onClick={() => removeProductRow(row.id)}
                  aria-label="Remove product"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {!row.productCode ? (
                <p className="text-sm text-slate-400 px-4 py-6">Select a product to see {slotWord}.</p>
              ) : row.classSlots.length === 0 ? (
                <p className="text-sm text-amber-800 px-4 py-6">
                  This product has no {slotWord} on the Products page. Add them there first.
                </p>
              ) : (
                <div className="p-4 space-y-3">
                  <div className="grid gap-3 sm:grid-cols-2">
                    {enabledSlots.map((slot) => (
                      <div
                        key={slot.classNumber}
                        className="rounded-lg border border-violet-200/60 bg-gradient-to-br from-violet-50/50 to-white p-3 space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-semibold text-violet-900">
                            {slotLabel(product, slot.classNumber)}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 h-8 w-8 text-slate-400 hover:text-red-600"
                            title={`Remove this ${isLevelBasedProduct(product) ? "level" : "class"} from sale`}
                            onClick={() =>
                              updateSlot(row.id, slot.classNumber, { enabled: false })
                            }
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] text-slate-500 uppercase">
                            Max students *
                          </Label>
                          <Input
                            type="number"
                            min={1}
                            placeholder="Enter count"
                            className={cn("h-9", fieldClass)}
                            value={slot.maxStrength}
                            onChange={(e) =>
                              updateSlot(row.id, slot.classNumber, {
                                maxStrength: e.target.value,
                              })
                            }
                          />
                        </div>
                        {product ? (
                          <div className="space-y-1">
                            <Label className="text-[10px] text-slate-500 uppercase">
                              {isLevelBasedProduct(product) ? "Categories" : "Subjects"} *
                            </Label>
                            <ClassSubjectMultiSelect
                              product={product}
                              classNumber={slot.classNumber}
                              selected={slot.subjects}
                              onChange={(subjects) =>
                                updateSlot(row.id, slot.classNumber, { subjects })
                              }
                              fieldClass={fieldClass}
                            />
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  {removedSlots.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-dashed border-slate-200">
                      <span className="text-xs text-slate-500">Removed:</span>
                      {removedSlots.map((slot) => (
                        <Button
                          key={slot.classNumber}
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 rounded-full text-xs gap-1"
                          onClick={() => restoreClass(row.id, slot.classNumber)}
                        >
                          <RotateCcw className="h-3 w-3" />
                          {slotLabel(product, slot.classNumber)}
                        </Button>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Button type="button" variant="outline" size="sm" onClick={addProductRow} className="rounded-lg">
        <Plus className="mr-2 h-4 w-4" />
        Add another product
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
