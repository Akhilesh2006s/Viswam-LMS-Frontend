import { Link, useLocation } from "wouter";
import { Home, Search, BookOpen, User } from "lucide-react";

const NAV = [
  { path: "/edu-ott", label: "Home", icon: Home, match: (p: string) => p === "/edu-ott" },
  { path: "/edu-ott/search", label: "Search", icon: Search, match: (p: string) => p.startsWith("/edu-ott/search") },
  { path: "/edu-ott/my-learning", label: "Learn", icon: BookOpen, match: (p: string) => p.startsWith("/edu-ott/my-learning") },
  { path: "/profile", label: "Profile", icon: User, match: (p: string) => p === "/profile" },
] as const;

export function OttBottomNav() {
  const [location] = useLocation();
  return (
    <nav className="ott-bottom-nav md:hidden" aria-label="VISWAM OTT">
      <div className="ott-bottom-nav-inner">
        {NAV.map(({ path, label, icon: Icon, match }) => {
          const active = match(location);
          return (
            <Link key={path} href={path} className={`ott-bottom-item ${active ? "active" : ""}`}>
              <span className="ott-bottom-icon">
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              </span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
