'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui/status-badge';
import { format } from 'date-fns';

interface MaintenanceSchedule {
  id: string;
  asset: {
    assetNumber: string;
    assetType: string;
    currentHours?: number;
    depot: {
      name: string;
    };
  };
  maintenanceType: {
    name: string;
  };
  lastCompletedDate?: string;
  nextDueDate?: string;
  lastCompletedHours?: number;
  nextDueHours?: number;
  notes?: string;
}

function getMaintenanceStatus(
  nextDueDate?: string,
  nextDueHours?: number,
  currentHours?: number
): 'ok' | 'dueSoon' | 'overdue' {
  if (nextDueDate) {
    const now = new Date();
    const due = new Date(nextDueDate);
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(now.getDate() + 7);

    if (due < now) return 'overdue';
    if (due <= sevenDaysFromNow) return 'dueSoon';
    return 'ok';
  }

  if (nextDueHours && currentHours) {
    if (currentHours >= nextDueHours) return 'overdue';
    if (currentHours >= nextDueHours * 0.9) return 'dueSoon';
    return 'ok';
  }

  return 'ok';
}

export default function MaintenancePage() {
  const [schedules, setSchedules] = useState<MaintenanceSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'overdue' | 'dueSoon'>('all');

  useEffect(() => {
    loadSchedules();
  }, []);

  const loadSchedules = async () => {
    try {
      const response = await api.get('/maintenance');
      setSchedules(response.data);
    } catch (error) {
      console.error('Failed to load maintenance schedules:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSchedules = schedules.filter((s) => {
    if (filter === 'all') return true;
    const status = getMaintenanceStatus(
      s.nextDueDate,
      s.nextDueHours,
      s.asset.currentHours
    );
    return status === filter;
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-1">
              Maintenance Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Track asset maintenance schedules
            </p>
          </div>
        </div>

        <div className="glass rounded-lg p-4 border border-slate-700/50">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-accent/50 text-foreground hover:bg-accent'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilter('overdue')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'overdue'
                  ? 'bg-destructive text-destructive-foreground'
                  : 'bg-accent/50 text-foreground hover:bg-accent'
              }`}
            >
              Overdue
            </button>
            <button
              onClick={() => setFilter('dueSoon')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'dueSoon'
                  ? 'bg-amber-500 text-white'
                  : 'bg-accent/50 text-foreground hover:bg-accent'
              }`}
            >
              Due Soon
            </button>
          </div>
        </div>

        {loading ? (
          <div className="glass rounded-lg p-8 text-center text-muted-foreground">
            Loading...
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden md:block glass rounded-lg border border-slate-700/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-accent/30 border-b border-slate-700/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Asset
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Maintenance Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Last Completed
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Next Due
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredSchedules.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-sm text-muted-foreground"
                        >
                          No maintenance schedules found
                        </td>
                      </tr>
                    ) : (
                      filteredSchedules.map((schedule) => {
                        const status = getMaintenanceStatus(
                          schedule.nextDueDate,
                          schedule.nextDueHours,
                          schedule.asset.currentHours
                        );
                        return (
                          <tr
                            key={schedule.id}
                            className="hover:bg-accent/20 transition-colors"
                          >
                            <td className="px-4 py-3 text-sm">
                              <div>
                                <div className="font-medium text-foreground">
                                  {schedule.asset.assetNumber}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {schedule.asset.assetType} -{' '}
                                  {schedule.asset.depot.name}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground">
                              {schedule.maintenanceType.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground">
                              {schedule.lastCompletedDate
                                ? format(
                                    new Date(schedule.lastCompletedDate),
                                    'MMM dd, yyyy'
                                  )
                                : schedule.lastCompletedHours
                                ? `${schedule.lastCompletedHours} hrs`
                                : '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground">
                              {schedule.nextDueDate
                                ? format(
                                    new Date(schedule.nextDueDate),
                                    'MMM dd, yyyy'
                                  )
                                : schedule.nextDueHours
                                ? `${schedule.nextDueHours} hrs`
                                : '—'}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={status} />
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredSchedules.length === 0 ? (
                <div className="glass rounded-lg p-8 text-center text-sm text-muted-foreground">
                  No maintenance schedules found
                </div>
              ) : (
                filteredSchedules.map((schedule) => {
                  const status = getMaintenanceStatus(
                    schedule.nextDueDate,
                    schedule.nextDueHours,
                    schedule.asset.currentHours
                  );
                  return (
                    <div
                      key={schedule.id}
                      className="glass rounded-lg p-4 border border-slate-700/50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="font-medium text-foreground mb-1">
                            {schedule.asset.assetNumber}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {schedule.asset.assetType} -{' '}
                            {schedule.asset.depot.name}
                          </div>
                        </div>
                        <StatusBadge status={status} />
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="text-foreground">
                            {schedule.maintenanceType.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Last Completed:
                          </span>
                          <span className="text-foreground">
                            {schedule.lastCompletedDate
                              ? format(
                                  new Date(schedule.lastCompletedDate),
                                  'MMM dd, yyyy'
                                )
                              : schedule.lastCompletedHours
                              ? `${schedule.lastCompletedHours} hrs`
                              : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Next Due:
                          </span>
                          <span className="text-foreground">
                            {schedule.nextDueDate
                              ? format(
                                  new Date(schedule.nextDueDate),
                                  'MMM dd, yyyy'
                                )
                              : schedule.nextDueHours
                              ? `${schedule.nextDueHours} hrs`
                              : '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
