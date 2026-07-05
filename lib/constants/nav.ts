import {
  LayoutDashboard,
  Target,
  Code2,
  GitBranch,
  FolderKanban,
  Briefcase,
  FileText,
  BookOpen,
  TestTube2,
  CalendarDays,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  shortcut?: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, shortcut: "D" },
  { label: "Goals", href: "/goals", icon: Target, shortcut: "G" },
  { label: "DSA", href: "/dsa", icon: Code2, shortcut: "S" },
  { label: "Roadmap", href: "/roadmap", icon: GitBranch, shortcut: "R" },
  { label: "Projects", href: "/projects", icon: FolderKanban, shortcut: "P" },
  { label: "Interviews", href: "/interviews", icon: Briefcase, shortcut: "I" },
  { label: "Resume", href: "/resume", icon: FileText },
  { label: "Learning", href: "/learning", icon: BookOpen, shortcut: "L" },
  { label: "Testing", href: "/testing", icon: TestTube2 },
  { label: "Calendar", href: "/calendar", icon: CalendarDays, shortcut: "C" },
  { label: "Analytics", href: "/analytics", icon: BarChart3, shortcut: "A" },
];

export const SETTINGS_ITEM: NavItem = {
  label: "Settings",
  href: "/settings",
  icon: Settings,
};
