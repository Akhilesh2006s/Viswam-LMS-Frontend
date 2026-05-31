import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GraduationCap,
  Package,
  BookOpen,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  fetchProductCurriculum,
  type Product,
  type ProductCurriculum,
  isLevelBasedProduct,
  getProductCatalogTags,
} from "@/lib/products";
import { extractPlainSubjectName } from "@/lib/subject-names";

export type ProductSubjectSelection = {
  productCode: string;
  catalogSubject: string;
  classNumber: string;
  subjectId: string;
};

type Props = {
  products: Product[];
  value: Partial<ProductSubjectSelection>;
  onChange: (next: ProductSubjectSelection | Partial<ProductSubjectSelection>) => void;
  className?: string;
};

function subjectNameMatches(dbName: string, catalogName: string) {
  const a = extractPlainSubjectName(dbName).toLowerCase().trim();
  const b = catalogName.toLowerCase().trim();
  if (a === b) return true;
  const alias: Record<string, string[]> = {
    maths: ["math", "mathematics"],
    mathematics: ["maths", "math"],
    math: ["maths", "mathematics"],
  };
  if ((alias[b] || []).includes(a)) return true;
  return a.includes(b) || b.includes(a);
}

export function resolveSubjectIdForCatalog(
  curriculum: ProductCurriculum | null,
  catalogSubject: string,
  classNumber: string,
): string {
  if (!curriculum || !catalogSubject || !classNumber) return "";
  const row = curriculum.subjects.find(
    (s) =>
      String(s.classNumber) === classNumber &&
      subjectNameMatches(s.name, catalogSubject),
  );
  return row?._id || "";
}

function sortProducts(list: Product[]): Product[] {
  return [...list].sort((a, b) => {
    const aAbacus = a.code === "ABACUS" || /abacus/i.test(a.name);
    const bAbacus = b.code === "ABACUS" || /abacus/i.test(b.name);
    if (aAbacus && !bAbacus) return -1;
    if (!aAbacus && bAbacus) return 1;
    return a.name.localeCompare(b.name);
  });
}

function StepRow({
  step,
  label,
  icon: Icon,
  active,
  done,
  children,
}: {
  step: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
  done: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border p-3 transition-colors",
        active && "border-[var(--brand-emerald)]/50 bg-emerald-50/40 shadow-sm",
        done && !active && "border-slate-200 bg-white",
        !active && !done && "border-slate-100 bg-slate-50/50 opacity-90",
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <span
          className={cn(
            "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
            done
              ? "bg-[var(--brand-emerald)] text-white"
              : active
                ? "bg-[var(--brand-navy)] text-white"
                : "bg-slate-200 text-slate-600",
          )}
        >
          {done && !active ? "✓" : step}
        </span>
        <Label className="flex items-center gap-1.5 text-sm font-semibold text-[var(--brand-navy)]">
          <Icon className="h-4 w-4 text-[var(--brand-emerald)]" />
          {label}
        </Label>
      </div>
      {children}
    </div>
  );
}

