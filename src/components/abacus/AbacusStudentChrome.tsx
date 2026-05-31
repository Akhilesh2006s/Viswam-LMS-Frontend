import { PremiumDashboardShell } from '@/components/layout/PremiumDashboardShell';
import type { AbacusPortalProfile } from '@/lib/abacus-api';
import { ABACUS_STUDENT_NAV } from '@/lib/abacus-student-nav';
import { abacusLogout } from '@/lib/abacus-logout';

type AbacusStudentChromeProps = {
  activeId: string;
  profile: AbacusPortalProfile;
  children: React.ReactNode;
  wide?: boolean;
};

export function AbacusStudentChrome({ activeId, profile, children, wide }: AbacusStudentChromeProps) {
  return (
    <PremiumDashboardShell
      subtitle="Abacus Student"
      navItems={ABACUS_STUDENT_NAV}
      activeId={activeId}
      onNavChange={() => {}}
      onLogout={abacusLogout}
      userName={profile.user.fullName}
      userEmail={profile.user.email}
      contentMaxWidth={wide ? 'wide' : 'centered'}
      mobileNavItems={ABACUS_STUDENT_NAV}
    >
      {children}
    </PremiumDashboardShell>
  );
}
