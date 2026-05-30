import { Crown, LogOut, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useSuperAdminDrawerNav } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useState } from "react";
import type { SuperAdminView } from "@/lib/super-admin-views";
import { ViswamLogo } from "@/components/brand/ViswamLogo";
import { SUPER_ADMIN_NAV_ITEMS } from "@/lib/super-admin-view-meta";
import { PRODUCT_NAME } from "@/lib/brand";

export type { SuperAdminView };

interface SuperAdminSidebarProps {
  currentView: SuperAdminView;
  onViewChange: (view: SuperAdminView) => void;
  user: { fullName?: string; email?: string };
  onLogout: () => void;
}

const NAV_GROUPS: { key: string; label: string }[] = [
  { key: "core", label: "Overview" },
  { key: "content", label: "Content" },
  { key: "insights", label: "Insights" },
  { key: "system", label: "System" },
];

export function SuperAdminSidebar({ currentView, onViewChange, user, onLogout }: SuperAdminSidebarProps) {
  const useDrawerNav = useSuperAdminDrawerNav();
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileNavItems = SUPER_ADMIN_NAV_ITEMS.slice(0, 5);

  const renderNavButton = (item: (typeof SUPER_ADMIN_NAV_ITEMS)[0], compact = false) => {
    const Icon = item.icon;
    const isActive = currentView === item.id;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          onViewChange(item.id);
          setMobileOpen(false);
        }}
        title={compact ? item.label : undefined}
        className={cn("sa-premium-nav-btn", compact && "lg:justify-start justify-center px-2 lg:px-3", isActive && "sa-premium-nav-active")}
      >
        <span className={cn("sa-premium-nav-icon", compact && "lg:mr-0")}>
          <Icon className="h-4 w-4" strokeWidth={2} />
        </span>
        <span className={cn("min-w-0 truncate", compact && "hidden lg:block flex-1")}>{item.label}</span>
      </button>
    );
  };

  const sidebarContent = (
    <div className="flex h-full flex-col sa-premium-sidebar">
      <div className="sa-premium-sidebar-accent" />
      <div className="border-b border-white/10 px-4 py-5 lg:px-5">
        <ViswamLogo subtitle="Super Admin" variant="light" size="md" />
        <p className="mt-3 hidden text-[11px] leading-relaxed text-white/50 lg:block">
          {PRODUCT_NAME} enterprise control plane
        </p>
      </div>

      <nav className="hide-scrollbar flex-1 space-y-1 overflow-y-auto px-3 py-4 lg:px-4">
        {NAV_GROUPS.map((group) => {
          const items = SUPER_ADMIN_NAV_ITEMS.filter((i) => i.group === group.key);
          if (!items.length) return null;
          return (
            <div key={group.key} className="mb-2">
              <p className={cn("sa-premium-nav-label", useDrawerNav ? "" : "hidden lg:block")}>{group.label}</p>
              <div className="space-y-1">{items.map((item) => renderNavButton(item, !useDrawerNav))}</div>
            </div>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-white/10 p-4 lg:p-5">
        <div className={cn("flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-3", !useDrawerNav && "lg:justify-start justify-center")}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--brand-gold)]/30 to-[var(--brand-emerald)]/30 ring-1 ring-white/20">
            <Crown className="h-4 w-4 text-[var(--brand-gold)]" strokeWidth={2} />
          </div>
          <div className={cn("min-w-0", !useDrawerNav && "hidden lg:block")}>
            <p className="truncate text-sm font-semibold text-white">{user?.fullName || "Super Admin"}</p>
            <p className="truncate text-xs text-white/55">{user?.email || "Platform administrator"}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            onLogout();
            setMobileOpen(false);
          }}
          className={cn(
            "sa-premium-nav-btn border border-red-400/25 text-red-100 hover:bg-red-500/15 hover:text-white",
            !useDrawerNav && "justify-center lg:justify-start",
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          <span className={cn(!useDrawerNav && "hidden lg:inline")}>Sign out</span>
        </button>
      </div>
    </div>
  );

  if (useDrawerNav) {
    return (
      <>
        <div className="fixed left-0 right-0 top-0 z-30 border-b border-white/10 bg-[#0b1f3a] pt-[env(safe-area-inset-top,0px)] shadow-lg">
          <div className="flex h-14 items-center justify-between px-4">
            <ViswamLogo subtitle="Super Admin" variant="light" size="sm" />
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" aria-label="Open menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[min(20rem,92vw)] border-0 p-0">
                {sidebarContent}
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="sa-premium-mobile-bar fixed bottom-0 left-0 right-0 z-50 flex justify-around py-2 sm:hidden pb-[env(safe-area-inset-bottom,0px)]">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onViewChange(item.id)}
                className={cn(
                  "flex min-w-0 flex-col items-center gap-0.5 px-2 py-1 transition-colors",
                  isActive ? "sa-premium-mobile-nav-active" : "text-slate-500",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-9 items-center justify-center rounded-xl transition-all",
                    isActive ? "bg-emerald-500/10 ring-1 ring-emerald-500/25" : "bg-slate-100",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                </span>
                <span className="max-w-[4.5rem] truncate text-[10px] font-medium">{item.label.split(" ")[0]}</span>
              </button>
            );
          })}
        </div>
      </>
    );
  }

  return (
    <aside
      className={cn(
        "super-admin-sidebar sa-premium-sidebar hidden sm:flex flex-col transition-all duration-300",
        "sm:w-[68px] lg:w-[17.5rem] sm:min-w-[68px] lg:min-w-[17.5rem]",
        "fixed top-0 left-0 z-20 h-screen overflow-y-auto",
      )}
    >
      {sidebarContent}
    </aside>
  );
}

export default SuperAdminSidebar;
