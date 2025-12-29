"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ColumnDef } from "@tanstack/react-table";
import { auth, User } from "@/lib/auth";
import { api } from "@/lib/api";
import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Plus, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface DriverProfile {
  id: string;
  pfNumber: string;
  driverName: string;
  designation: string;
  basicPay: number;
  dateOfAppointment: string;
  dateOfEntry: string;
  depotId: string;
  user: {
    id: string;
    email: string;
    role: string;
  };
  depot: {
    id: string;
    name: string;
    code: string;
  };
}

interface Depot {
  id: string;
  name: string;
  code: string;
}

interface CreateDriverForm {
  email: string;
  password: string;
  pfNumber: string;
  driverName: string;
  designation: string;
  basicPay: string;
  dateOfAppointment: string;
  dateOfEntry: string;
  depotId: string;
}

const initialFormState: CreateDriverForm = {
  email: "",
  password: "",
  pfNumber: "",
  driverName: "",
  designation: "",
  basicPay: "",
  dateOfAppointment: "",
  dateOfEntry: "",
  depotId: "",
};

export default function DriversPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<CreateDriverForm>(initialFormState);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    setUser(currentUser);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [driversRes, depotsRes] = await Promise.all([
        api.get("/driver-profiles"),
        api.get("/depots"),
      ]);
      setDrivers(driversRes.data);
      setDepots(depotsRes.data);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "Error",
        description: "Failed to load drivers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/driver-profiles", {
        ...formData,
        basicPay: parseInt(formData.basicPay, 10),
      });

      toast({
        title: "Success",
        description: "Driver created successfully",
        variant: "success",
      });

      setCreateDialogOpen(false);
      setFormData(initialFormState);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create driver",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDriver = async (id: string) => {
    if (!confirm("Are you sure you want to delete this driver?")) return;

    try {
      await api.delete(`/driver-profiles/${id}`);
      toast({
        title: "Success",
        description: "Driver deleted successfully",
        variant: "success",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete driver",
        variant: "destructive",
      });
    }
  };

  const columns: ColumnDef<DriverProfile>[] = [
    {
      accessorKey: "pfNumber",
      header: "PF Number",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.getValue("pfNumber")}</span>
      ),
    },
    {
      accessorKey: "driverName",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("driverName")}</span>
      ),
    },
    {
      accessorKey: "designation",
      header: "Designation",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("designation")}
        </span>
      ),
    },
    {
      accessorKey: "depot",
      header: "Depot",
      cell: ({ row }) => {
        const depot = row.original.depot;
        return (
          <Badge variant="secondary">
            {depot?.code || "N/A"}
          </Badge>
        );
      },
    },
    {
      accessorKey: "user",
      header: "Email",
      cell: ({ row }) => {
        const user = row.original.user;
        return (
          <span className="text-sm text-muted-foreground">
            {user?.email || "N/A"}
          </span>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const driver = row.original;

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
                onClick={() => router.push(`/dashboard/drivers/${driver.id}`)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              {(user?.role === "SUPER_ADMIN" || user?.role === "DEPOT_MANAGER") && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDeleteDriver(driver.id)}
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

  const canCreateDriver = user?.role === "SUPER_ADMIN" || user?.role === "DEPOT_MANAGER";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Drivers</h2>
          <p className="text-muted-foreground">
            Manage driver profiles and their compliance records
          </p>
        </div>
        {canCreateDriver && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Driver
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create New Driver</DialogTitle>
                <DialogDescription>
                  Add a new driver profile to the system
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateDriver}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="driver@railway.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) =>
                          setFormData({ ...formData, password: e.target.value })
                        }
                        placeholder="Min 8 characters"
                        required
                        minLength={8}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="pfNumber">PF Number</Label>
                      <Input
                        id="pfNumber"
                        value={formData.pfNumber}
                        onChange={(e) =>
                          setFormData({ ...formData, pfNumber: e.target.value })
                        }
                        placeholder="e.g., 15629802390"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="driverName">Driver Name</Label>
                      <Input
                        id="driverName"
                        value={formData.driverName}
                        onChange={(e) =>
                          setFormData({ ...formData, driverName: e.target.value })
                        }
                        placeholder="Full name"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="designation">Designation</Label>
                    <Input
                      id="designation"
                      value={formData.designation}
                      onChange={(e) =>
                        setFormData({ ...formData, designation: e.target.value })
                      }
                      placeholder="e.g., TWD / PTJ (Tech-I / OHE / PTJ)"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="basicPay">Basic Pay</Label>
                      <Input
                        id="basicPay"
                        type="number"
                        value={formData.basicPay}
                        onChange={(e) =>
                          setFormData({ ...formData, basicPay: e.target.value })
                        }
                        placeholder="e.g., 32900"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="depotId">Depot</Label>
                      <Select
                        value={formData.depotId}
                        onValueChange={(value) =>
                          setFormData({ ...formData, depotId: value })
                        }
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select depot" />
                        </SelectTrigger>
                        <SelectContent>
                          {depots.map((depot) => (
                            <SelectItem key={depot.id} value={depot.id}>
                              {depot.name} ({depot.code})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dateOfAppointment">Date of Appointment</Label>
                      <Input
                        id="dateOfAppointment"
                        type="date"
                        value={formData.dateOfAppointment}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dateOfAppointment: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateOfEntry">Date of Entry</Label>
                      <Input
                        id="dateOfEntry"
                        type="date"
                        value={formData.dateOfEntry}
                        onChange={(e) =>
                          setFormData({ ...formData, dateOfEntry: e.target.value })
                        }
                        required
                      />
                    </div>
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
                  <Button type="submit" loading={submitting}>
                    Create Driver
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={drivers}
        searchKey="driverName"
        searchPlaceholder="Search by name..."
        loading={loading}
      />
    </div>
  );
}

