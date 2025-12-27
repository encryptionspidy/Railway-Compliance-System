'use client';

import { api } from '@/lib/api';
import { useEffect, useState } from 'react';

interface DashboardStats {
  driverCount?: number;
  complianceCount?: number;
  overdueCount?: number;
  dueSoonCount?: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [drivers, compliance] = await Promise.all([
        api.get('/driver-profiles').catch(() => ({ data: [] })),
        api.get('/driver-compliance').catch(() => ({ data: [] })),
      ]);

      const compliances = compliance.data || [];
      const now = new Date();
      const sevenDaysFromNow = new Date(now);
      sevenDaysFromNow.setDate(now.getDate() + 7);

      const overdue = compliances.filter(
        (c: any) => new Date(c.dueDate) < now
      ).length;
      const dueSoon = compliances.filter(
        (c: any) =>
          new Date(c.dueDate) >= now &&
          new Date(c.dueDate) <= sevenDaysFromNow
      ).length;

      setStats({
        driverCount: drivers.data?.length || 0,
        complianceCount: compliances.length,
        overdueCount: overdue,
        dueSoonCount: dueSoon,
      });
    } catch (error) {
      // Silent fail
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground mb-1">
          Dashboard
        </h1>
        <p className="text-sm text-muted-foreground">
          Overview of compliance and maintenance status
        </p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="glass rounded-lg p-6 h-24 animate-pulse"
            />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Driver Profiles"
            value={stats.driverCount || 0}
            description="Total active drivers"
          />
          <StatCard
            label="Compliance Records"
            value={stats.complianceCount || 0}
            description="Active compliance items"
          />
          <StatCard
            label="Overdue"
            value={stats.overdueCount || 0}
            description="Requires immediate attention"
            variant="destructive"
          />
          <StatCard
            label="Due Soon"
            value={stats.dueSoonCount || 0}
            description="Within 7 days"
            variant="warning"
          />
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  description,
  variant = 'default',
}: {
  label: string;
  value: number;
  description: string;
  variant?: 'default' | 'destructive' | 'warning';
}) {
  const variantStyles = {
    default: 'text-foreground',
    destructive: 'text-destructive',
    warning: 'text-amber-500',
  };

  return (
    <div className="glass rounded-lg p-6 border border-slate-700/50">
      <p className="text-sm text-muted-foreground mb-1">{label}</p>
      <p className={`text-3xl font-semibold mb-1 ${variantStyles[variant]}`}>
        {value}
      </p>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
