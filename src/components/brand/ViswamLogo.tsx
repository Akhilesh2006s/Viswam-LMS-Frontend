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

function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" className={className} aria-hidden>
      <defs>
        <linearGradient id="viswam-logo-grad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="100%" stopColor="#0ea5e9" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="14" fill="url(#viswam-logo-grad)" />
      <path
        d="M18 44V20l14 16 14-16v24"
        fill="none"
        stroke="white"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

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
          "rounded-xl flex items-center justify-center overflow-hidden shrink-0",
          variant === "light"
            ? "bg-white/10 border border-white/15"
            : "bg-slate-50 border border-slate-200"
        )}
      >
        <LogoMark className="h-full w-full" />
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