export default function ProductSubjectPicker({ products, value, onChange, className }: Props) {
  const [loading, setLoading] = useState(false);
  const [curriculum, setCurriculum] = useState<ProductCurriculum | null>(null);

  const productCode = value.productCode || "";
  const catalogSubject = value.catalogSubject || "";
  const classNumber = value.classNumber || "";

  const sortedProducts = useMemo(() => sortProducts(products), [products]);
  const selectedProduct = products.find((p) => p.code === productCode);

  const levelBased = isLevelBasedProduct(selectedProduct);
  const tagLabel = levelBased ? "Category" : "Subject";
  const classStepLabel = levelBased ? "Level" : "Class";

  const catalogSubjects = useMemo(() => {
    const fromProduct = getProductCatalogTags(selectedProduct);
    if (fromProduct.length) return fromProduct;
    const fromCurriculum = new Set<string>();
    curriculum?.subjects.forEach((s) => {
      const n = extractPlainSubjectName(s.name);
      if (n) fromCurriculum.add(n);
    });
    return [...fromCurriculum].sort();
  }, [selectedProduct, curriculum]);

  useEffect(() => {
    if (!productCode) {
      setCurriculum(null);
      return;
    }
    setLoading(true);
    fetchProductCurriculum(productCode).then((data) => {
      setCurriculum(data);
      setLoading(false);
    });
  }, [productCode]);

  useEffect(() => {
    if (!productCode || !catalogSubject || !classNumber) return;
    const subjectId = resolveSubjectIdForCatalog(curriculum, catalogSubject, classNumber);
    if (subjectId && subjectId !== value.subjectId) {
      onChange({ productCode, catalogSubject, classNumber, subjectId });
    } else if (!subjectId && value.subjectId) {
      onChange({ productCode, catalogSubject, classNumber, subjectId: "" });
    }
  }, [curriculum, productCode, catalogSubject, classNumber]);

  const classes = useMemo(
    () => [...(curriculum?.classes || [])].sort((a, b) => Number(a.classNumber) - Number(b.classNumber)),
    [curriculum],
  );

  const subjectReady = !!(value.subjectId && catalogSubject && classNumber);
  const stepProductDone = !!productCode;
  const stepSubjectDone = !!catalogSubject;
  const stepClassDone = !!classNumber;

  const pickProduct = (code: string) => {
    onChange({ productCode: code, catalogSubject: "", classNumber: "", subjectId: "" });
  };

  const pickSubject = (name: string) => {
    onChange({
      productCode,
      catalogSubject: name,
      classNumber: "",
      subjectId: "",
    });
  };

  const pickClass = (cn: string) => {
    onChange({
      productCode,
      catalogSubject,
      classNumber: cn,
      subjectId: resolveSubjectIdForCatalog(curriculum, catalogSubject, cn),
    });
  };

  return (
    <div
      className={cn(
        "rounded-xl border border-[var(--brand-navy)]/10 bg-gradient-to-b from-slate-50 to-white p-4 space-y-3",
        className,
      )}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700/90 ott-picker-heading">
        Where should this video appear?
      </p>

      <StepRow
        step={1}
        label="Book product"
        icon={Package}
        active={!stepProductDone}
        done={stepProductDone}
      >
        <Select value={productCode || "_"} onValueChange={(v) => pickProduct(v === "_" ? "" : v)}>
          <SelectTrigger className="h-11 bg-white border-slate-200 shadow-sm">
            <SelectValue placeholder="Choose a product line…" />
          </SelectTrigger>
          <SelectContent className="max-h-[min(320px,50vh)]">
            <SelectItem value="_" disabled>
              Choose a product line…
            </SelectItem>
            {sortedProducts.map((p) => (
              <SelectItem key={p.code} value={p.code} className="py-2.5">
                <span className="font-medium text-[var(--brand-navy)]">{p.name}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedProduct ? (
          <p className="mt-1.5 text-xs text-slate-500">
            {getProductCatalogTags(selectedProduct).length > 0
              ? `${levelBased ? "Categories" : "Subjects"} on catalog: ${getProductCatalogTags(selectedProduct).join(", ")}`
              : `Add ${levelBased ? "categories" : "subjects"} in Products, then provision curriculum in Content studio.`}
          </p>
        ) : null}
      </StepRow>

      {productCode ? (
        <StepRow
          step={2}
          label={tagLabel}
          icon={BookOpen}
          active={stepProductDone && !stepSubjectDone}
          done={stepSubjectDone}
        >
          {loading ? (
            <div className="flex items-center gap-2 py-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin text-[var(--brand-emerald)]" />
              Loading {tagLabel.toLowerCase()}s…
            </div>
          ) : catalogSubjects.length === 0 ? (
            <p className="text-sm text-amber-900 bg-amber-50 border border-amber-100 rounded-lg p-3">
              No subjects on this product. Add them under <strong>Products</strong>, then{" "}
              <strong>Create classes & subjects</strong> in Content studio.
            </p>
          ) : (
            <Select
              value={catalogSubject || "_"}
              onValueChange={(v) => pickSubject(v === "_" ? "" : v)}
            >
              <SelectTrigger className="h-11 bg-white border-slate-200 shadow-sm">
                <SelectValue placeholder={`Choose ${tagLabel.toLowerCase()}…`} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_" disabled>
                  {`Choose ${tagLabel.toLowerCase()}…`}
                </SelectItem>
                {catalogSubjects.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </StepRow>
      ) : null}

      {productCode && catalogSubject ? (
        <StepRow
          step={3}
          label={classStepLabel}
          icon={GraduationCap}
          active={stepSubjectDone && !stepClassDone}
          done={stepClassDone}
        >
          <Select
            value={classNumber || "_"}
            onValueChange={(v) => pickClass(v === "_" ? "" : v)}
            disabled={classes.length === 0}
          >
            <SelectTrigger className="h-11 bg-white border-slate-200 shadow-sm">
              <SelectValue
                placeholder={
                  classes.length
                    ? levelBased
                      ? "Which level can watch this?"
                      : "Which class can watch this?"
                    : levelBased
                      ? "Create levels first"
                      : "Create classes first"
                }
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_" disabled>
                {levelBased ? "Select level…" : "Select class…"}
              </SelectItem>
              {classes.map((c) => (
                <SelectItem key={c.classNumber} value={c.classNumber}>
                  {c.label || (levelBased ? `Level ${c.classNumber}` : `Class ${c.classNumber}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </StepRow>
      ) : null}

      {catalogSubject && classNumber ? (
        <div
          className={cn(
            "rounded-xl px-4 py-3 text-sm flex items-start gap-3 border",
            subjectReady
              ? "bg-emerald-50 border-emerald-200 text-emerald-950"
              : "bg-amber-50 border-amber-200 text-amber-950",
          )}
        >
          {subjectReady ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-[var(--brand-emerald)]" />
          ) : (
            <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" />
          )}
          <div className="min-w-0 flex-1">
            {subjectReady ? (
              <>
                <p className="font-semibold text-[var(--brand-navy)]">Ready to publish</p>
                <div className="mt-1 flex flex-wrap items-center gap-1 text-slate-700">
                  <Badge className="bg-[var(--brand-navy)] text-white">{selectedProduct?.name}</Badge>
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                  <Badge variant="outline" className="border-emerald-300 text-emerald-800">
                    {catalogSubject}
                  </Badge>
                  <ChevronRight className="h-3 w-3 text-slate-400" />
                  <Badge className="bg-[var(--brand-gold)]/90 text-[var(--brand-navy)]">
                    Class {classNumber}
                  </Badge>
                </div>
              </>
            ) : (
              <>
                <p className="font-semibold">Curriculum not linked yet</p>
                <p className="mt-1">
                  <strong>{catalogSubject}</strong> for Class {classNumber} is not provisioned. Open{" "}
                  <strong>Content studio → Curriculum</strong> and run{" "}
                  <strong>Create classes & subjects</strong>.
                </p>
              </>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
