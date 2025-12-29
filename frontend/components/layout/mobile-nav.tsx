"use client";
import { usePathname, useRouter } from "next/navigation";
import { auth, User } from "@/lib/auth";
import { cn } from "@/lib/utils";
import { LayoutDashboard, Users, FileCheck, Route, Bell, Building2 } from "lucide-react";

interface NavItem { label: string; href: string; icon: React.ComponentType<{ className?: string }>; }

function getMobileNavItems(role: User["role"]): NavItem[] {
  switch (role) {
    case "SUPER_ADMIN": return [{ label: "Home", href: "/dashboard", icon: LayoutDashboard }, { label: "Depots", href: "/dashboard/depots", icon: Building2 }, { label: "Drivers", href: "/dashboard/drivers", icon: Users }, { label: "Compliance", href: "/dashboard/compliance", icon: FileCheck }, { label: "Alerts", href: "/dashboard/notifications", icon: Bell }];
    case "DEPOT_MANAGER": return [{ label: "Home", href: "/dashboard", icon: LayoutDashboard }, { label: "Drivers", href: "/dashboard/drivers", icon: Users }, { label: "Compliance", href: "/dashboard/compliance", icon: FileCheck }, { label: "Routes", href: "/dashboard/routes", icon: Route }, { label: "Alerts", href: "/dashboard/notifications", icon: Bell }];
    case "DRIVER": return [{ label: "Home", href: "/dashboard", icon: LayoutDashboard }, { label: "Compliance", href: "/dashboard/compliance", icon: FileCheck }, { label: "Routes", href: "/dashboard/routes", icon: Route }, { label: "Alerts", href: "/dashboard/notifications", icon: Bell }];
    default: return [];
  }
}

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const user = auth.getCurrentUser();

  if (!user) return null;
  const navItems = getMobileNavItems(user.role);

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t z-50 safe-area-pb">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <button key={item.href} onClick={() => router.push(item.href)} className={cn("flex flex-col items-center justify-center gap-1 min-w-[48px] min-h-[48px] px-2 py-1 rounded-lg transition-base focus-ring", isActive ? "text-primary" : "text-muted-foreground")} aria-label={item.label}>
              <Icon className={cn("w-5 h-5", isActive && "scale-110")} /><span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

