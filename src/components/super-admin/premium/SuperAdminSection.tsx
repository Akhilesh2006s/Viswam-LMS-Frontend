import type { SuperAdminView } from "@/lib/super-admin-views";
import { SUPER_ADMIN_VIEW_META } from "@/lib/super-admin-view-meta";
import { SuperAdminPageHeader } from "./SuperAdminPageHeader";

type SuperAdminSectionProps = {
  view: SuperAdminView;
  children: React.ReactNode;
  actions?: React.ReactNode;
  /** Skip auto header (e.g. custom page layout) */
  hideHeader?: boolean;
  /** Full-bleed inner layout without extra panel padding */
  flush?: boolean;
};

export function SuperAdminSection({ view, children, actions, hideHeader, flush }: SuperAdminSectionProps) {
  const meta = SUPER_ADMIN_VIEW_META[view];
  return (
    <div className="sa-premium-scope mx-auto w-full max-w-[1280px] space-y-5 sm:space-y-6">
      {!hideHeader && meta ? (
        <SuperAdminPageHeader
          title={meta.title}
          description={meta.description}
          icon={meta.icon}
          actions={actions}
        />
      ) : null}
      {flush ? children : <div className="sa-premium-panel">{children}</div>}
    </div>
  );
}
