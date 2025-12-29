"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { auth, User } from "@/lib/auth";
import { api } from "@/lib/api";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toaster";
import { MoreHorizontal, Eye, Calendar, Edit, Plus, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { isBefore, addDays, addMonths, format } from "date-fns";

interface Compliance {
  id: string;
  driverProfileId: string;
  complianceTypeId: string;
  doneDate: string;
  dueDate: string;
  frequencyMonths: number;
  notes: string | null;
  complianceType: {
    id: string;
    name: string;
    defaultFrequencyMonths: number;
  };
  driverProfile: {
    id: string;
    driverName: string;
    pfNumber: string;
    depot?: {
      id: string;
      name: string;
      code: string;
    };
  };
}

interface Depot {
  id: string;
  name: string;
  code: string;
}

interface ComplianceType {
  id: string;
  name: string;
  defaultFrequencyMonths: number;
}

interface DriverProfile {
  id: string;
  driverName: string;
  pfNumber: string;
  depot?: {
    id: string;
    name: string;
    code: string;
  };
}

export default function CompliancePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [compliances, setCompliances] = useState<Compliance[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [complianceTypes, setComplianceTypes] = useState<ComplianceType[]>([]);
  const [driverProfiles, setDriverProfiles] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepot, setSelectedDepot] = useState<string>("all");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Create dialog state
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    driverProfileId: "",
    complianceTypeId: "",
    doneDate: "",
    dueDate: "",
    frequencyMonths: 0,
    notes: "",
  });

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCompliance, setEditingCompliance] = useState<Compliance | null>(null);
  const [editForm, setEditForm] = useState({
    doneDate: "",
    dueDate: "",
    frequencyMonths: 0,
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    setUser(currentUser);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [compliancesRes, typesRes, depotsRes, driversRes] = await Promise.all([
        api.get("/driver-compliance"),
        api.get("/driver-compliance/types"),
        api.get("/depots"),
        api.get("/driver-profiles"),
      ]);
      setCompliances(compliancesRes.data);
      setComplianceTypes(typesRes.data);
      setDepots(depotsRes.data);
      setDriverProfiles(driversRes.data);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "Error",
        description: "Failed to load compliance data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkDone = async (compliance: Compliance) => {
    const doneDate = new Date().toISOString().split("T")[0];
    const dueDate = addMonths(new Date(), compliance.frequencyMonths)
      .toISOString()
      .split("T")[0];

    try {
      await api.patch(`/driver-compliance/${compliance.id}`, {
        doneDate,
        dueDate,
      });

      toast({
        title: "Success",
        description: "Compliance marked as done",
        variant: "success",
      });

      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update compliance",
        variant: "destructive",
      });
    }
  };

  const openEditDialog = (compliance: Compliance) => {
    setEditingCompliance(compliance);
    setEditForm({
      doneDate: format(new Date(compliance.doneDate), "yyyy-MM-dd"),
      dueDate: format(new Date(compliance.dueDate), "yyyy-MM-dd"),
      frequencyMonths: compliance.frequencyMonths,
    });
    setEditDialogOpen(true);
  };

  const handleEditCompliance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCompliance) return;

    setSubmitting(true);
    try {
      await api.patch(`/driver-compliance/${editingCompliance.id}`, {
        doneDate: editForm.doneDate,
        dueDate: editForm.dueDate,
        frequencyMonths: editForm.frequencyMonths,
      });

      toast({
        title: "Success",
        description: "Compliance updated successfully",
        variant: "success",
      });

      setEditDialogOpen(false);
      setEditingCompliance(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update compliance",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplianceTypeChange = (typeId: string) => {
    const selectedType = complianceTypes.find((t) => t.id === typeId);
    if (selectedType) {
      const doneDate = createForm.doneDate || format(new Date(), "yyyy-MM-dd");
      const dueDate = format(
        addMonths(new Date(doneDate), selectedType.defaultFrequencyMonths),
        "yyyy-MM-dd"
      );
      setCreateForm({
        ...createForm,
        complianceTypeId: typeId,
        frequencyMonths: selectedType.defaultFrequencyMonths,
        dueDate,
      });
    }
  };

  const handleDoneDateChange = (doneDate: string) => {
    if (createForm.frequencyMonths > 0) {
      const dueDate = format(
        addMonths(new Date(doneDate), createForm.frequencyMonths),
        "yyyy-MM-dd"
      );
      setCreateForm({ ...createForm, doneDate, dueDate });
    } else {
      setCreateForm({ ...createForm, doneDate });
    }
  };

  const handleCreateCompliance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/driver-compliance", {
        driverProfileId: createForm.driverProfileId,
        complianceTypeId: createForm.complianceTypeId,
        doneDate: createForm.doneDate,
        dueDate: createForm.dueDate,
        frequencyMonths: createForm.frequencyMonths,
        notes: createForm.notes || undefined,
      });

      toast({
        title: "Success",
        description: "Compliance record created successfully",
        variant: "success",
      });

      setCreateDialogOpen(false);
      setCreateForm({
        driverProfileId: "",
        complianceTypeId: "",
        doneDate: "",
        dueDate: "",
        frequencyMonths: 0,
        notes: "",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create compliance",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCompliance = async (id: string) => {
    if (!confirm("Are you sure you want to delete this compliance record?")) return;

    try {
      await api.delete(`/driver-compliance/${id}`);
      toast({
        title: "Success",
        description: "Compliance record deleted",
        variant: "success",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete compliance",
        variant: "destructive",
      });
    }
  };

  const now = new Date();
  const warningDate = addDays(now, 7);

  const getStatus = (dueDate: string) => {
    const due = new Date(dueDate);
    if (isBefore(due, now)) return "overdue";
    if (isBefore(due, warningDate)) return "due-soon";
    return "current";
  };

  // Base filtered compliances (depot + type filters only, for stats)
  const baseFilteredCompliances = compliances.filter((compliance) => {
    if (selectedDepot !== "all" && compliance.driverProfile.depot?.id !== selectedDepot) {
      return false;
    }
    if (selectedType !== "all" && compliance.complianceType.id !== selectedType) {
      return false;
    }
    return true;
  });

  // Full filtered compliances (includes status filter, for table display)
  const filteredCompliances = baseFilteredCompliances.filter((compliance) => {
    if (selectedStatus !== "all") {
      const status = getStatus(compliance.dueDate);
      if (status !== selectedStatus) return false;
    }
    return true;
  });

  const columns: ColumnDef<Compliance>[] = [
    {
      id: "driverName",
      accessorFn: (row) => row.driverProfile.driverName,
      header: "Driver",
      cell: ({ row }) => {
        const driver = row.original.driverProfile;
        return (
          <div>
            <p className="font-medium">{driver.driverName}</p>
            <p className="text-xs text-muted-foreground">{driver.pfNumber}</p>
          </div>
        );
      },
      filterFn: (row, id, filterValue) => {
        const driverName = row.original.driverProfile.driverName.toLowerCase();
        const pfNumber = row.original.driverProfile.pfNumber.toLowerCase();
        const searchValue = String(filterValue).toLowerCase();
        return driverName.includes(searchValue) || pfNumber.includes(searchValue);
      },
    },
    {
      accessorKey: "complianceType.name",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant="secondary">{row.original.complianceType.name}</Badge>
      ),
    },
    {
      accessorKey: "driverProfile.depot.code",
      header: "Depot",
      cell: ({ row }) => {
        const depot = row.original.driverProfile.depot;
        return depot ? (
          <Badge variant="outline">{depot.code}</Badge>
        ) : (
          <span className="text-muted-foreground">N/A</span>
        );
      },
    },
    {
      accessorKey: "doneDate",
      header: "Done Date",
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.getValue("doneDate")).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: "frequencyMonths",
      header: "Schedule",
      cell: ({ row }) => {
        const frequency = row.getValue("frequencyMonths") as number;
        return (
          <Badge variant="outline">
            {frequency} {frequency === 1 ? "month" : "months"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "dueDate",
      header: "Due Date",
      cell: ({ row }) => {
        const dueDate = row.getValue("dueDate") as string;
        const status = getStatus(dueDate);
        return (
          <span
            className={cn(
              "text-sm",
              status === "overdue" && "text-destructive font-medium",
              status === "due-soon" && "text-warning font-medium"
            )}
          >
            {new Date(dueDate).toLocaleDateString()}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = getStatus(row.original.dueDate);
        return (
          <Badge
            variant={
              status === "overdue"
                ? "destructive"
                : status === "due-soon"
                ? "warning"
                : "success"
            }
          >
            {status === "overdue"
              ? "Overdue"
              : status === "due-soon"
              ? "Due Soon"
              : "Current"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const compliance = row.original;
        const canEdit = user?.role === "SUPER_ADMIN" || user?.role === "DEPOT_MANAGER";

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() =>
                  router.push(`/dashboard/drivers/${compliance.driverProfileId}`)
                }
              >
                <Eye className="mr-2 h-4 w-4" />
                View Driver
              </DropdownMenuItem>
              {canEdit && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => openEditDialog(compliance)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Compliance
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleMarkDone(compliance)}>
                    <Calendar className="mr-2 h-4 w-4" />
                    Mark Done Today
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDeleteCompliance(compliance.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  // Summary stats (based on depot+type filters only, not status filter)
  const overdueCount = baseFilteredCompliances.filter(
    (c) => getStatus(c.dueDate) === "overdue"
  ).length;
  const dueSoonCount = baseFilteredCompliances.filter(
    (c) => getStatus(c.dueDate) === "due-soon"
  ).length;
  const currentCount = baseFilteredCompliances.filter(
    (c) => getStatus(c.dueDate) === "current"
  ).length;

  const canCreate = user?.role === "SUPER_ADMIN" || user?.role === "DEPOT_MANAGER";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Compliance Management</h2>
          <p className="text-muted-foreground">
            Track and manage driver compliance records
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Compliance
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card
          className={cn(
            "cursor-pointer transition-base",
            selectedStatus === "overdue" && "border-destructive"
          )}
          onClick={() =>
            setSelectedStatus(selectedStatus === "overdue" ? "all" : "overdue")
          }
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-destructive/10">
                <div className="w-3 h-3 rounded-full bg-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={cn(
            "cursor-pointer transition-base",
            selectedStatus === "due-soon" && "border-warning"
          )}
          onClick={() =>
            setSelectedStatus(selectedStatus === "due-soon" ? "all" : "due-soon")
          }
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Due Soon</p>
                <p className="text-2xl font-bold text-warning">{dueSoonCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-warning/10">
                <div className="w-3 h-3 rounded-full bg-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card
          className={cn(
            "cursor-pointer transition-base",
            selectedStatus === "current" && "border-success"
          )}
          onClick={() =>
            setSelectedStatus(selectedStatus === "current" ? "all" : "current")
          }
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Current</p>
                <p className="text-2xl font-bold text-success">{currentCount}</p>
              </div>
              <div className="p-2 rounded-lg bg-success/10">
                <div className="w-3 h-3 rounded-full bg-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        {user?.role === "SUPER_ADMIN" && (
          <Select value={selectedDepot} onValueChange={setSelectedDepot}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by depot" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Depots</SelectItem>
              {depots.map((depot) => (
                <SelectItem key={depot.id} value={depot.id}>
                  {depot.name} ({depot.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {complianceTypes.map((type) => (
              <SelectItem key={type.id} value={type.id}>
                {type.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selectedStatus !== "all" && (
          <Button variant="outline" onClick={() => setSelectedStatus("all")}>
            Clear Status Filter
          </Button>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredCompliances}
        searchKey="driverName"
        searchPlaceholder="Search by driver name..."
        loading={loading}
      />

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Compliance</DialogTitle>
            <DialogDescription>
              Update compliance details for {editingCompliance?.driverProfile.driverName} - {editingCompliance?.complianceType.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditCompliance}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="doneDate">Done Date</Label>
                  <Input
                    id="doneDate"
                    type="date"
                    value={editForm.doneDate}
                    onChange={(e) =>
                      setEditForm({ ...editForm, doneDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input
                    id="dueDate"
                    type="date"
                    value={editForm.dueDate}
                    onChange={(e) =>
                      setEditForm({ ...editForm, dueDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="frequencyMonths">Schedule (months)</Label>
                <Input
                  id="frequencyMonths"
                  type="number"
                  min="1"
                  max="120"
                  value={editForm.frequencyMonths}
                  onChange={(e) =>
                    setEditForm({ ...editForm, frequencyMonths: parseInt(e.target.value) || 1 })
                  }
                  required
                />
                <p className="text-xs text-muted-foreground">
                  How often this compliance check should be done
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Compliance Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Compliance Record</DialogTitle>
            <DialogDescription>
              Create a new compliance record for a driver
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateCompliance}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="driverProfileId">Driver</Label>
                <Select
                  value={createForm.driverProfileId}
                  onValueChange={(value) =>
                    setCreateForm({ ...createForm, driverProfileId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {driverProfiles.map((driver) => (
                      <SelectItem key={driver.id} value={driver.id}>
                        {driver.driverName} ({driver.pfNumber})
                        {driver.depot && ` - ${driver.depot.code}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="complianceTypeId">Compliance Type</Label>
                <Select
                  value={createForm.complianceTypeId}
                  onValueChange={handleComplianceTypeChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select compliance type" />
                  </SelectTrigger>
                  <SelectContent>
                    {complianceTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>
                        {type.name} ({type.defaultFrequencyMonths} months)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="createDoneDate">Done Date</Label>
                  <Input
                    id="createDoneDate"
                    type="date"
                    value={createForm.doneDate}
                    onChange={(e) => handleDoneDateChange(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="createDueDate">Due Date</Label>
                  <Input
                    id="createDueDate"
                    type="date"
                    value={createForm.dueDate}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, dueDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="createFrequencyMonths">Schedule (months)</Label>
                <Input
                  id="createFrequencyMonths"
                  type="number"
                  min="1"
                  max="120"
                  value={createForm.frequencyMonths || ""}
                  onChange={(e) =>
                    setCreateForm({
                      ...createForm,
                      frequencyMonths: parseInt(e.target.value) || 0,
                    })
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (optional)</Label>
                <Input
                  id="notes"
                  value={createForm.notes}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, notes: e.target.value })
                  }
                  placeholder="Any additional notes..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  submitting ||
                  !createForm.driverProfileId ||
                  !createForm.complianceTypeId ||
                  !createForm.doneDate ||
                  !createForm.dueDate ||
                  !createForm.frequencyMonths
                }
              >
                {submitting ? "Creating..." : "Create Compliance"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

