import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { LogOut, Menu } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ViswamLogo } from "@/components/brand/ViswamLogo";
import { cn } from "@/lib/utils";

export type PremiumNavItem = {
  id: string;
  label: string;
  icon: LucideIcon;
  /** Navigate to a route instead of switching tabs */
  href?: string;
  /** Highlight as streaming / OTT entry */
  ottAccent?: boolean;
};

type PremiumDashboardShellProps = {
  subtitle: string;
  navItems: PremiumNavItem[];
  activeId: string;
  onNavChange: (id: string) => void;
  onLogout: () => void;
  userName?: string;
  userEmail?: string;
  children: React.ReactNode;
  /** Show bottom tab bar on small screens (max 5 items) */
  mobileNavItems?: PremiumNavItem[];
  className?: string;
  mainClassName?: string;
  contentMaxWidth?: "centered" | "wide" | "full";
  /** Desktop nav: top bar (default) or vertical rail on the right */
  sidebarPosition?: "top" | "right";
  /** Hide fixed bottom tab bar (use right rail / header menu instead) */
  hideMobileNav?: boolean;
};

export function PremiumDashboardShell({
  subtitle,
  navItems,
  activeId,
  onNavChange,
  onLogout,
  userName,
  userEmail,
  children,
  mobileNavItems,
  className,
  mainClassName,
  contentMaxWidth = "centered",
  sidebarPosition = "top",
  hideMobileNav = false,
}: PremiumDashboardShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const bottomItems = (mobileNavItems ?? navItems).slice(0, 5);
  const showMobileBar = !hideMobileNav && bottomItems.length > 0;

  const mainWidthClass =
    contentMaxWidth === "full"
      ? ""
      : contentMaxWidth === "wide"
        ? "viswam-premium-main-wide"
        : "viswam-premium-main-centered";

  const renderNavPill = (item: PremiumNavItem, onPick?: () => void) => {
    const Icon = item.icon;
    const isActive = activeId === item.id;
    const className = cn(
      "viswam-premium-nav-pill",
      isActive && "viswam-premium-nav-pill-active",
      isActive && item.ottAccent && "viswam-premium-nav-pill-ott",
    );
    const label = (
      <>
        <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
        <span className="hidden sm:inline">{item.label}</span>
        <span className="sm:hidden">{item.label.split(" ")[0]}</span>
      </>
    );

    if (item.href) {
      return (
        <Link key={item.id} href={item.href} onClick={onPick} className={className}>
          {label}
        </Link>
      );
    }

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => {
          onNavChange(item.id);
          onPick?.();
        }}
        className={className}
      >
        {label}
      </button>
    );
  };

  const useRightSidebar = sidebarPosition === "right";

  const renderSidebarNav = (onPick?: () => void) =>
    navItems.map((item) => {
      const Icon = item.icon;
      const isActive = activeId === item.id;
      const className = cn(
        "viswam-premium-sidebar-link",
        isActive && "viswam-premium-sidebar-link-active",
        isActive && item.ottAccent && "viswam-premium-sidebar-link-ott",
      );

      if (item.href) {
        return (
          <Link key={item.id} href={item.href} onClick={onPick} className={className}>
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
            <span>{item.label}</span>
          </Link>
        );
      }

      return (
        <button
          key={item.id}
          type="button"
          onClick={() => {
            onNavChange(item.id);
            onPick?.();
          }}
          className={className}
        >
          <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
          <span>{item.label}</span>
        </button>
      );
    });

  return (
    <div
      className={cn(
        "viswam-premium-shell min-h-screen",
        !hideMobileNav && "max-md:pb-[calc(7rem+env(safe-area-inset-bottom,0px))]",
        useRightSidebar && "viswam-premium-shell--sidebar-right",
        className,
      )}
    >
      <header className="viswam-premium-topnav">
        <div
          className={cn(
            "viswam-premium-topnav-inner",
            useRightSidebar && "viswam-premium-topnav-inner--sidebar-right",
          )}
        >
          <div className="flex shrink-0 items-center gap-2">
            <ViswamLogo subtitle={subtitle} variant="dark" size="sm" showCompany={false} />
          </div>

          {!useRightSidebar ? (
            <nav className="viswam-premium-nav-scroll hidden md:flex" aria-label="Main">
              {navItems.map((item) => renderNavPill(item))}
            </nav>
          ) : (
            <div className="hidden lg:block flex-1" aria-hidden />
          )}

          <div className="flex shrink-0 items-center gap-2">
            <div className="hidden lg:flex flex-col items-end max-w-[140px]">
              <span className="truncate text-xs font-semibold text-slate-900">{userName || "User"}</span>
              {userEmail ? (
                <span className="truncate text-[10px] text-slate-500">{userEmail}</span>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="hidden sm:inline-flex text-slate-600 hover:text-slate-900"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Sign out
            </Button>
            <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className={cn("h-9 w-9 shrink-0", useRightSidebar ? "lg:hidden" : "md:hidden")}
                  aria-label="Menu"
                >
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[min(20rem,92vw)] flex flex-col">
                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-900">{userName}</p>
                  {userEmail ? <p className="text-xs text-slate-500 truncate">{userEmail}</p> : null}
                </div>
                <nav className="flex-1 space-y-1 overflow-y-auto">{renderSidebarNav(() => setMenuOpen(false))}</nav>
                <Button type="button" variant="outline" className="mt-4 w-full" onClick={onLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign out
                </Button>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <div className={cn(useRightSidebar && "viswam-premium-body-row")}>
        <main className={cn("viswam-premium-main", mainWidthClass, mainClassName)}>{children}</main>
        {useRightSidebar ? (
          <aside className="viswam-premium-sidebar-rail hidden lg:flex" aria-label="Main">
            <nav className="viswam-premium-sidebar-nav">{renderSidebarNav()}</nav>
            <Button
              type="button"
              variant="outline"
              className="mt-auto w-full rounded-xl border-slate-200"
              onClick={onLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </Button>
          </aside>
        ) : null}
      </div>

      {showMobileBar ? (
      <div className="viswam-premium-mobile-bar md:hidden">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeId === item.id;
          const className = cn(
            "flex min-w-0 flex-col items-center gap-0.5 px-2 py-1",
            isActive ? "viswam-premium-mobile-bar-active" : "text-slate-500",
          );
          const inner = (
            <>
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-xl",
                  isActive ? "bg-emerald-500/15 ring-1 ring-emerald-500/30" : "bg-slate-100",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="max-w-[4.5rem] truncate text-[10px] font-medium">{item.label.split(" ")[0]}</span>
            </>
          );

          if (item.href) {
            return (
              <Link key={item.id} href={item.href} className={className}>
                {inner}
              </Link>
            );
          }

          return (
            <button key={item.id} type="button" onClick={() => onNavChange(item.id)} className={className}>
              {inner}
            </button>
          );
        })}
      </div>
      ) : null}
    </div>
  );
}
