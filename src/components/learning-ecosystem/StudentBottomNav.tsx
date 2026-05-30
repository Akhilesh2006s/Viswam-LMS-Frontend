import { Link, useLocation } from "wouter";
import { Home, BookOpen, Play, User } from "lucide-react";

const NAV = [
  { path: "/dashboard", label: "Home", icon: Home },
  { path: "/learning-paths", label: "Learn", icon: BookOpen },
  { path: "/edu-ott", label: "OTT", icon: Play },
  { path: "/profile", label: "Profile", icon: User },
] as const;

export function StudentBottomNav() {
  const [location] = useLocation();

  return (
    <nav className="eco-bottom-nav md:hidden" aria-label="Student navigation">
      <div className="mx-auto flex max-w-lg">
        {NAV.map(({ path, label, icon: Icon }) => {
          const active = location === path || (path === "/dashboard" && location === "/");
          return (
            <Link key={path} href={path} className={`eco-bottom-nav-item ${active ? "active" : ""}`}>
              <span className="eco-bottom-nav-icon">
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
