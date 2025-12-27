'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { api } from '@/lib/api';
import { StatusBadge } from '@/components/ui/status-badge';
import { format } from 'date-fns';

interface RouteAuth {
  id: string;
  driverProfile: {
    id: string;
    driverName: string;
    pfNumber: string;
  };
  routeSection: {
    code: string;
    name: string;
  };
  authorizedDate: string;
  expiryDate: string;
}

function getRouteStatus(expiryDate: string): 'ok' | 'dueSoon' | 'overdue' {
  const now = new Date();
  const expiry = new Date(expiryDate);
  const threeMonthsFromNow = new Date(now);
  threeMonthsFromNow.setMonth(now.getMonth() + 3);

  if (expiry < now) return 'overdue';
  if (expiry <= threeMonthsFromNow) return 'dueSoon';
  return 'ok';
}

export default function RoutesPage() {
  const [routeAuths, setRouteAuths] = useState<RouteAuth[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'overdue' | 'dueSoon'>('all');

  useEffect(() => {
    loadRouteAuths();
  }, []);

  const loadRouteAuths = async () => {
    try {
      const response = await api.get('/route-auth');
      setRouteAuths(response.data);
    } catch (error) {
      console.error('Failed to load route authorizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRoutes = routeAuths.filter((r) => {
    if (filter === 'all') return true;
    const status = getRouteStatus(r.expiryDate);
    return status === filter;
  });

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-1">
              Route Authorization
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage driver route section authorizations
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
              Expired
            </button>
            <button
              onClick={() => setFilter('dueSoon')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'dueSoon'
                  ? 'bg-amber-500 text-white'
                  : 'bg-accent/50 text-foreground hover:bg-accent'
              }`}
            >
              Expiring Soon
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
                        Driver
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Route Section
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Authorized Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Expiry Date
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {filteredRoutes.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-sm text-muted-foreground"
                        >
                          No route authorizations found
                        </td>
                      </tr>
                    ) : (
                      filteredRoutes.map((route) => {
                        const status = getRouteStatus(route.expiryDate);
                        return (
                          <tr
                            key={route.id}
                            className="hover:bg-accent/20 transition-colors"
                          >
                            <td className="px-4 py-3 text-sm">
                              <div>
                                <div className="font-medium text-foreground">
                                  {route.driverProfile.driverName}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  PF: {route.driverProfile.pfNumber}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm">
                              <div>
                                <div className="font-medium text-foreground">
                                  {route.routeSection.code}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  {route.routeSection.name}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground">
                              {format(
                                new Date(route.authorizedDate),
                                'MMM dd, yyyy'
                              )}
                            </td>
                            <td className="px-4 py-3 text-sm text-foreground">
                              {format(
                                new Date(route.expiryDate),
                                'MMM dd, yyyy'
                              )}
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
              {filteredRoutes.length === 0 ? (
                <div className="glass rounded-lg p-8 text-center text-sm text-muted-foreground">
                  No route authorizations found
                </div>
              ) : (
                filteredRoutes.map((route) => {
                  const status = getRouteStatus(route.expiryDate);
                  return (
                    <div
                      key={route.id}
                      className="glass rounded-lg p-4 border border-slate-700/50"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="font-medium text-foreground mb-1">
                            {route.driverProfile.driverName}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            PF: {route.driverProfile.pfNumber}
                          </div>
                        </div>
                        <StatusBadge status={status} />
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Route:
                          </span>
                          <span className="text-foreground">
                            {route.routeSection.code} -{' '}
                            {route.routeSection.name}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Authorized:
                          </span>
                          <span className="text-foreground">
                            {format(
                              new Date(route.authorizedDate),
                              'MMM dd, yyyy'
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">
                            Expires:
                          </span>
                          <span className="text-foreground">
                            {format(
                              new Date(route.expiryDate),
                              'MMM dd, yyyy'
                            )}
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
