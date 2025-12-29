"use client";

import { useEffect, useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { auth, User } from "@/lib/auth";
import { api } from "@/lib/api";
import { DataTable } from "@/components/ui/data-table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toaster";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { History, Filter } from "lucide-react";

interface AuditLog {
  id: string;
  userId: string;
  depotId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  oldValue: any;
  newValue: any;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  depot: {
    id: string;
    name: string;
    code: string;
  } | null;
}

interface Depot {
  id: string;
  name: string;
  code: string;
}

export default function AuditPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedDepot, setSelectedDepot] = useState<string>("all");
  const [selectedEntityType, setSelectedEntityType] = useState<string>("all");
  const [selectedAction, setSelectedAction] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    setUser(currentUser);
    loadData();
  }, []);

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN") {
      loadAuditLogs();
    }
  }, [selectedDepot, selectedEntityType, selectedAction, startDate, endDate, user]);

  const loadData = async () => {
    try {
      const depotsRes = await api.get("/depots");
      setDepots(depotsRes.data);
    } catch (error) {
      console.error("Failed to load data:", error);
    }
  };

  const loadAuditLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDepot !== "all") params.append("depotId", selectedDepot);
      if (selectedEntityType !== "all") params.append("entityType", selectedEntityType);
      if (selectedAction !== "all") params.append("action", selectedAction);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await api.get(`/audit?${params.toString()}`);
      setAuditLogs(response.data);
    } catch (error) {
      console.error("Failed to load audit logs:", error);
      toast({
        title: "Error",
        description: "Failed to load audit logs",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const columns: ColumnDef<AuditLog>[] = [
    {
      accessorKey: "createdAt",
      header: "Timestamp",
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.getValue("createdAt")).toLocaleString()}
        </span>
      ),
    },
    {
      accessorKey: "action",
      header: "Action",
      cell: ({ row }) => {
        const action = row.getValue("action") as string;
        return (
          <Badge
            variant={
              action === "CREATE"
                ? "success"
                : action === "DELETE"
                ? "destructive"
                : "secondary"
            }
          >
            {action}
          </Badge>
        );
      },
    },
    {
      accessorKey: "entityType",
      header: "Entity Type",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.getValue("entityType")}</span>
      ),
    },
    {
      accessorKey: "entityId",
      header: "Entity ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground truncate max-w-[120px] block">
          {row.getValue("entityId")}
        </span>
      ),
    },
    {
      accessorKey: "depot",
      header: "Depot",
      cell: ({ row }) => {
        const depot = row.original.depot;
        return depot ? (
          <Badge variant="outline">{depot.code}</Badge>
        ) : (
          <span className="text-muted-foreground">System</span>
        );
      },
    },
    {
      accessorKey: "userId",
      header: "User ID",
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground truncate max-w-[120px] block">
          {row.getValue("userId")}
        </span>
      ),
    },
    {
      accessorKey: "oldValue",
      header: "Override Info",
      cell: ({ row }) => {
        const oldValue = row.original.oldValue as any;
        if (oldValue?.overrideReason) {
          return (
            <div className="text-xs">
              <p className="text-warning">Override</p>
              <p className="text-muted-foreground truncate max-w-[200px]">
                {oldValue.overrideReason}
              </p>
            </div>
          );
        }
        return <span className="text-muted-foreground">-</span>;
      },
    },
  ];

  const entityTypes = [
    "User",
    "DriverProfile",
    "DriverCompliance",
    "DriverRouteAuth",
    "Depot",
    "RouteSection",
  ];

  if (user?.role !== "SUPER_ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-lg text-muted-foreground">Access denied</p>
        <p className="text-sm text-muted-foreground">
          Only Super Admins can view audit logs
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Audit Log</h2>
        <p className="text-muted-foreground">
          View all system changes and modifications
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Depot</Label>
              <Select value={selectedDepot} onValueChange={setSelectedDepot}>
                <SelectTrigger>
                  <SelectValue placeholder="All depots" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Depots</SelectItem>
                  {depots.map((depot) => (
                    <SelectItem key={depot.id} value={depot.id}>
                      {depot.code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Entity Type</Label>
              <Select value={selectedEntityType} onValueChange={setSelectedEntityType}>
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {entityTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Action</Label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder="All actions" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="CREATE">CREATE</SelectItem>
                  <SelectItem value="UPDATE">UPDATE</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Logs</p>
                <p className="text-2xl font-bold">{auditLogs.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10">
                <History className="w-5 h-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Creates</p>
                <p className="text-2xl font-bold text-success">
                  {auditLogs.filter((l) => l.action === "CREATE").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Updates</p>
                <p className="text-2xl font-bold text-warning">
                  {auditLogs.filter((l) => l.action === "UPDATE").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Deletes</p>
                <p className="text-2xl font-bold text-destructive">
                  {auditLogs.filter((l) => l.action === "DELETE").length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={auditLogs}
        searchKey="entityType"
        searchPlaceholder="Search by entity type..."
        loading={loading}
      />
    </div>
  );
}

