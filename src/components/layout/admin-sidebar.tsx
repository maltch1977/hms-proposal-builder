"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  Users,
  Building2,
  UserCheck,
  DollarSign,
  Image as ImageIcon,
  Settings,
  ArrowLeft,
} from "lucide-react";

const adminNav = [
  { label: "Content Libraries", href: "/admin/libraries", icon: BookOpen },
  { label: "Personnel", href: "/admin/personnel", icon: Users },
  { label: "Past Projects", href: "/admin/projects", icon: Building2 },
  { label: "References", href: "/admin/references", icon: UserCheck },
  { label: "Cost Library", href: "/admin/cost-library", icon: DollarSign },
  { label: "Cover Photos", href: "/admin/cover-photos", icon: ImageIcon },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-full w-[220px] flex-col border-r border-border bg-muted/30">
      <div className="px-3 py-4">
        <Link
          href="/proposals"
          className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/50 transition-all duration-150"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Proposals
        </Link>
      </div>

      <nav className="flex-1 px-3 pb-4">
        <p className="mb-2 px-3 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          Admin
        </p>
        <div className="space-y-0.5">
          {adminNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
