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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/toaster";
import { Plus, MoreHorizontal, Eye, Edit, Trash2, Route, MapPin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { isBefore, addDays } from "date-fns";

interface RouteAuth {
  id: string;
  driverProfileId: string;
  routeSectionId: string;
  authorizedDate: string;
  expiryDate: string;
  routeSection: {
    id: string;
    code: string;
    name: string;
    description: string | null;
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

interface RouteSection {
  id: string;
  code: string;
  name: string;
  description: string | null;
  isPredefined: boolean;
  depotId: string | null;
}

interface Depot {
  id: string;
  name: string;
  code: string;
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

export default function RoutesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [routeAuths, setRouteAuths] = useState<RouteAuth[]>([]);
  const [routeSections, setRouteSections] = useState<RouteSection[]>([]);
  const [depots, setDepots] = useState<Depot[]>([]);
  const [driverProfiles, setDriverProfiles] = useState<DriverProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDepot, setSelectedDepot] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");

  // Create section dialog
  const [createSectionOpen, setCreateSectionOpen] = useState(false);
  const [sectionForm, setSectionForm] = useState({
    code: "",
    name: "",
    description: "",
  });

  // Create route auth dialog
  const [createAuthOpen, setCreateAuthOpen] = useState(false);
  const [authForm, setAuthForm] = useState({
    driverProfileId: "",
    routeSectionId: "",
    authorizedDate: "",
    expiryDate: "",
  });

  // Edit route auth dialog
  const [editAuthOpen, setEditAuthOpen] = useState(false);
  const [editingAuth, setEditingAuth] = useState<RouteAuth | null>(null);
  const [editAuthForm, setEditAuthForm] = useState({
    authorizedDate: "",
    expiryDate: "",
  });

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    setUser(currentUser);
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [authsRes, sectionsRes, depotsRes, driversRes] = await Promise.all([
        api.get("/route-auth"),
        api.get("/route-auth/sections"),
        api.get("/depots"),
        api.get("/driver-profiles"),
      ]);
      setRouteAuths(authsRes.data);
      setRouteSections(sectionsRes.data);
      setDepots(depotsRes.data);
      setDriverProfiles(driversRes.data);
    } catch (error) {
      console.error("Failed to load data:", error);
      toast({
        title: "Error",
        description: "Failed to load route data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/route-auth/sections", sectionForm);

      toast({
        title: "Success",
        description: "Route section created",
        variant: "success",
      });

      setCreateSectionOpen(false);
      setSectionForm({ code: "", name: "", description: "" });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create section",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteSection = async (id: string) => {
    if (!confirm("Are you sure you want to delete this route section?")) return;

    try {
      await api.delete(`/route-auth/sections/${id}`);
      toast({
        title: "Success",
        description: "Route section deleted",
        variant: "success",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete section",
        variant: "destructive",
      });
    }
  };

  const handleCreateAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await api.post("/route-auth", {
        driverProfileId: authForm.driverProfileId,
        routeSectionId: authForm.routeSectionId,
        authorizedDate: authForm.authorizedDate,
        expiryDate: authForm.expiryDate,
      });

      toast({
        title: "Success",
        description: "Route authorization created",
        variant: "success",
      });

      setCreateAuthOpen(false);
      setAuthForm({
        driverProfileId: "",
        routeSectionId: "",
        authorizedDate: "",
        expiryDate: "",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to create authorization",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const openEditAuthDialog = (auth: RouteAuth) => {
    setEditingAuth(auth);
    setEditAuthForm({
      authorizedDate: auth.authorizedDate.split("T")[0],
      expiryDate: auth.expiryDate.split("T")[0],
    });
    setEditAuthOpen(true);
  };

  const handleEditAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAuth) return;

    setSubmitting(true);
    try {
      await api.patch(`/route-auth/${editingAuth.id}`, {
        authorizedDate: editAuthForm.authorizedDate,
        expiryDate: editAuthForm.expiryDate,
      });

      toast({
        title: "Success",
        description: "Route authorization updated",
        variant: "success",
      });

      setEditAuthOpen(false);
      setEditingAuth(null);
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update authorization",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAuth = async (id: string) => {
    if (!confirm("Are you sure you want to delete this route authorization?")) return;

    try {
      await api.delete(`/route-auth/${id}`);
      toast({
        title: "Success",
        description: "Route authorization deleted",
        variant: "success",
      });
      loadData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to delete authorization",
        variant: "destructive",
      });
    }
  };

  const now = new Date();
  const warningDate = addDays(now, 7);

  const getStatus = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    if (isBefore(expiry, now)) return "expired";
    if (isBefore(expiry, warningDate)) return "expiring";
    return "active";
  };

  // Base filtered auths (depot filter only, for stats)
  const baseFilteredAuths = routeAuths.filter((auth) => {
    if (selectedDepot !== "all" && auth.driverProfile.depot?.id !== selectedDepot) {
      return false;
    }
    return true;
  });

  // Full filtered auths (includes status filter, for table display)
  const filteredAuths = baseFilteredAuths.filter((auth) => {
    if (selectedStatus !== "all") {
      const status = getStatus(auth.expiryDate);
      if (status !== selectedStatus) return false;
    }
    return true;
  });

  const authColumns: ColumnDef<RouteAuth>[] = [
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
      id: "routeSection",
      accessorFn: (row) => row.routeSection.name,
      header: "Route Section",
      cell: ({ row }) => {
        const section = row.original.routeSection;
        return (
          <div>
            <p className="font-medium">{section.name}</p>
            <p className="text-xs text-muted-foreground">{section.code}</p>
          </div>
        );
      },
    },
    {
      id: "depotCode",
      accessorFn: (row) => row.driverProfile.depot?.code,
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
      accessorKey: "authorizedDate",
      header: "Authorized",
      cell: ({ row }) => (
        <span className="text-sm">
          {new Date(row.getValue("authorizedDate")).toLocaleDateString()}
        </span>
      ),
    },
    {
      accessorKey: "expiryDate",
      header: "Expiry",
      cell: ({ row }) => {
        const expiryDate = row.getValue("expiryDate") as string;
        const status = getStatus(expiryDate);
        return (
          <span
            className={cn(
              "text-sm",
              status === "expired" && "text-destructive font-medium",
              status === "expiring" && "text-warning font-medium"
            )}
          >
            {new Date(expiryDate).toLocaleDateString()}
          </span>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = getStatus(row.original.expiryDate);
        return (
          <Badge
            variant={
              status === "expired"
                ? "destructive"
                : status === "expiring"
                ? "warning"
                : "success"
            }
          >
            {status === "expired"
              ? "Expired"
              : status === "expiring"
              ? "Expiring"
              : "Active"}
          </Badge>
        );
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const auth = row.original;
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
                  router.push(`/dashboard/drivers/${auth.driverProfileId}`)
                }
              >
                <Eye className="mr-2 h-4 w-4" />
                View Driver
              </DropdownMenuItem>
              {canEdit && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => openEditAuthDialog(auth)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Authorization
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDeleteAuth(auth.id)}
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

  const sectionColumns: ColumnDef<RouteSection>[] = [
    {
      accessorKey: "code",
      header: "Code",
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.getValue("code")}</span>
      ),
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <span className="font-medium">{row.getValue("name")}</span>
      ),
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {row.getValue("description") || "-"}
        </span>
      ),
    },
    {
      accessorKey: "isPredefined",
      header: "Type",
      cell: ({ row }) => (
        <Badge variant={row.getValue("isPredefined") ? "default" : "secondary"}>
          {row.getValue("isPredefined") ? "Predefined" : "Custom"}
        </Badge>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const section = row.original;
        const canDelete =
          !section.isPredefined &&
          (user?.role === "SUPER_ADMIN" || user?.role === "DEPOT_MANAGER");

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
              {canDelete && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => handleDeleteSection(section.id)}
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

  // Summary stats (based on depot filter only, not status filter)
  const expiredCount = baseFilteredAuths.filter(
    (a) => getStatus(a.expiryDate) === "expired"
  ).length;
  const expiringCount = baseFilteredAuths.filter(
    (a) => getStatus(a.expiryDate) === "expiring"
  ).length;
  const activeCount = baseFilteredAuths.filter(
    (a) => getStatus(a.expiryDate) === "active"
  ).length;

  const canCreateSection = user?.role === "SUPER_ADMIN" || user?.role === "DEPOT_MANAGER";
  const canCreateAuth = user?.role === "SUPER_ADMIN" || user?.role === "DEPOT_MANAGER";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Route Authorization</h2>
          <p className="text-muted-foreground">
            Manage route sections and driver authorizations
          </p>
        </div>
        {canCreateAuth && (
          <Button onClick={() => setCreateAuthOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Authorization
          </Button>
        )}
      </div>

      <Tabs defaultValue="authorizations" className="space-y-6">
        <TabsList>
          <TabsTrigger value="authorizations" className="gap-2">
            <Route className="h-4 w-4" />
            Authorizations
          </TabsTrigger>
          <TabsTrigger value="sections" className="gap-2">
            <MapPin className="h-4 w-4" />
            Route Sections
          </TabsTrigger>
        </TabsList>

        <TabsContent value="authorizations">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card
              className={cn(
                "cursor-pointer transition-base",
                selectedStatus === "expired" && "border-destructive"
              )}
              onClick={() =>
                setSelectedStatus(selectedStatus === "expired" ? "all" : "expired")
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Expired</p>
                    <p className="text-2xl font-bold text-destructive">{expiredCount}</p>
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
                selectedStatus === "expiring" && "border-warning"
              )}
              onClick={() =>
                setSelectedStatus(selectedStatus === "expiring" ? "all" : "expiring")
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Expiring</p>
                    <p className="text-2xl font-bold text-warning">{expiringCount}</p>
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
                selectedStatus === "active" && "border-success"
              )}
              onClick={() =>
                setSelectedStatus(selectedStatus === "active" ? "all" : "active")
              }
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active</p>
                    <p className="text-2xl font-bold text-success">{activeCount}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-success/10">
                    <div className="w-3 h-3 rounded-full bg-success" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
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
            {selectedStatus !== "all" && (
              <Button variant="outline" onClick={() => setSelectedStatus("all")}>
                Clear Status Filter
              </Button>
            )}
          </div>

          <DataTable
            columns={authColumns}
            data={filteredAuths}
            searchKey="driverName"
            searchPlaceholder="Search by driver name..."
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="sections">
          {/* Create Section */}
          <div className="flex justify-end mb-6">
            {canCreateSection && (
              <Dialog open={createSectionOpen} onOpenChange={setCreateSectionOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Route Section
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Route Section</DialogTitle>
                    <DialogDescription>
                      Add a new route section to the system
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleCreateSection}>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="code">Code</Label>
                          <Input
                            id="code"
                            value={sectionForm.code}
                            onChange={(e) =>
                              setSectionForm({ ...sectionForm, code: e.target.value })
                            }
                            placeholder="e.g., CBE-ED"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name">Name</Label>
                          <Input
                            id="name"
                            value={sectionForm.name}
                            onChange={(e) =>
                              setSectionForm({ ...sectionForm, name: e.target.value })
                            }
                            placeholder="e.g., Coimbatore to Erode"
                            required
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="description">Description (optional)</Label>
                        <Input
                          id="description"
                          value={sectionForm.description}
                          onChange={(e) =>
                            setSectionForm({
                              ...sectionForm,
                              description: e.target.value,
                            })
                          }
                          placeholder="Additional details..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setCreateSectionOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" loading={submitting}>
                        Create Section
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>

          <DataTable
            columns={sectionColumns}
            data={routeSections}
            searchKey="name"
            searchPlaceholder="Search by name..."
            loading={loading}
          />
        </TabsContent>
      </Tabs>

      {/* Create Authorization Dialog */}
      <Dialog open={createAuthOpen} onOpenChange={setCreateAuthOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Route Authorization</DialogTitle>
            <DialogDescription>
              Authorize a driver for a route section
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateAuth}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="driverProfileId">Driver</Label>
                <Select
                  value={authForm.driverProfileId}
                  onValueChange={(value) =>
                    setAuthForm({ ...authForm, driverProfileId: value })
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
                <Label htmlFor="routeSectionId">Route Section</Label>
                <Select
                  value={authForm.routeSectionId}
                  onValueChange={(value) =>
                    setAuthForm({ ...authForm, routeSectionId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select route section" />
                  </SelectTrigger>
                  <SelectContent>
                    {routeSections.map((section) => (
                      <SelectItem key={section.id} value={section.id}>
                        {section.code} - {section.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="authorizedDate">Authorized Date</Label>
                  <Input
                    id="authorizedDate"
                    type="date"
                    value={authForm.authorizedDate}
                    onChange={(e) =>
                      setAuthForm({ ...authForm, authorizedDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={authForm.expiryDate}
                    onChange={(e) =>
                      setAuthForm({ ...authForm, expiryDate: e.target.value })
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
                onClick={() => setCreateAuthOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={
                  submitting ||
                  !authForm.driverProfileId ||
                  !authForm.routeSectionId ||
                  !authForm.authorizedDate ||
                  !authForm.expiryDate
                }
              >
                {submitting ? "Creating..." : "Create Authorization"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Authorization Dialog */}
      <Dialog open={editAuthOpen} onOpenChange={setEditAuthOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Route Authorization</DialogTitle>
            <DialogDescription>
              Update authorization for {editingAuth?.driverProfile.driverName} - {editingAuth?.routeSection.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditAuth}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="editAuthorizedDate">Authorized Date</Label>
                  <Input
                    id="editAuthorizedDate"
                    type="date"
                    value={editAuthForm.authorizedDate}
                    onChange={(e) =>
                      setEditAuthForm({ ...editAuthForm, authorizedDate: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="editExpiryDate">Expiry Date</Label>
                  <Input
                    id="editExpiryDate"
                    type="date"
                    value={editAuthForm.expiryDate}
                    onChange={(e) =>
                      setEditAuthForm({ ...editAuthForm, expiryDate: e.target.value })
                    }
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditAuthOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

