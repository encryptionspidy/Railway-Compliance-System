'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui/status-badge';
import { format } from 'date-fns';
import { Filter, Plus } from 'lucide-react';

interface Compliance {
  id: string;
  driverProfile: {
    id: string;
    driverName: string;
    pfNumber: string;
  };
  complianceType: {
    name: string;
  };
  doneDate: string;
  dueDate: string;
  frequencyMonths: number;
  notes?: string;
}

function getStatus(dueDate: string): 'ok' | 'dueSoon' | 'overdue' {
  const now = new Date();
  const due = new Date(dueDate);
  const sevenDaysFromNow = new Date(now);
  sevenDaysFromNow.setDate(now.getDate() + 7);

  if (due < now) return 'overdue';
  if (due <= sevenDaysFromNow) return 'dueSoon';
  return 'ok';
}

export default function CompliancePage() {
  const [compliances, setCompliances] = useState<Compliance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'overdue' | 'dueSoon'>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    loadCompliances();
  }, []);

  const loadCompliances = async () => {
    try {
      const response = await api.get('/driver-compliance');
      setCompliances(response.data);
    } catch (error) {
      console.error('Failed to load compliances:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCompliances = compliances.filter((c) => {
    if (filter === 'all') return true;
    const status = getStatus(c.dueDate);
    return status === filter;
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-1">
              Compliance Management
            </h1>
            <p className="text-sm text-muted-foreground">
              Track and manage driver compliance schedules
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg glass border border-slate-700/50 hover:bg-accent/50 transition-colors"
            >
              <Filter className="w-4 h-4" />
              <span className="text-sm">Filter</span>
            </button>
          </div>
        </div>

        {showFilters && (
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
        )}

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
                        Driver
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Done Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Due Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Frequency
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredCompliances.length === 0 ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-4 py-8 text-center text-sm text-muted-foreground"
                        >
                          No compliance records found
                        </td>
                      </tr>
                    ) : (
                      filteredCompliances.map((compliance) => {
                        const status = getStatus(compliance.dueDate);
                        return (
                          <tr
                            key={compliance.id}
                            className="hover:bg-accent/20 transition-colors"
                          >
                            <td className="px-4 py-3 text-sm">
                              <div>
                                <div className="font-medium text-foreground">
                                  {compliance.driverProfile.driverName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  PF: {compliance.driverProfile.pfNumber}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground">
                              {compliance.complianceType.name}
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground">
                              {format(
                                new Date(compliance.doneDate),
                                'MMM dd, yyyy'
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground">
                              {format(
                                new Date(compliance.dueDate),
                                'MMM dd, yyyy'
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <StatusBadge status={status} />
                            </td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {compliance.frequencyMonths} months
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
              {filteredCompliances.length === 0 ? (
                <div className="glass rounded-lg p-8 text-center text-sm text-muted-foreground">
                  No compliance records found
                </div>
              ) : (
                filteredCompliances.map((compliance) => {
                  const status = getStatus(compliance.dueDate);
                  return (
                    <div
                      key={compliance.id}
                      className="glass rounded-lg p-4 border border-slate-700/50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="font-medium text-foreground mb-1">
                            {compliance.driverProfile.driverName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            PF: {compliance.driverProfile.pfNumber}
                          </div>
                        </div>
                        <StatusBadge status={status} />
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Type:</span>
                          <span className="text-foreground">
                            {compliance.complianceType.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Done Date:
                          </span>
                          <span className="text-foreground">
                            {format(
                              new Date(compliance.doneDate),
                              'MMM dd, yyyy'
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Due Date:
                          </span>
                          <span className="text-foreground">
                            {format(
                              new Date(compliance.dueDate),
                              'MMM dd, yyyy'
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Frequency:
                          </span>
                          <span className="text-foreground">
                            {compliance.frequencyMonths} months
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
