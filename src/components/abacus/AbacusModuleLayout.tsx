import { useLocation, useSearch } from 'wouter';

import { useEffect } from 'react';

import { AbacusStudentChrome } from '@/components/abacus/AbacusStudentChrome';

import { AbacusTeacherChrome } from '@/components/abacus/AbacusTeacherChrome';

import { useAbacusPortal } from '@/hooks/use-abacus-portal';

import { abacusStudentNavActiveId } from '@/lib/abacus-student-nav';

import { abacusTeacherNavActiveId } from '@/lib/abacus-teacher-nav';

import type { AbacusModulePage } from '@/lib/abacus-routes';

import { AbacusDashboardSkeleton } from '@/components/abacus/AbacusPortalShell';
import { ABACUS_THEME } from '@/lib/abacus-theme';



type AbacusModuleLayoutProps = {

  page?: AbacusModulePage;

  title?: string;

  children: React.ReactNode;

  wide?: boolean;

  requiredRole?: 'student' | 'teacher';

};



export function AbacusModuleLayout({ title, children, wide, requiredRole }: AbacusModuleLayoutProps) {

  const { loading, profile, error } = useAbacusPortal({ role: requiredRole, strict: Boolean(requiredRole) });

  const [pathname] = useLocation();

  const search = useSearch();



  useEffect(() => {

    document.title = title ? `VISWAM LMS | ${title}` : 'VISWAM LMS | Abacus';

  }, [title]);



  if (loading || !profile) {

    return (

      <div className="min-h-screen p-4 sm:p-6" style={{ backgroundColor: ABACUS_THEME.pageBg }}>

        <AbacusDashboardSkeleton />

      </div>

    );

  }



  if (error) {

    return (

      <div className="flex min-h-screen items-center justify-center p-6 text-sm text-red-600">

        {error}

      </div>

    );

  }



  const role = profile.user.role === 'teacher' ? 'teacher' : 'student';



  if (role === 'student') {

    return (

      <AbacusStudentChrome activeId={abacusStudentNavActiveId(pathname, search)} profile={profile} wide={wide}>

        {children}

      </AbacusStudentChrome>

    );

  }



  return (

    <AbacusTeacherChrome activeId={abacusTeacherNavActiveId(pathname, search)} profile={profile} wide={wide}>

      {children}

    </AbacusTeacherChrome>

  );

}


