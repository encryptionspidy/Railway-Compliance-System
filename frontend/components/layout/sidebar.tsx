'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/auth';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  FileCheck,
  Route,
  Wrench,
  Settings,
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
    label: 'Driver Profiles',
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
    label: 'Route Authorization',
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
  {
    label: 'Settings',
    href: '/dashboard/settings',
    icon: Settings,
    roles: ['SUPER_ADMIN'],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const user = auth.getCurrentUser();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const visibleItems = navItems.filter((item) => item.roles.includes(user.role));

  return (
    <aside
      className={cn(
        'glass border-r border-slate-700/50 transition-all duration-200',
        collapsed ? 'w-16' : 'w-64',
        'hidden md:flex flex-col h-screen sticky top-0'
      )}
    >
      <div className="p-4 border-b border-slate-700/50">
        <div className="flex items-center justify-between">
          {!collapsed && (
            <h2 className="text-lg font-semibold text-foreground">
              Railway Compliance
            </h2>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-1.5 rounded hover:bg-accent transition-colors"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}
              />
            </svg>
          </button>
        </div>
      </div>

      <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
        {visibleItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <button
              key={item.href}
              onClick={() => router.push(item.href)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150',
                'hover:bg-accent/50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background',
                isActive
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-xs font-medium text-primary">
              {user.email.charAt(0).toUpperCase()}
            </span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user.email}
              </p>
              <p className="text-xs text-muted-foreground capitalize">
                {user.role.toLowerCase().replace('_', ' ')}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
