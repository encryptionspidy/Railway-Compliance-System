'use client';

import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  FileCheck,
  Route,
  Wrench,
  Bell,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: string[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['SUPER_ADMIN', 'DEPOT_MANAGER', 'DRIVER'],
  },
  {
    label: 'Drivers',
    href: '/dashboard/drivers',
    icon: Users,
    roles: ['SUPER_ADMIN', 'DEPOT_MANAGER'],
  },
  {
    label: 'Compliance',
    href: '/dashboard/compliance',
    icon: FileCheck,
    roles: ['SUPER_ADMIN', 'DEPOT_MANAGER', 'DRIVER'],
  },
  {
    label: 'Routes',
    href: '/dashboard/routes',
    icon: Route,
    roles: ['SUPER_ADMIN', 'DEPOT_MANAGER', 'DRIVER'],
  },
  {
    label: 'Maintenance',
    href: '/dashboard/maintenance',
    icon: Wrench,
    roles: ['SUPER_ADMIN', 'DEPOT_MANAGER'],
  },
  {
    label: 'Notifications',
    href: '/dashboard/notifications',
    icon: Bell,
    roles: ['SUPER_ADMIN', 'DEPOT_MANAGER', 'DRIVER'],
  },
];

export function MobileNav() {
  const pathname = usePathname();
  const router = useRouter();
  const user = auth.getCurrentUser();

  if (!user) return null;

  const visibleItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 glass border-t border-slate-700/50 z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] px-3 py-2 rounded-lg transition-colors duration-150',
                'focus:outline-none focus:ring-2 focus:ring-primary',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )}
              aria-label={item.label}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
