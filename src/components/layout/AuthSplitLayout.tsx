import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ViswamLogo } from "@/components/brand/ViswamLogo";
import { COMPANY_NAME, POWERED_BY } from "@/lib/brand";
import { BarChart3, BookOpen, Shield, Sparkles } from "lucide-react";

type AuthSplitLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

const highlights = [
  { icon: BookOpen, label: "Structured learning paths" },
  { icon: BarChart3, label: "Enterprise analytics" },
  { icon: Shield, label: "Secure multi-tenant access" },
];

export function AuthSplitLayout({ title, description, children, footer }: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen flex bg-[var(--background)]">
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] relative overflow-hidden bg-[var(--brand-navy)]">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,168,107,0.18),transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(212,175,55,0.12),transparent_50%)]" />
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          <ViswamLogo variant="light" size="lg" />
          <div className="space-y-8 max-w-lg">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/90 mb-4">
                <Sparkles className="h-3.5 w-3.5 text-[var(--brand-gold)]" />
                Premium learning infrastructure
              </p>
              <h1 className="text-3xl xl:text-4xl font-bold text-white leading-tight">
                Technology-first education for modern institutions
              </h1>
              <p className="mt-4 text-base text-white/75 leading-relaxed">
                Manage schools, teachers, students, and outcomes from one trusted enterprise platform.
              </p>
            </div>
            <ul className="space-y-4">
              {highlights.map(({ icon: Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-white/90">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand-emerald)]/20 border border-[var(--brand-emerald)]/30">
                    <Icon className="h-5 w-5 text-[var(--brand-emerald)]" />
                  </span>
                  <span className="text-sm font-medium">{label}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-white/60">{POWERED_BY}</p>
            <p className="text-xs text-white/50">© {new Date().getFullYear()} {COMPANY_NAME}. All rights reserved.</p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8 flex justify-center">
            <ViswamLogo variant="dark" size="md" />
          </div>
          <div className="viswam-card p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-[var(--text-primary)]">{title}</h2>
              <p className="mt-1.5 text-sm text-[var(--text-secondary)]">{description}</p>
            </div>
            {children}
          </div>
          {footer ? <div className="mt-6 text-center">{footer}</div> : null}
        </motion.div>
      </div>
    </div>
  );
}

export default AuthSplitLayout;
