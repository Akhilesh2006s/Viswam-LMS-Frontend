import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Layers2,
  Building2,
  LibraryBig,
  CalendarDays,
  LineChart,
  CreditCard,
  SlidersHorizontal,
  GitCompare,
  Play,
} from "lucide-react";
import type { SuperAdminView } from "@/lib/super-admin-views";

export type SuperAdminViewMeta = {
  title: string;
  description: string;
  icon: LucideIcon;
};

export const SUPER_ADMIN_VIEW_META: Partial<Record<SuperAdminView, SuperAdminViewMeta>> = {
  dashboard: {
    title: "Command Center",
    description: "Platform overview, products, and live performance signals.",
    icon: LayoutDashboard,
  },
  products: {
    title: "Product catalog",
    description: "Define learning products schools subscribe to.",
    icon: Layers2,
  },
  admins: {
    title: "School Management",
    description: "Onboard institutions, admins, and access policies.",
    icon: Building2,
  },
  "subjects-and-content": {
    title: "Content studio",
    description: "Product curriculum, classes, subjects, uploads, and YouTube learning paths.",
    icon: LibraryBig,
  },
  "viswam-ott": {
    title: "Viswam OTT",
    description: "Upload streaming videos and manage per-school OTT restrictions.",
    icon: Play,
  },
  subjects: {
    title: "Subjects",
    description: "Manage subject catalog and mappings.",
    icon: LibraryBig,
  },
  calendar: {
    title: "School Calendar",
    description: "Academic events, milestones, and school schedules.",
    icon: CalendarDays,
  },
  analytics: {
    title: "Analytics",
    description: "Enterprise insights across schools and learners.",
    icon: LineChart,
  },
  subscriptions: {
    title: "Subscriptions",
    description: "Billing, plans, and revenue operations.",
    icon: CreditCard,
  },
  settings: {
    title: "System Settings",
    description: "Platform configuration and administrator shortcuts.",
    icon: SlidersHorizontal,
  },
};

export const SUPER_ADMIN_NAV_ITEMS: {
  id: SuperAdminView;
  label: string;
  icon: LucideIcon;
  group?: "core" | "content" | "insights" | "system";
}[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "core" },
  { id: "products", label: "Products", icon: Layers2, group: "core" },
  { id: "admins", label: "School Management", icon: Building2, group: "core" },
  { id: "subjects-and-content", label: "Content studio", icon: LibraryBig, group: "content" },
  { id: "viswam-ott", label: "Viswam OTT", icon: Play, group: "content" },
  { id: "calendar", label: "School Calendar", icon: CalendarDays, group: "content" },
  { id: "analytics", label: "Analytics", icon: LineChart, group: "insights" },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard, group: "insights" },
  { id: "settings", label: "Settings", icon: SlidersHorizontal, group: "system" },
];
