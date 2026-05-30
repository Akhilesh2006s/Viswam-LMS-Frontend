import { cn } from "@/lib/utils";

type SuperAdminToolbarProps = {
  children?: React.ReactNode;
  className?: string;
};

/** Action row below the section header (filters, search, CTAs). */
export function SuperAdminToolbar({ children, className }: SuperAdminToolbarProps) {
  if (!children) return null;
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-sm backdrop-blur-sm sm:flex-row sm:flex-wrap sm:items-center sm:justify-between",
        className,
      )}
    >
      {children}
    </div>
  );
}
