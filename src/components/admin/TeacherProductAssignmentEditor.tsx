import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, RotateCcw, ChevronDown, ChevronUp, BookOpen, Layers } from "lucide-react";
import {
  productLabel,
  getSubjectsForClass,
  isLevelBasedProduct,
  type Product,
  type SchoolProductAssignment,
} from "@/lib/products";

export type TeacherSlot = {
  classNumber: string;
  enabled: boolean;
  subjects: string[];
};

export type TeacherProductRow = {
  id: string;
  productCode: string;
  classSlots: TeacherSlot[];
};

export type TeacherProductApi = {
  productCode: string;
  classLicenses: { classNumber: string; subjects: string[] }[];
};

function newRowId() {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `row-${Date.now()}-${Math.random()}`;
}

function slotLabel(product: Product | undefined, classNumber: string) {
  return isLevelBasedProduct(product) ? `Level ${classNumber}` : `Class ${classNumber}`;
}

function productCodesMatch(a?: string, b?: string) {
  return String(a || "").trim().toUpperCase() === String(b || "").trim().toUpperCase();
}

function schoolSlotsForProduct(
  product: Product | undefined,
  schoolRow?: SchoolProductAssignment,
): TeacherSlot[] {
  if (!product || !schoolRow) return [];
  const licenses = schoolRow.classLicenses || [];
  if (licenses.length) {
    return licenses.map((l) => ({
      classNumber: String(l.classNumber),
      enabled: false,
      subjects: Array.isArray(l.subjects) && l.subjects.length
        ? [...l.subjects]
        : getSubjectsForClass(product, String(l.classNumber)),
    }));
  }
  const from = parseInt(String(schoolRow.classesFrom || "1"), 10);
  const to = parseInt(String(schoolRow.classesTo || "12"), 10);
  if (!Number.isFinite(from) || !Number.isFinite(to)) return [];
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  const slots: TeacherSlot[] = [];
  for (let i = lo; i <= hi; i++) {
    slots.push({
      classNumber: String(i),
      enabled: false,
      subjects: getSubjectsForClass(product, String(i)),
    });
  }
  return slots;
}

export function newTeacherProductRow(
  productCode = "",
  product?: Product,
  schoolRow?: SchoolProductAssignment,
): TeacherProductRow {
  return {
    id: newRowId(),
    productCode,
    classSlots: productCode ? schoolSlotsForProduct(product, schoolRow) : [],
  };
}

export function teacherRowsFromApi(
  assignments: { productCode?: string; classLicenses?: { classNumber: string; subjects?: string[] }[] }[] | undefined,
  schoolAssignments: SchoolProductAssignment[],
  catalogProducts: Product[],
): TeacherProductRow[] {
  if (!assignments?.length) {
    const first = schoolAssignments[0];
    const product = catalogProducts.find((p) => productCodesMatch(p.code, first?.productCode));
    return first ? [newTeacherProductRow(first.productCode, product, first)] : [];
  }
  return assignments.map((a, i) => {
    const product = catalogProducts.find((p) => productCodesMatch(p.code, a.productCode));
    const schoolRow = schoolAssignments.find((s) => productCodesMatch(s.productCode, a.productCode));
    const baseSlots = schoolSlotsForProduct(product, schoolRow);
    const licensed = new Map(
      (a.classLicenses || []).map((l) => [String(l.classNumber), l]),
    );
    return {
      id: `row-${i}`,
      productCode: a.productCode || "",
      classSlots: baseSlots.map((slot) => {
        const saved = licensed.get(slot.classNumber);
        if (!saved) return slot;
        return {
          classNumber: slot.classNumber,
          enabled: true,
          subjects: saved.subjects?.length ? [...saved.subjects] : slot.subjects,
        };
      }),
    };
  });
}

export function teacherAssignmentToApi(row: TeacherProductRow): TeacherProductApi | null {
  if (!row.productCode?.trim()) return null;
  const enabled = row.classSlots.filter((s) => s.enabled && s.subjects.length > 0);
  if (!enabled.length) return null;
  return {
    productCode: row.productCode,
    classLicenses: enabled.map((s) => ({
      classNumber: s.classNumber,
      subjects: [...s.subjects],
    })),
  };
}

export function isTeacherRowValid(row: TeacherProductRow) {
  return !!teacherAssignmentToApi(row);
}

