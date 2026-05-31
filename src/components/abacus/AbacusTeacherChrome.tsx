import { PremiumDashboardShell } from '@/components/layout/PremiumDashboardShell';
import type { AbacusPortalProfile } from '@/lib/abacus-api';
import { ABACUS_TEACHER_NAV } from '@/lib/abacus-teacher-nav';
import { abacusLogout } from '@/lib/abacus-logout';

type AbacusTeacherChromeProps = {
  activeId: string;
  profile: AbacusPortalProfile;
  children: React.ReactNode;
  wide?: boolean;
};

export function AbacusTeacherChrome({ activeId, profile, children, wide }: AbacusTeacherChromeProps) {
  return (
    <PremiumDashboardShell
      subtitle="Abacus Teacher"
      navItems={ABACUS_TEACHER_NAV}
      activeId={activeId}
      onNavChange={() => {}}
      onLogout={abacusLogout}
      userName={profile.user.fullName}
      userEmail={profile.user.email}
      contentMaxWidth={wide ? 'wide' : 'centered'}
      mobileNavItems={ABACUS_TEACHER_NAV}
    >
      {children}
    </PremiumDashboardShell>
  );
}
