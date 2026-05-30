import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { SuperAdminView } from "@/lib/super-admin-views";
import { SUPER_ADMIN_VIEW_META } from "@/lib/super-admin-view-meta";
import { PRODUCT_NAME } from "@/lib/brand";

type SuperAdminTopBarProps = {
  currentView: SuperAdminView;
  userName?: string;
  className?: string;
};

export function SuperAdminTopBar({ currentView, userName, className }: SuperAdminTopBarProps) {
  const meta = SUPER_ADMIN_VIEW_META[currentView];
  const ViewIcon = meta?.icon;

  return (
    <div
      className={cn(
        "mb-5 hidden items-center justify-between gap-4 rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-md lg:flex",
        className,
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {ViewIcon ? (
          <div className="sa-premium-icon-ring h-10 w-10">
            <ViewIcon className="h-4 w-4 text-[var(--brand-emerald)]" />
          </div>
        ) : null}
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-900">{meta?.title ?? "Super Admin"}</p>
          <p className="truncate text-xs text-slate-500">{PRODUCT_NAME}</p>
        </div>
      </div>

      <div className="relative max-w-xs flex-1 px-4">
        <Search className="pointer-events-none absolute left-7 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <Input
          readOnly
          placeholder="Search schools, exams, users…"
          className="h-10 rounded-xl border-slate-200 bg-slate-50/80 pl-10 text-sm shadow-inner"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-xl text-slate-600 hover:bg-slate-100"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand-navy)] text-xs font-bold text-white">
            {(userName || "SA").slice(0, 2).toUpperCase()}
          </div>
          <div className="hidden xl:block">
            <p className="text-xs font-semibold text-slate-900">{userName || "Super Admin"}</p>
            <p className="text-[10px] text-slate-500">Platform owner</p>
          </div>
        </div>
      </div>
    </div>
  );
}
