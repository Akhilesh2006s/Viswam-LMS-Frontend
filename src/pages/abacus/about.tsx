import { Link } from 'wouter';
import { AbacusAboutContent } from '@/components/abacus/AbacusAboutContent';
import { AbacusModuleLayout } from '@/components/abacus/AbacusModuleLayout';
import { usePageTitle } from '@/hooks/use-page-title';
import { abacusDashboardRoute } from '@/lib/abacus-routes';
import { useAbacusPortal } from '@/hooks/use-abacus-portal';

export default function AbacusAboutPage() {
  usePageTitle('About Abacus');
  const { profile } = useAbacusPortal({ strict: false });
  const backHref = abacusDashboardRoute(profile?.user.role);

  return (
    <AbacusModuleLayout page="about" title="About Abacus" wide>
      <AbacusAboutContent />
      <div className="mt-8 flex justify-center pb-4">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-5 py-2.5 text-sm font-semibold text-emerald-800 shadow-sm transition hover:border-emerald-300 hover:bg-emerald-50"
        >
          ← Back to dashboard
        </Link>
      </div>
    </AbacusModuleLayout>
  );
}
