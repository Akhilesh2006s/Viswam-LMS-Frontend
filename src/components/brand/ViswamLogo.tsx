import { cn } from "@/lib/utils";
import { COMPANY_NAME, PRODUCT_NAME } from "@/lib/brand";

type ViswamLogoProps = {
  className?: string;
  subtitle?: string;
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  showCompany?: boolean;
};

const sizeMap = {
  sm: { img: "h-8 w-8", title: "text-sm", sub: "text-[10px]" },
  md: { img: "h-10 w-10", title: "text-base", sub: "text-xs" },
  lg: { img: "h-12 w-12", title: "text-lg", sub: "text-sm" },
};

export function ViswamLogo({
  className,
  subtitle,
  variant = "light",
  size = "md",
  showCompany = true,
}: ViswamLogoProps) {
  const s = sizeMap[size];
  const titleClass = variant === "light" ? "text-white" : "text-[var(--text-primary)]";
  const subClass = variant === "light" ? "text-white/75" : "text-[var(--text-secondary)]";
  const subLine = subtitle ?? (showCompany ? `by ${COMPANY_NAME}` : undefined);

  return (
    <div className={cn("flex items-center gap-3 min-w-0", className)}>
      <div
        className={cn(
          s.img,
          "rounded-xl bg-white/10 border border-white/15 flex items-center justify-center overflow-hidden shrink-0"
        )}
      >
        <img src="/logo.png" alt={PRODUCT_NAME} className="h-full w-full object-contain" />
      </div>
      <div className="min-w-0">
        <p className={cn(s.title, "font-bold tracking-tight truncate", titleClass)}>
          VISWAM <span className="text-[var(--brand-emerald)]">LMS</span>
        </p>
        {subLine ? (
          <p className={cn(s.sub, "font-medium truncate", subClass)}>{subLine}</p>
        ) : null}
      </div>
    </div>
  );
}

export default ViswamLogo;