function InlineSubjectTags({
  tag,
  selected,
  onChange,
}: {
  tag: string;
  selected: string[];
  onChange: (subjects: string[]) => void;
}) {
  const [draft, setDraft] = useState("");
  const singular = tag.endsWith("ies") ? tag.slice(0, -3) + "y" : tag.replace(/s$/, "");

  const add = () => {
    const name = draft.trim();
    if (!name) return;
    if (!selected.some((s) => s.toLowerCase() === name.toLowerCase())) {
      onChange([...selected, name]);
    }
    setDraft("");
  };

  return (
    <div className="space-y-2">
      <Label className="text-[10px] font-semibold text-slate-600 uppercase tracking-wide">
        {tag} for this class
      </Label>
      <div className="flex gap-1.5">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder={`Type ${singular}, press Enter`}
          className="h-8 text-xs border-teal-200 focus:border-teal-500"
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="h-8 shrink-0 border-teal-200 text-teal-800"
          onClick={add}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((s) => (
            <Badge
              key={s}
              className="bg-teal-100 text-teal-900 border-teal-200 text-xs font-medium gap-1 pr-1"
            >
              {s}
              <button
                type="button"
                className="ml-0.5 rounded hover:bg-teal-200/80 px-1 leading-none"
                onClick={() => onChange(selected.filter((x) => x !== s))}
                aria-label={`Remove ${s}`}
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-[10px] text-amber-800 bg-amber-50 border border-amber-100 rounded px-2 py-1">
          Type at least one {singular} above (e.g. English, Mathematics).
        </p>
      )}
    </div>
  );
}

