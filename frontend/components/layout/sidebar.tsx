"use client";
import { useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { auth, User } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, FileCheck, Route, Bell, Settings, Building2, UserCog, ChevronLeft, ChevronRight, History } from "lucide-react";

interface NavItem { label: string; href: string; icon: React.ComponentType<{ className?: string }>; roles: ("SUPER_ADMIN" | "DEPOT_MANAGER" | "DRIVER")[]; }

const superAdminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["SUPER_ADMIN"] },
  { label: "Depots", href: "/dashboard/depots", icon: Building2, roles: ["SUPER_ADMIN"] },
  { label: "Admins", href: "/dashboard/admins", icon: UserCog, roles: ["SUPER_ADMIN"] },
  { label: "Drivers", href: "/dashboard/drivers", icon: Users, roles: ["SUPER_ADMIN"] },
  { label: "Compliance", href: "/dashboard/compliance", icon: FileCheck, roles: ["SUPER_ADMIN"] },
  { label: "Routes", href: "/dashboard/routes", icon: Route, roles: ["SUPER_ADMIN"] },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell, roles: ["SUPER_ADMIN"] },
  { label: "Audit Log", href: "/dashboard/audit", icon: History, roles: ["SUPER_ADMIN"] },
  { label: "System Settings", href: "/dashboard/settings", icon: Settings, roles: ["SUPER_ADMIN"] },
];

const depotManagerNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["DEPOT_MANAGER"] },
  { label: "Drivers", href: "/dashboard/drivers", icon: Users, roles: ["DEPOT_MANAGER"] },
  { label: "Compliance", href: "/dashboard/compliance", icon: FileCheck, roles: ["DEPOT_MANAGER"] },
  { label: "Routes", href: "/dashboard/routes", icon: Route, roles: ["DEPOT_MANAGER"] },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell, roles: ["DEPOT_MANAGER"] },
];

const driverNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["DRIVER"] },
  { label: "My Compliance", href: "/dashboard/compliance", icon: FileCheck, roles: ["DRIVER"] },
  { label: "My Routes", href: "/dashboard/routes", icon: Route, roles: ["DRIVER"] },
  { label: "Notifications", href: "/dashboard/notifications", icon: Bell, roles: ["DRIVER"] },
];

function getNavItems(role: User["role"]): NavItem[] {
  switch (role) {
    case "SUPER_ADMIN": return superAdminNavItems;
    case "DEPOT_MANAGER": return depotManagerNavItems;
    case "DRIVER": return driverNavItems;
    default: return [];
  }
}

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = auth.getCurrentUser();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;
  const navItems = getNavItems(user.role);

  return (
    <aside className={cn("glass border-r transition-all duration-200 ease-out", collapsed ? "w-16" : "w-64", "hidden md:flex flex-col h-screen sticky top-0")}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        {!collapsed && <h2 className="text-base font-semibold text-foreground truncate">Railway CMS</h2>}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1.5 rounded-md hover:bg-accent transition-colors" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}>
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <button key={item.href} onClick={() => router.push(item.href)} className={cn("w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-base focus-ring", isActive ? "bg-primary/10 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-accent/50")}>
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-medium text-primary">{user.email.charAt(0).toUpperCase()}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
              <p className="text-xs text-muted-foreground">{user.role.replace("_", " ")}</p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

