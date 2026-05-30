import { Link } from "wouter";
import { ArrowLeft, Search, Bell } from "lucide-react";

type OttTopBarProps = {
  showBack?: boolean;
  backHref?: string;
  onSearch?: () => void;
};

export function OttTopBar({ showBack, backHref = "/edu-ott", onSearch }: OttTopBarProps) {
  return (
    <header className="ott-topbar">
      <div className="ott-topbar-inner">
        <div className="flex items-center gap-3 min-w-0">
          {showBack ? (
            <Link href={backHref} className="rounded-lg p-2 text-white/80 hover:bg-white/10">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          ) : null}
          <Link href="/edu-ott" className="min-w-0">
            <p className="ott-brand-sub">By VISWAM LMS</p>
            <p className="ott-brand-title truncate">VISWAM OTT</p>
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onSearch}
            className="rounded-lg p-2.5 text-white/80 hover:bg-white/10"
            aria-label="Search"
          >
            <Search className="h-5 w-5" />
          </button>
          <Link href="/dashboard" className="rounded-lg p-2.5 text-white/80 hover:bg-white/10">
            <Bell className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </header>
  );
}
