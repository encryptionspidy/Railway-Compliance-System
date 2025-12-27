'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { api } from '@/lib/api';
import { format } from 'date-fns';

interface DriverProfile {
  id: string;
  pfNumber: string;
  driverName: string;
  designation: string;
  basicPay: number;
  dateOfAppointment: string;
  dateOfEntry: string;
  depot: {
    name: string;
    code: string;
  };
}

export default function DriversPage() {
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDrivers();
  }, []);

  const loadDrivers = async () => {
    try {
      const response = await api.get('/driver-profiles');
      setDrivers(response.data);
    } catch (error) {
      console.error('Failed to load drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground mb-1">
              Driver Profiles
            </h1>
            <p className="text-sm text-muted-foreground">
              Manage driver profile information
            </p>
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
                        PF Number
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Driver Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Designation
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Depot
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Appointment Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50">
                    {drivers.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-4 py-8 text-center text-sm text-muted-foreground"
                        >
                          No driver profiles found
                        </td>
                      </tr>
                    ) : (
                      drivers.map((driver) => (
                        <tr
                          key={driver.id}
                          className="hover:bg-accent/20 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm font-mono text-foreground">
                            {driver.pfNumber}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-foreground">
                            {driver.driverName}
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground">
                            {driver.designation}
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground">
                            {driver.depot.name} ({driver.depot.code})
                          </td>
                          <td className="px-4 py-3 text-sm text-foreground">
                            {format(
                              new Date(driver.dateOfAppointment),
                              'MMM dd, yyyy'
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {drivers.length === 0 ? (
                <div className="glass rounded-lg p-8 text-center text-sm text-muted-foreground">
                  No driver profiles found
                </div>
              ) : (
                drivers.map((driver) => (
                  <div
                    key={driver.id}
                    className="glass rounded-lg p-4 border border-slate-700/50"
                  >
                    <div className="mb-3">
                      <div className="font-medium text-foreground mb-1">
                        {driver.driverName}
                      </div>
                      <div className="text-xs font-mono text-muted-foreground">
                        PF: {driver.pfNumber}
                      </div>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Designation:
                        </span>
                        <span className="text-foreground">
                          {driver.designation}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Depot:</span>
                        <span className="text-foreground">
                          {driver.depot.name} ({driver.depot.code})
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">
                          Appointment:
                        </span>
                        <span className="text-foreground">
                          {format(
                            new Date(driver.dateOfAppointment),
                            'MMM dd, yyyy'
                          )}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
