import {
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  CalendarDays,
  ClipboardList,
  FileSearch,
  FolderKanban,
  GitCompareArrows,
  Handshake,
  Heart,
  LayoutDashboard,
  Megaphone,
  MessagesSquare,
  Package,
  PlusCircle,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Tags,
  Target,
  TrendingUp,
  Users,
  UserCircle,
  Workflow,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/types";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** match exactly instead of prefix */
  exact?: boolean;
  badge?: "notifications" | "messages" | "pendingVerifications" | "newRequirements" | "pendingMatches" | "opportunities" | "proRequests";
  pro?: boolean;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const NAV: Record<Role, NavGroup[]> = {
  buyer: [
    { items: [{ label: "Dashboard", href: "/buyer", icon: LayoutDashboard, exact: true }] },
    {
      label: "Requirements",
      items: [
        { label: "My requirements", href: "/buyer/requirements", icon: ClipboardList, exact: true },
        { label: "Post a requirement", href: "/buyer/requirements/new", icon: PlusCircle },
      ],
    },
    {
      label: "Discover",
      items: [
        { label: "Explore providers", href: "/buyer/discover", icon: FileSearch },
        { label: "Shortlist & saved", href: "/buyer/shortlist", icon: Heart },
        { label: "Compare", href: "/buyer/compare", icon: GitCompareArrows },
      ],
    },
    {
      label: "Engagements",
      items: [
        { label: "Opportunities", href: "/buyer/opportunities", icon: Target },
        { label: "Meetings", href: "/buyer/meetings", icon: CalendarDays },
        { label: "Elets Pro", href: "/buyer/pro", icon: Sparkles, pro: true },
      ],
    },
    {
      label: "Inbox",
      items: [
        { label: "Messages", href: "/buyer/messages", icon: MessagesSquare, badge: "messages" },
        { label: "Notifications", href: "/buyer/notifications", icon: Bell, badge: "notifications" },
      ],
    },
  ],
  provider: [
    { items: [{ label: "Dashboard", href: "/provider", icon: LayoutDashboard, exact: true }] },
    {
      label: "Pipeline",
      items: [
        { label: "Opportunities", href: "/provider/opportunities", icon: Target, badge: "opportunities" },
        { label: "Leads & introductions", href: "/provider/leads", icon: Handshake },
      ],
    },
    {
      label: "Company",
      items: [
        { label: "Company profile", href: "/provider/profile", icon: Building2 },
        { label: "Solutions & services", href: "/provider/solutions", icon: Package },
        { label: "Verification", href: "/provider/verification", icon: ShieldCheck },
        { label: "Analytics", href: "/provider/analytics", icon: BarChart3 },
      ],
    },
    {
      label: "Inbox",
      items: [
        { label: "Messages", href: "/provider/messages", icon: MessagesSquare, badge: "messages" },
        { label: "Notifications", href: "/provider/notifications", icon: Bell, badge: "notifications" },
      ],
    },
  ],
  admin: [
    { items: [{ label: "Overview", href: "/admin", icon: LayoutDashboard, exact: true }] },
    {
      label: "Pipeline",
      items: [
        { label: "Requirements", href: "/admin/requirements", icon: ClipboardList, badge: "newRequirements" },
        { label: "Matching review", href: "/admin/matching", icon: Workflow, badge: "pendingMatches" },
        { label: "Opportunities", href: "/admin/opportunities", icon: TrendingUp },
        { label: "Elets Pro", href: "/admin/pro", icon: Sparkles, pro: true, badge: "proRequests" },
      ],
    },
    {
      label: "Ecosystem",
      items: [
        { label: "Providers", href: "/admin/providers", icon: Briefcase, badge: "pendingVerifications" },
        { label: "Buyers", href: "/admin/buyers", icon: Users },
      ],
    },
    {
      label: "Configuration",
      items: [
        { label: "Categories", href: "/admin/categories", icon: Tags },
        { label: "Content", href: "/admin/content", icon: Megaphone },
      ],
    },
    {
      label: "Insights",
      items: [
        { label: "Reports", href: "/admin/reports", icon: BarChart3 },
        { label: "Audit log", href: "/admin/audit", icon: ScrollText },
        { label: "Messages", href: "/admin/messages", icon: MessagesSquare, badge: "messages" },
      ],
    },
  ],
};

export const PORTAL_LABEL: Record<Role, string> = {
  buyer: "Buyer workspace",
  provider: "Provider workspace",
  admin: "Operations console",
};

/** Static segment labels for breadcrumbs. Dynamic ids are resolved from the store. */
export const SEGMENT_LABEL: Record<string, string> = {
  buyer: "Buyer",
  provider: "Provider",
  admin: "Operations",
  requirements: "Requirements",
  new: "New requirement",
  discover: "Explore providers",
  providers: "Providers",
  shortlist: "Shortlist & saved",
  compare: "Compare",
  opportunities: "Opportunities",
  meetings: "Meetings",
  pro: "Elets Pro",
  messages: "Messages",
  notifications: "Notifications",
  leads: "Leads & introductions",
  profile: "Company profile",
  solutions: "Solutions & services",
  verification: "Verification",
  analytics: "Analytics",
  onboarding: "Onboarding",
  buyers: "Buyers",
  matching: "Matching review",
  categories: "Categories",
  content: "Content",
  reports: "Reports",
  audit: "Audit log",
  settings: "Settings",
};

export { FolderKanban, UserCircle };
