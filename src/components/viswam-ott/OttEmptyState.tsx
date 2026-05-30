import { Film, GraduationCap, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

type OttEmptyStateProps = {
  message?: string;
  onClearFilters?: () => void;
  hasFilters?: boolean;
};

export function OttEmptyState({ message, onClearFilters, hasFilters }: OttEmptyStateProps) {
  return (
    <section className="ott-empty mx-4">
      <div className="ott-empty-icon">
        <Film className="h-10 w-10 text-emerald-400" />
      </div>
      <h2 className="text-xl font-bold text-white">No videos here yet</h2>
      <p className="ott-empty-text">
        {message ||
          "Uploaded OTT lessons appear when you are in the matching class, your school has the product license, and the subject is on your class."}
      </p>
      <ul className="ott-empty-tips">
        <li>
          <GraduationCap className="h-4 w-4 shrink-0 text-[var(--ott-gold)]" />
          Your class must match the video (e.g. Class 1).
        </li>
        <li>
          <Shield className="h-4 w-4 shrink-0 text-emerald-400" />
          Your school needs the same product (e.g. Abacus → Maths).
        </li>
      </ul>
      {hasFilters && onClearFilters ? (
        <Button
          type="button"
          variant="outline"
          className="mt-4 border-white/30 text-white hover:bg-white/10"
          onClick={onClearFilters}
        >
          Clear filters
        </Button>
      ) : null}
    </section>
  );
}
