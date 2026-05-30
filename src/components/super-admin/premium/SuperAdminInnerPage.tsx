import { cn } from "@/lib/utils";
import { SA_INNER_PAGE } from "./sa-classes";

type SuperAdminInnerPageProps = {
  children: React.ReactNode;
  toolbar?: React.ReactNode;
  className?: string;
};

/** Root wrapper for super-admin module content (inside section header). */
export function SuperAdminInnerPage({ children, toolbar, className }: SuperAdminInnerPageProps) {
  return (
    <div className={cn(SA_INNER_PAGE, "sa-premium-inner", className)}>
      {toolbar}
      {children}
    </div>
  );
}