function SubjectMultiSelect({
  product,
  classNumber,
  selected,
  onChange,
  allowedSubjects,
}: {
  product: Product;
  classNumber: string;
  selected: string[];
  onChange: (subjects: string[]) => void;
  allowedSubjects: string[];
}) {
  const [open, setOpen] = useState(false);
  const catalog = getSubjectsForClass(product, classNumber);
  const available = allowedSubjects.length ? allowedSubjects : catalog;
  const tag = isLevelBasedProduct(product) ? "categories" : "subjects";

  if (!available.length) {
    return (
      <InlineSubjectTags tag={tag} selected={selected} onChange={onChange} />
    );
  }

  const toggle = (name: string) => {
    const has = selected.some((s) => s.toLowerCase() === name.toLowerCase());
    onChange(
      has
        ? selected.filter((s) => s.toLowerCase() !== name.toLowerCase())
        : [...selected, name],
    );
  };

  const summary =
    selected.length === 0
      ? `Select ${tag}`
      : selected.length === available.length
        ? `All ${tag} (${selected.length})`
        : `${selected.length} ${tag}`;

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="outline"
        className="h-9 w-full justify-between text-left font-normal text-xs border-slate-200 hover:border-teal-300 hover:bg-teal-50/50"
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className="flex items-center gap-1.5 truncate">
          <BookOpen className="h-3.5 w-3.5 shrink-0 text-teal-600" />
          {summary}
        </span>
        {open ? (
          <ChevronUp className="h-3.5 w-3.5 shrink-0 opacity-60" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
        )}
      </Button>
      {open ? (
        <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-sm">
          <div className="flex items-center justify-between gap-2 px-1 pb-2 border-b border-slate-100 mb-2">
            <p className="text-xs font-semibold text-slate-700 capitalize">{tag}</p>
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
          <ul className="max-h-40 overflow-y-auto space-y-1">
            {available.map((name, idx) => {
              const checked = selected.some((s) => s.toLowerCase() === name.toLowerCase());
              return (
                <li key={`${name}-${idx}`}>
                  <label className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-slate-50 cursor-pointer text-sm">
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(name)}
                    />
                    <span>{name}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

type Props = {
  rows: TeacherProductRow[];
  onChange: (rows: TeacherProductRow[]) => void;
  catalogProducts: Product[];
  schoolAssignments: SchoolProductAssignment[];
};

export function TeacherProductAssignmentEditor({
  rows,
  onChange,
  catalogProducts,
  schoolAssignments,
}: Props) {
  const licensedProducts = catalogProducts.filter((p) =>
    schoolAssignments.some((s) => productCodesMatch(s.productCode, p.code)),
  );

  const updateRow = (id: string, patch: Partial<TeacherProductRow>) => {
    onChange(rows.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const onProductSelect = (rowId: string, productCode: string) => {
    const product = catalogProducts.find((p) => productCodesMatch(p.code, productCode));
    const schoolRow = schoolAssignments.find((s) => productCodesMatch(s.productCode, productCode));
    updateRow(rowId, {
      productCode,
      classSlots: schoolSlotsForProduct(product, schoolRow),
    });
  };

  const updateSlot = (rowId: string, classNumber: string, patch: Partial<TeacherSlot>) => {
    const row = rows.find((r) => r.id === rowId);
    if (!row) return;
    updateRow(rowId, {
      classSlots: row.classSlots.map((s) =>
        s.classNumber === classNumber ? { ...s, ...patch } : s,
      ),
    });
  };

  const addRow = () => {
    const code = licensedProducts[0]?.code || "";
    const product = catalogProducts.find((p) => p.code === code);
    const schoolRow = schoolAssignments.find((s) => productCodesMatch(s.productCode, code));
    onChange([...rows, newTeacherProductRow(code, product, schoolRow)]);
  };

  if (!schoolAssignments.length) {
    return (
      <p className="text-sm text-violet-800 rounded-xl border border-violet-200 bg-violet-50 p-4">
        This school has no licensed book products yet. Assign products in School Management first.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-600 bg-teal-50/60 border border-teal-100 rounded-xl px-3 py-2.5 space-y-2">
        <div className="flex items-start gap-2">
          <Layers className="h-4 w-4 mt-0.5 text-teal-600 shrink-0" />
          <p>
            Enable each class or level, then pick subjects (or categories). If nothing appears in
            the list, type subjects directly on each class card below.
          </p>
        </div>
        <p className="text-xs text-slate-500 pl-6">
          To define subjects for all schools permanently, open{" "}
          <a
            href="/super-admin/products"
            target="_blank"
            rel="noreferrer"
            className="font-semibold text-teal-700 underline hover:text-teal-900"
          >
            Super Admin → Products
          </a>
          , edit the product → <strong>Subjects</strong> → Save catalog setup.
        </p>
      </div>

      {rows.map((row, index) => {
        const product = catalogProducts.find((p) => productCodesMatch(p.code, row.productCode));
        const schoolRow = schoolAssignments.find((s) =>
          productCodesMatch(s.productCode, row.productCode),
        );
        const enabled = row.classSlots.filter((s) => s.enabled);
        const disabled = row.classSlots.filter((s) => !s.enabled);
        const slotWord = isLevelBasedProduct(product) ? "levels" : "classes";

        return (
          <div
            key={row.id}
            className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-sm"
          >
            <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-teal-50/40 px-4 py-3">
              <div className="flex-1 min-w-[180px] space-y-1">
                <Label className="text-xs text-slate-500">Product {index + 1}</Label>
                <Select
                  value={row.productCode || undefined}
                  onValueChange={(v) => onProductSelect(row.id, v)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {licensedProducts.map((p) => (
                      <SelectItem key={p.code} value={p.code}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-red-500"
                disabled={rows.length <= 1}
                onClick={() => onChange(rows.filter((r) => r.id !== row.id))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {!row.productCode ? (
              <p className="text-sm text-slate-400 px-4 py-5">Select a licensed product.</p>
            ) : (
              <div className="p-4 space-y-3">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                  Licensed {slotWord} for {productLabel(row.productCode, catalogProducts)}
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {enabled.map((slot) => {
                    const schoolLicense = schoolRow?.classLicenses?.find(
                      (l) => String(l.classNumber) === slot.classNumber,
                    );
                    const allowed = schoolLicense?.subjects?.length
                      ? schoolLicense.subjects
                      : getSubjectsForClass(product!, slot.classNumber);

                    return (
                      <div
                        key={slot.classNumber}
                        className="rounded-lg border border-teal-200/70 bg-gradient-to-br from-teal-50/80 to-white p-3 space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-teal-900">
                            {slotLabel(product, slot.classNumber)}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => updateSlot(row.id, slot.classNumber, { enabled: false })}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                        {product ? (
                          <SubjectMultiSelect
                            product={product}
                            classNumber={slot.classNumber}
                            selected={slot.subjects}
                            onChange={(subjects) =>
                              updateSlot(row.id, slot.classNumber, { subjects })
                            }
                            allowedSubjects={allowed}
                          />
                        ) : null}
                      </div>
                    );
                  })}
                </div>

                {disabled.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-dashed">
                    <span className="text-xs text-slate-500 w-full">Add {slotWord}:</span>
                    {disabled.map((slot) => (
                      <Button
                        key={slot.classNumber}
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-8 rounded-full text-xs border-teal-200 text-teal-800 hover:bg-teal-50"
                        onClick={() =>
                          updateSlot(row.id, slot.classNumber, {
                            enabled: true,
                            subjects: slot.subjects.length
                              ? slot.subjects
                              : getSubjectsForClass(product!, slot.classNumber),
                          })
                        }
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
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

      <Button type="button" variant="outline" size="sm" onClick={addRow} className="border-teal-200 text-teal-800 hover:bg-teal-50">
        <Plus className="h-4 w-4 mr-2" />
        Add another product
      </Button>
    </div>
  );
}
