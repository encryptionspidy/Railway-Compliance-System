"use client";

import { useEffect, useState } from "react";
import { auth, User } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import {
  Users,
  FileCheck,
  Route,
  AlertTriangle,
  Clock,
  CheckCircle,
  Building2,
  ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, isBefore, addDays } from "date-fns";

interface DashboardStats {
  totalDrivers: number;
  totalCompliances: number;
  totalRouteAuths: number;
  overdueCompliances: number;
  dueSoonCompliances: number;
  expiredRoutes: number;
  expiringRoutes: number;
}

interface UpcomingItem {
  id: string;
  type: "compliance" | "route";
  name: string;
  driverName: string;
  dueDate: string;
  status: "due-soon" | "overdue";
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  variant = "default",
}: {
  title: string;
  value: number | string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
  variant?: "default" | "warning" | "destructive" | "success";
}) {
  const variantStyles = {
    default: "border-border",
    warning: "border-warning/50 bg-warning/5",
    destructive: "border-destructive/50 bg-destructive/5",
    success: "border-success/50 bg-success/5",
  };

  const iconStyles = {
    default: "text-primary bg-primary/10",
    warning: "text-warning bg-warning/10",
    destructive: "text-destructive bg-destructive/10",
    success: "text-success bg-success/10",
  };

  return (
    <Card className={cn("transition-base hover:border-primary/30", variantStyles[variant])}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {trend && <p className="text-xs text-muted-foreground mt-1">{trend}</p>}
          </div>
          <div className={cn("p-3 rounded-lg", iconStyles[variant])}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function UpcomingItemCard({ item }: { item: UpcomingItem }) {
  const router = useRouter();
  const isOverdue = item.status === "overdue";

  return (
    <div
      className={cn(
        "p-4 rounded-lg border transition-base cursor-pointer hover:bg-accent/50",
        isOverdue ? "border-destructive/30 bg-destructive/5" : "border-warning/30 bg-warning/5"
      )}
      onClick={() =>
        router.push(
          item.type === "compliance" ? "/dashboard/compliance" : "/dashboard/routes"
        )
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <Badge variant={isOverdue ? "destructive" : "warning"}>
              {isOverdue ? "Overdue" : "Due Soon"}
            </Badge>
            <span className="text-xs text-muted-foreground capitalize">{item.type}</span>
          </div>
          <p className="font-medium mt-2 truncate">{item.name}</p>
          <p className="text-sm text-muted-foreground">{item.driverName}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium">
            {formatDistanceToNow(new Date(item.dueDate), { addSuffix: true })}
          </p>
          <p className="text-xs text-muted-foreground">
            {new Date(item.dueDate).toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
}

function SuperAdminDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [driversRes, compliancesRes, routeAuthsRes] = await Promise.all([
        api.get("/driver-profiles"),
        api.get("/driver-compliance"),
        api.get("/route-auth"),
      ]);

      const drivers = driversRes.data;
      const compliances = compliancesRes.data;
      const routeAuths = routeAuthsRes.data;
      const now = new Date();
      const warningDate = addDays(now, 7);

      // Calculate stats
      const overdueCompliances = compliances.filter(
        (c: any) => isBefore(new Date(c.dueDate), now)
      ).length;
      const dueSoonCompliances = compliances.filter(
        (c: any) =>
          !isBefore(new Date(c.dueDate), now) && isBefore(new Date(c.dueDate), warningDate)
      ).length;
      const expiredRoutes = routeAuths.filter(
        (r: any) => isBefore(new Date(r.expiryDate), now)
      ).length;
      const expiringRoutes = routeAuths.filter(
        (r: any) =>
          !isBefore(new Date(r.expiryDate), now) && isBefore(new Date(r.expiryDate), warningDate)
      ).length;

      setStats({
        totalDrivers: drivers.length,
        totalCompliances: compliances.length,
        totalRouteAuths: routeAuths.length,
        overdueCompliances,
        dueSoonCompliances,
        expiredRoutes,
        expiringRoutes,
      });

      // Build upcoming items
      const upcomingItems: UpcomingItem[] = [];

      compliances.forEach((c: any) => {
        const dueDate = new Date(c.dueDate);
        if (isBefore(dueDate, warningDate)) {
          upcomingItems.push({
            id: c.id,
            type: "compliance",
            name: c.complianceType?.name || "Unknown",
            driverName: c.driverProfile?.driverName || "Unknown",
            dueDate: c.dueDate,
            status: isBefore(dueDate, now) ? "overdue" : "due-soon",
          });
        }
      });

      routeAuths.forEach((r: any) => {
        const expiryDate = new Date(r.expiryDate);
        if (isBefore(expiryDate, warningDate)) {
          upcomingItems.push({
            id: r.id,
            type: "route",
            name: r.routeSection?.name || "Unknown Route",
            driverName: r.driverProfile?.driverName || "Unknown",
            dueDate: r.expiryDate,
            status: isBefore(expiryDate, now) ? "overdue" : "due-soon",
          });
        }
      });

      // Sort by date
      upcomingItems.sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );

      setUpcoming(upcomingItems.slice(0, 10));
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Drivers"
          value={stats?.totalDrivers || 0}
          icon={Users}
          variant="default"
        />
        <StatCard
          title="Compliances"
          value={stats?.totalCompliances || 0}
          icon={FileCheck}
          variant="default"
        />
        <StatCard
          title="Overdue Items"
          value={(stats?.overdueCompliances || 0) + (stats?.expiredRoutes || 0)}
          icon={AlertTriangle}
          variant="destructive"
        />
        <StatCard
          title="Due Soon"
          value={(stats?.dueSoonCompliances || 0) + (stats?.expiringRoutes || 0)}
          icon={Clock}
          variant="warning"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className="cursor-pointer transition-base hover:border-primary/30"
          onClick={() => router.push("/dashboard/drivers")}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium">Manage Drivers</span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-base hover:border-primary/30"
          onClick={() => router.push("/dashboard/compliance")}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileCheck className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium">View Compliances</span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-base hover:border-primary/30"
          onClick={() => router.push("/dashboard/depots")}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <span className="font-medium">Manage Depots</span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Attention Required</CardTitle>
          <CardDescription>
            Compliance and route authorizations that need immediate attention
          </CardDescription>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="w-12 h-12 text-success mb-4" />
              <p className="text-lg font-medium">All Clear</p>
              <p className="text-sm text-muted-foreground">
                No overdue or upcoming items require attention
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((item) => (
                <UpcomingItemCard key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DepotManagerDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [upcoming, setUpcoming] = useState<UpcomingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [driversRes, compliancesRes, routeAuthsRes] = await Promise.all([
        api.get("/driver-profiles"),
        api.get("/driver-compliance"),
        api.get("/route-auth"),
      ]);

      const drivers = driversRes.data;
      const compliances = compliancesRes.data;
      const routeAuths = routeAuthsRes.data;
      const now = new Date();
      const warningDate = addDays(now, 7);

      const overdueCompliances = compliances.filter(
        (c: any) => isBefore(new Date(c.dueDate), now)
      ).length;
      const dueSoonCompliances = compliances.filter(
        (c: any) =>
          !isBefore(new Date(c.dueDate), now) && isBefore(new Date(c.dueDate), warningDate)
      ).length;
      const expiredRoutes = routeAuths.filter(
        (r: any) => isBefore(new Date(r.expiryDate), now)
      ).length;
      const expiringRoutes = routeAuths.filter(
        (r: any) =>
          !isBefore(new Date(r.expiryDate), now) && isBefore(new Date(r.expiryDate), warningDate)
      ).length;

      setStats({
        totalDrivers: drivers.length,
        totalCompliances: compliances.length,
        totalRouteAuths: routeAuths.length,
        overdueCompliances,
        dueSoonCompliances,
        expiredRoutes,
        expiringRoutes,
      });

      // Build upcoming items (same logic as Super Admin)
      const upcomingItems: UpcomingItem[] = [];

      compliances.forEach((c: any) => {
        const dueDate = new Date(c.dueDate);
        if (isBefore(dueDate, warningDate)) {
          upcomingItems.push({
            id: c.id,
            type: "compliance",
            name: c.complianceType?.name || "Unknown",
            driverName: c.driverProfile?.driverName || "Unknown",
            dueDate: c.dueDate,
            status: isBefore(dueDate, now) ? "overdue" : "due-soon",
          });
        }
      });

      routeAuths.forEach((r: any) => {
        const expiryDate = new Date(r.expiryDate);
        if (isBefore(expiryDate, warningDate)) {
          upcomingItems.push({
            id: r.id,
            type: "route",
            name: r.routeSection?.name || "Unknown Route",
            driverName: r.driverProfile?.driverName || "Unknown",
            dueDate: r.expiryDate,
            status: isBefore(expiryDate, now) ? "overdue" : "due-soon",
          });
        }
      });

      upcomingItems.sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      );

      setUpcoming(upcomingItems.slice(0, 10));
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Depot Drivers"
          value={stats?.totalDrivers || 0}
          icon={Users}
          variant="default"
        />
        <StatCard
          title="Active Compliances"
          value={stats?.totalCompliances || 0}
          icon={FileCheck}
          variant="default"
        />
        <StatCard
          title="Overdue"
          value={(stats?.overdueCompliances || 0) + (stats?.expiredRoutes || 0)}
          icon={AlertTriangle}
          variant="destructive"
        />
        <StatCard
          title="Due Soon"
          value={(stats?.dueSoonCompliances || 0) + (stats?.expiringRoutes || 0)}
          icon={Clock}
          variant="warning"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className="cursor-pointer transition-base hover:border-primary/30"
          onClick={() => router.push("/dashboard/drivers")}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="font-medium">Manage Drivers</span>
                <p className="text-xs text-muted-foreground">View and create driver profiles</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-base hover:border-primary/30"
          onClick={() => router.push("/dashboard/compliance")}
        >
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileCheck className="w-5 h-5 text-primary" />
              </div>
              <div>
                <span className="font-medium">Compliance Tracking</span>
                <p className="text-xs text-muted-foreground">Update compliance records</p>
              </div>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground" />
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Items */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Attention Required</CardTitle>
          <CardDescription>Items requiring immediate action</CardDescription>
        </CardHeader>
        <CardContent>
          {upcoming.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="w-12 h-12 text-success mb-4" />
              <p className="text-lg font-medium">All Clear</p>
              <p className="text-sm text-muted-foreground">No items require attention</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcoming.map((item) => (
                <UpcomingItemCard key={`${item.type}-${item.id}`} item={item} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DriverDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [compliances, setCompliances] = useState<any[]>([]);
  const [routeAuths, setRouteAuths] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDriverData();
  }, []);

  const loadDriverData = async () => {
    try {
      const [profileRes, compliancesRes, routeAuthsRes] = await Promise.all([
        api.get("/users/me"),
        api.get("/driver-compliance"),
        api.get("/route-auth"),
      ]);

      setProfile(profileRes.data);
      setCompliances(compliancesRes.data);
      setRouteAuths(routeAuthsRes.data);
    } catch (error) {
      console.error("Failed to load driver data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const now = new Date();
  const warningDate = addDays(now, 7);

  const overdueCompliances = compliances.filter((c) =>
    isBefore(new Date(c.dueDate), now)
  );
  const dueSoonCompliances = compliances.filter(
    (c) =>
      !isBefore(new Date(c.dueDate), now) && isBefore(new Date(c.dueDate), warningDate)
  );
  const expiredRoutes = routeAuths.filter((r) =>
    isBefore(new Date(r.expiryDate), now)
  );
  const expiringRoutes = routeAuths.filter(
    (r) =>
      !isBefore(new Date(r.expiryDate), now) &&
      isBefore(new Date(r.expiryDate), warningDate)
  );

  return (
    <div className="space-y-6">
      {/* Alert Banners */}
      {(overdueCompliances.length > 0 || expiredRoutes.length > 0) && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30 animate-slide-in-top">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-destructive">Action Required</p>
              <p className="text-sm text-destructive/80 mt-1">
                You have {overdueCompliances.length + expiredRoutes.length} overdue item(s).
                Please contact your depot administrator.
              </p>
            </div>
          </div>
        </div>
      )}

      {dueSoonCompliances.length > 0 || expiringRoutes.length > 0 ? (
        <div className="p-4 rounded-lg bg-warning/10 border border-warning/30 animate-slide-in-top">
          <div className="flex items-start gap-3">
            <Clock className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-warning">Upcoming Due Dates</p>
              <p className="text-sm text-warning/80 mt-1">
                You have {dueSoonCompliances.length + expiringRoutes.length} item(s) due within the
                next 7 days.
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Profile Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">My Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Name</p>
              <p className="font-medium">{profile?.driverProfile?.driverName || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">PF Number</p>
              <p className="font-medium">{profile?.driverProfile?.pfNumber || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Designation</p>
              <p className="font-medium">{profile?.driverProfile?.designation || "N/A"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Depot</p>
              <p className="font-medium">{profile?.depot?.name || "N/A"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Compliance Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">My Compliance Status</CardTitle>
          <CardDescription>Current compliance records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {compliances.map((compliance) => {
              const dueDate = new Date(compliance.dueDate);
              const isOverdue = isBefore(dueDate, now);
              const isDueSoon = !isOverdue && isBefore(dueDate, warningDate);

              return (
                <div
                  key={compliance.id}
                  className={cn(
                    "p-4 rounded-lg border flex items-center justify-between",
                    isOverdue
                      ? "border-destructive/30 bg-destructive/5"
                      : isDueSoon
                      ? "border-warning/30 bg-warning/5"
                      : "border-border"
                  )}
                >
                  <div>
                    <p className="font-medium">{compliance.complianceType?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Done: {new Date(compliance.doneDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={isOverdue ? "destructive" : isDueSoon ? "warning" : "success"}
                    >
                      {isOverdue ? "Overdue" : isDueSoon ? "Due Soon" : "Current"}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Due: {dueDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Route Authorization Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">My Route Authorizations</CardTitle>
          <CardDescription>Current route permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {routeAuths.map((auth) => {
              const expiryDate = new Date(auth.expiryDate);
              const isExpired = isBefore(expiryDate, now);
              const isExpiring = !isExpired && isBefore(expiryDate, warningDate);

              return (
                <div
                  key={auth.id}
                  className={cn(
                    "p-4 rounded-lg border flex items-center justify-between",
                    isExpired
                      ? "border-destructive/30 bg-destructive/5"
                      : isExpiring
                      ? "border-warning/30 bg-warning/5"
                      : "border-border"
                  )}
                >
                  <div>
                    <p className="font-medium">{auth.routeSection?.name}</p>
                    <p className="text-xs text-muted-foreground">{auth.routeSection?.code}</p>
                  </div>
                  <div className="text-right">
                    <Badge
                      variant={isExpired ? "destructive" : isExpiring ? "warning" : "success"}
                    >
                      {isExpired ? "Expired" : isExpiring ? "Expiring" : "Active"}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-1">
                      Expires: {expiryDate.toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(auth.getCurrentUser());
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  switch (user.role) {
    case "SUPER_ADMIN":
      return <SuperAdminDashboard />;
    case "DEPOT_MANAGER":
      return <DepotManagerDashboard />;
    case "DRIVER":
      return <DriverDashboard />;
    default:
      return <div>Unknown role</div>;
  }
}

