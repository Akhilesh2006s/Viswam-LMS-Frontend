import { Suspense, useEffect } from 'react';
import { PremiumDashboardShell, type PremiumNavItem } from '@/components/layout/PremiumDashboardShell';
import { Skeleton } from '@/components/ui/skeleton';
import { InteractiveBackground, FloatingParticles } from '@/components/background/InteractiveBackground';
import type { AbacusPortalProfile } from '@/lib/abacus-api';
import { abacusLogout } from '@/lib/abacus-logout';

type AbacusPortalShellProps = {
  subtitle: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
  navItems: PremiumNavItem[];
  profile: AbacusPortalProfile;
  children: React.ReactNode;
};

export function AbacusPortalShell({
  subtitle,
  activeTab,
  onTabChange,
  navItems,
  profile,
  children,
}: AbacusPortalShellProps) {
  useEffect(() => {
    document.documentElement.classList.add('dashboard-no-scrollbar');
    document.body.classList.add('dashboard-no-scrollbar');
    return () => {
      document.documentElement.classList.remove('dashboard-no-scrollbar');
      document.body.classList.remove('dashboard-no-scrollbar');
    };
  }, []);

  return (
    <div className="relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden" aria-hidden>
        <InteractiveBackground />
        <FloatingParticles />
      </div>
      <div className="relative z-10">
        <PremiumDashboardShell
          subtitle={subtitle}
          navItems={navItems}
          activeId={activeTab}
          onNavChange={onTabChange}
          onLogout={abacusLogout}
          userName={profile.user.fullName}
          userEmail={profile.user.email}
          contentMaxWidth="wide"
          mobileNavItems={navItems}
        >
          <Suspense fallback={<AbacusDashboardSkeleton />}>{children}</Suspense>
        </PremiumDashboardShell>
      </div>
    </div>
  );
}

export function AbacusDashboardSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-36 w-full rounded-2xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}

export function AbacusWelcomeBanner({
  profile,
  roleLabel,
}: {
  profile: AbacusPortalProfile;
  roleLabel: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-[#0B1F3A] via-[#123456] to-emerald-900 p-6 sm:p-8 text-white shadow-lg">
      <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-amber-400/10 blur-2xl" />
      <div className="absolute -bottom-10 left-1/3 h-32 w-32 rounded-full bg-emerald-400/10 blur-2xl" />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-200/90">
          Viswam Abacus · {roleLabel}
        </p>
        <h1 className="mt-2 text-2xl font-bold sm:text-3xl">
          Welcome back, {profile.user.fullName.split(' ')[0]}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-white/75 sm:text-base">
          {profile.school
            ? `${profile.school.name} · ${profile.school.schoolCode}`
            : 'Your abacus learning portal'}
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
            {profile.user.category}
          </span>
          <span className="rounded-full border border-amber-300/30 bg-amber-400/15 px-3 py-1 text-xs font-medium text-amber-100">
            Level {profile.user.level}
          </span>
          {profile.user.className ? (
            <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium">
              Class {profile.user.className}
            </span>
          ) : null}
        </div>
      </div>
    </div>
  );
}
