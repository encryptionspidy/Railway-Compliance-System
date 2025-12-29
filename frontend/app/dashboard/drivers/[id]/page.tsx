"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { auth, User } from "@/lib/auth";
import { api } from "@/lib/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/toaster";
import {
  ArrowLeft,
  Plus,
  Calendar,
  User as UserIcon,
  FileCheck,
  Route,
  History,
  AlertTriangle,
  Edit,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { isBefore, addDays, addMonths } from "date-fns";

interface DriverProfile {
  id: string;
  pfNumber: string;
  driverName: string;
  designation: string;
  basicPay: number;
  dateOfAppointment: string;
  dateOfEntry: string;
  depotId: string;
  user: { id: string; email: string; role: string };
  depot: { id: string; name: string; code: string };
}

interface Compliance {
  id: string;
  driverProfileId: string;
  complianceTypeId: string;
  doneDate: string;
  dueDate: string;
  frequencyMonths: number;
  notes: string | null;
  complianceType: { id: string; name: string; defaultFrequencyMonths: number };
}

interface RouteAuth {
  id: string;
  driverProfileId: string;
  routeSectionId: string;
  authorizedDate: string;
  expiryDate: string;
  routeSection: { id: string; code: string; name: string; description: string | null };
}

interface ComplianceType {
  id: string;
  name: string;
  defaultFrequencyMonths: number;
}

interface RouteSection {
  id: string;
  code: string;
  name: string;
}

interface AuditLog {
  id: string;
  userId: string;
  entityType: string;
  entityId: string;
  action: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  createdAt: string;
}

export default function DriverDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const driverId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [compliances, setCompliances] = useState<Compliance[]>([]);
  const [routeAuths, setRouteAuths] = useState<RouteAuth[]>([]);
  const [complianceTypes, setComplianceTypes] = useState<ComplianceType[]>([]);
  const [routeSections, setRouteSections] = useState<RouteSection[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const [addComplianceOpen, setAddComplianceOpen] = useState(false);
  const [addRouteAuthOpen, setAddRouteAuthOpen] = useState(false);
  const [editComplianceOpen, setEditComplianceOpen] = useState(false);
  const [selectedCompliance, setSelectedCompliance] = useState<Compliance | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [complianceForm, setComplianceForm] = useState({
    complianceTypeId: "",
    doneDate: "",
    dueDate: "",
    frequencyMonths: "",
    notes: "",
  });

  const [routeAuthForm, setRouteAuthForm] = useState({
    routeSectionId: "",
    authorizedDate: "",
    expiryDate: "",
  });

  const [overrideForm, setOverrideForm] = useState({
    doneDate: "",
    dueDate: "",
    frequencyMonths: "",
    overrideReason: "",
    overrideJustification: "",
  });

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    setUser(currentUser);
    loadData();
  }, [driverId]);

  const loadData = async () => {
    try {
      const [driverRes, compliancesRes, routeAuthsRes, typesRes, sectionsRes] = await Promise.all([
        api.get(`/driver-profiles/${driverId}`),
        api.get(`/driver-compliance?driverProfileId=${driverId}`),
        api.get(`/route-auth?driverProfileId=${driverId}`),
        api.get("/driver-compliance/types"),
        api.get("/route-auth/sections"),
      ]);

      setDriver(driverRes.data);
      setCompliances(compliancesRes.data);
      setRouteAuths(routeAuthsRes.data);
      setComplianceTypes(typesRes.data);
      setRouteSections(sectionsRes.data);

      const currentUser = auth.getCurrentUser();
      if (currentUser?.role === "SUPER_ADMIN") {
        try {
          const auditRes = await api.get(`/audit?entityId=${driverId}`);
          setAuditLogs(auditRes.data);
        } catch {
          // Audit logs might fail
        }
      }
    } catch (error) {
      console.error("Failed to load driver data:", error);
      toast({ title: "Error", description: "Failed to load driver details", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAddCompliance = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/driver-compliance", {
        driverProfileId: driverId,
        complianceTypeId: complianceForm.complianceTypeId,
        doneDate: complianceForm.doneDate,
        dueDate: complianceForm.dueDate,
        frequencyMonths: parseInt(complianceForm.frequencyMonths, 10),
        notes: complianceForm.notes || null,
      });
      toast({ title: "Success", description: "Compliance record added", variant: "success" });
      setAddComplianceOpen(false);
      setComplianceForm({ complianceTypeId: "", doneDate: "", dueDate: "", frequencyMonths: "", notes: "" });
      loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({ title: "Error", description: err.response?.data?.message || "Failed to add compliance", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddRouteAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/route-auth", {
        driverProfileId: driverId,
        routeSectionId: routeAuthForm.routeSectionId,
        authorizedDate: routeAuthForm.authorizedDate,
        expiryDate: routeAuthForm.expiryDate,
      });
      toast({ title: "Success", description: "Route authorization added", variant: "success" });
      setAddRouteAuthOpen(false);
      setRouteAuthForm({ routeSectionId: "", authorizedDate: "", expiryDate: "" });
      loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({ title: "Error", description: err.response?.data?.message || "Failed to add route", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleOverrideCompliance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCompliance) return;
    setSubmitting(true);
    try {
      await api.patch(`/driver-compliance/${selectedCompliance.id}`, {
        doneDate: overrideForm.doneDate || undefined,
        dueDate: overrideForm.dueDate || undefined,
        frequencyMonths: overrideForm.frequencyMonths ? parseInt(overrideForm.frequencyMonths, 10) : undefined,
        overrideReason: overrideForm.overrideReason,
        overrideJustification: overrideForm.overrideJustification,
      });
      toast({ title: "Success", description: "Compliance record updated", variant: "success" });
      setEditComplianceOpen(false);
      setSelectedCompliance(null);
      setOverrideForm({ doneDate: "", dueDate: "", frequencyMonths: "", overrideReason: "", overrideJustification: "" });
      loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({ title: "Error", description: err.response?.data?.message || "Failed to update compliance", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkComplianceDone = async (compliance: Compliance) => {
    const doneDate = new Date().toISOString().split("T")[0];
    const dueDate = addMonths(new Date(), compliance.frequencyMonths).toISOString().split("T")[0];
    try {
      await api.patch(`/driver-compliance/${compliance.id}`, { doneDate, dueDate });
      toast({ title: "Success", description: "Compliance marked as done", variant: "success" });
      loadData();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast({ title: "Error", description: err.response?.data?.message || "Failed to update compliance", variant: "destructive" });
    }
  };

  const openOverrideDialog = (compliance: Compliance) => {
    setSelectedCompliance(compliance);
    setOverrideForm({
      doneDate: compliance.doneDate.split("T")[0],
      dueDate: compliance.dueDate.split("T")[0],
      frequencyMonths: compliance.frequencyMonths.toString(),
      overrideReason: "",
      overrideJustification: "",
    });
    setEditComplianceOpen(true);
  };

  const handleComplianceTypeChange = (typeId: string) => {
    const type = complianceTypes.find((t) => t.id === typeId);
    setComplianceForm({
      ...complianceForm,
      complianceTypeId: typeId,
      frequencyMonths: type?.defaultFrequencyMonths.toString() || "",
    });
  };

  const handleDoneDateChange = (date: string) => {
    const frequencyMonths = parseInt(complianceForm.frequencyMonths, 10);
    if (date && frequencyMonths) {
      const dueDate = addMonths(new Date(date), frequencyMonths).toISOString().split("T")[0];
      setComplianceForm({ ...complianceForm, doneDate: date, dueDate });
    } else {
      setComplianceForm({ ...complianceForm, doneDate: date });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-lg text-muted-foreground">Driver not found</p>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Go Back</Button>
      </div>
    );
  }

  const now = new Date();
  const warningDate = addDays(now, 7);
  const canEdit = user?.role === "SUPER_ADMIN" || user?.role === "DEPOT_MANAGER";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">{driver.driverName}</h2>
          <p className="text-muted-foreground">PF: {driver.pfNumber}</p>
        </div>
        <Badge variant="secondary">{driver.depot.code}</Badge>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile" className="gap-2"><UserIcon className="h-4 w-4" />Profile</TabsTrigger>
          <TabsTrigger value="compliance" className="gap-2"><FileCheck className="h-4 w-4" />Compliance</TabsTrigger>
          <TabsTrigger value="routes" className="gap-2"><Route className="h-4 w-4" />Routes</TabsTrigger>
          {isSuperAdmin && <TabsTrigger value="audit" className="gap-2"><History className="h-4 w-4" />Audit</TabsTrigger>}
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader><CardTitle>Driver Profile</CardTitle><CardDescription>Personal and service information</CardDescription></CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div><p className="text-sm text-muted-foreground">PF Number</p><p className="font-mono font-medium">{driver.pfNumber}</p></div>
                  <div><p className="text-sm text-muted-foreground">Name</p><p className="font-medium">{driver.driverName}</p></div>
                  <div><p className="text-sm text-muted-foreground">Email</p><p className="font-medium">{driver.user.email}</p></div>
                  <div><p className="text-sm text-muted-foreground">Designation</p><p className="font-medium">{driver.designation}</p></div>
                </div>
                <div className="space-y-4">
                  <div><p className="text-sm text-muted-foreground">Basic Pay</p><p className="font-medium">₹{driver.basicPay.toLocaleString()}</p></div>
                  <div><p className="text-sm text-muted-foreground">Date of Appointment</p><p className="font-medium">{new Date(driver.dateOfAppointment).toLocaleDateString()}</p></div>
                  <div><p className="text-sm text-muted-foreground">Date of Entry</p><p className="font-medium">{new Date(driver.dateOfEntry).toLocaleDateString()}</p></div>
                  <div><p className="text-sm text-muted-foreground">Depot</p><p className="font-medium">{driver.depot.name} ({driver.depot.code})</p></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="compliance">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Compliance Records</CardTitle><CardDescription>Driver compliance status and history</CardDescription></div>
              {canEdit && (
                <Dialog open={addComplianceOpen} onOpenChange={setAddComplianceOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" />Add Compliance</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Compliance Record</DialogTitle><DialogDescription>Create a new compliance record for this driver</DialogDescription></DialogHeader>
                    <form onSubmit={handleAddCompliance}>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="complianceType">Compliance Type</Label>
                          <Select value={complianceForm.complianceTypeId} onValueChange={handleComplianceTypeChange} required>
                            <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                            <SelectContent>{complianceTypes.map((type) => (<SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>))}</SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><Label htmlFor="doneDate">Done Date</Label><Input id="doneDate" type="date" value={complianceForm.doneDate} onChange={(e) => handleDoneDateChange(e.target.value)} required /></div>
                          <div className="space-y-2"><Label htmlFor="frequencyMonths">Schedule (months)</Label><Input id="frequencyMonths" type="number" value={complianceForm.frequencyMonths} onChange={(e) => setComplianceForm({ ...complianceForm, frequencyMonths: e.target.value })} required /></div>
                        </div>
                        <div className="space-y-2"><Label htmlFor="dueDate">Due Date</Label><Input id="dueDate" type="date" value={complianceForm.dueDate} onChange={(e) => setComplianceForm({ ...complianceForm, dueDate: e.target.value })} required /></div>
                        <div className="space-y-2"><Label htmlFor="notes">Notes (optional)</Label><Input id="notes" value={complianceForm.notes} onChange={(e) => setComplianceForm({ ...complianceForm, notes: e.target.value })} /></div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setAddComplianceOpen(false)}>Cancel</Button>
                        <Button type="submit" loading={submitting}>Add Compliance</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {compliances.length === 0 ? (<p className="text-center text-muted-foreground py-8">No compliance records found</p>) : (
                  compliances.map((compliance) => {
                    const dueDate = new Date(compliance.dueDate);
                    const isOverdue = isBefore(dueDate, now);
                    const isDueSoon = !isOverdue && isBefore(dueDate, warningDate);
                    return (
                      <div key={compliance.id} className={cn("p-4 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-4", isOverdue ? "border-destructive/30 bg-destructive/5" : isDueSoon ? "border-warning/30 bg-warning/5" : "border-border")}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{compliance.complianceType.name}</span>
                            <Badge variant={isOverdue ? "destructive" : isDueSoon ? "warning" : "success"}>{isOverdue ? "Overdue" : isDueSoon ? "Due Soon" : "Current"}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                            <span>Done: {new Date(compliance.doneDate).toLocaleDateString()}</span>
                            <span>Due: {dueDate.toLocaleDateString()}</span>
                            <span>Every {compliance.frequencyMonths} months</span>
                          </div>
                        </div>
                        {canEdit && (
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => handleMarkComplianceDone(compliance)}><Calendar className="mr-2 h-4 w-4" />Mark Done</Button>
                            {isSuperAdmin && (<Button variant="outline" size="sm" onClick={() => openOverrideDialog(compliance)}><Edit className="mr-2 h-4 w-4" />Override</Button>)}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
          <Dialog open={editComplianceOpen} onOpenChange={setEditComplianceOpen}>
            <DialogContent>
              <DialogHeader><DialogTitle>Override Compliance Record</DialogTitle><DialogDescription>This action requires justification and will be logged</DialogDescription></DialogHeader>
              <form onSubmit={handleOverrideCompliance}>
                <div className="grid gap-4 py-4">
                  <div className="p-3 rounded-lg bg-warning/10 border border-warning/30">
                    <div className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-warning mt-0.5" /><p className="text-sm text-warning">Override requires justification. This action will be logged.</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2"><Label htmlFor="overrideDoneDate">Done Date</Label><Input id="overrideDoneDate" type="date" value={overrideForm.doneDate} onChange={(e) => setOverrideForm({ ...overrideForm, doneDate: e.target.value })} /></div>
                    <div className="space-y-2"><Label htmlFor="overrideDueDate">Due Date</Label><Input id="overrideDueDate" type="date" value={overrideForm.dueDate} onChange={(e) => setOverrideForm({ ...overrideForm, dueDate: e.target.value })} /></div>
                  </div>
                  <div className="space-y-2"><Label htmlFor="overrideFrequency">Schedule (months)</Label><Input id="overrideFrequency" type="number" value={overrideForm.frequencyMonths} onChange={(e) => setOverrideForm({ ...overrideForm, frequencyMonths: e.target.value })} /></div>
                  <Separator />
                  <div className="space-y-2"><Label htmlFor="overrideReason">Reason *</Label><Input id="overrideReason" value={overrideForm.overrideReason} onChange={(e) => setOverrideForm({ ...overrideForm, overrideReason: e.target.value })} required /></div>
                  <div className="space-y-2"><Label htmlFor="overrideJustification">Justification *</Label><Input id="overrideJustification" value={overrideForm.overrideJustification} onChange={(e) => setOverrideForm({ ...overrideForm, overrideJustification: e.target.value })} required /></div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setEditComplianceOpen(false)}>Cancel</Button>
                  <Button type="submit" loading={submitting}>Apply Override</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="routes">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div><CardTitle>Route Authorizations</CardTitle><CardDescription>Authorized routes and their validity</CardDescription></div>
              {canEdit && (
                <Dialog open={addRouteAuthOpen} onOpenChange={setAddRouteAuthOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="mr-2 h-4 w-4" />Add Route</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add Route Authorization</DialogTitle><DialogDescription>Authorize this driver for a route section</DialogDescription></DialogHeader>
                    <form onSubmit={handleAddRouteAuth}>
                      <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="routeSection">Route Section</Label>
                          <Select value={routeAuthForm.routeSectionId} onValueChange={(value) => setRouteAuthForm({ ...routeAuthForm, routeSectionId: value })} required>
                            <SelectTrigger><SelectValue placeholder="Select route section" /></SelectTrigger>
                            <SelectContent>{routeSections.map((section) => (<SelectItem key={section.id} value={section.id}>{section.name} ({section.code})</SelectItem>))}</SelectContent>
                          </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2"><Label htmlFor="authorizedDate">Authorized Date</Label><Input id="authorizedDate" type="date" value={routeAuthForm.authorizedDate} onChange={(e) => setRouteAuthForm({ ...routeAuthForm, authorizedDate: e.target.value })} required /></div>
                          <div className="space-y-2"><Label htmlFor="expiryDate">Expiry Date</Label><Input id="expiryDate" type="date" value={routeAuthForm.expiryDate} onChange={(e) => setRouteAuthForm({ ...routeAuthForm, expiryDate: e.target.value })} required /></div>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setAddRouteAuthOpen(false)}>Cancel</Button>
                        <Button type="submit" loading={submitting}>Add Authorization</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {routeAuths.length === 0 ? (<p className="text-center text-muted-foreground py-8">No route authorizations found</p>) : (
                  routeAuths.map((auth) => {
                    const expiryDate = new Date(auth.expiryDate);
                    const isExpired = isBefore(expiryDate, now);
                    const isExpiring = !isExpired && isBefore(expiryDate, warningDate);
                    return (
                      <div key={auth.id} className={cn("p-4 rounded-lg border flex flex-col md:flex-row md:items-center justify-between gap-4", isExpired ? "border-destructive/30 bg-destructive/5" : isExpiring ? "border-warning/30 bg-warning/5" : "border-border")}>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{auth.routeSection.name}</span>
                            <Badge variant="secondary">{auth.routeSection.code}</Badge>
                            <Badge variant={isExpired ? "destructive" : isExpiring ? "warning" : "success"}>{isExpired ? "Expired" : isExpiring ? "Expiring" : "Active"}</Badge>
                          </div>
                          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
                            <span>Authorized: {new Date(auth.authorizedDate).toLocaleDateString()}</span>
                            <span>Expires: {expiryDate.toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {isSuperAdmin && (
          <TabsContent value="audit">
            <Card>
              <CardHeader><CardTitle>Audit History</CardTitle><CardDescription>All changes made to this driver&apos;s records</CardDescription></CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {auditLogs.length === 0 ? (<p className="text-center text-muted-foreground py-8">No audit logs found</p>) : (
                    auditLogs.map((log) => (
                      <div key={log.id} className="p-4 rounded-lg border">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant={log.action === "CREATE" ? "success" : log.action === "DELETE" ? "destructive" : "secondary"}>{log.action}</Badge>
                            <span className="text-sm">{log.entityType}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</span>
                        </div>
                        {log.oldValue && typeof log.oldValue === 'object' && 'overrideReason' in log.oldValue && (
                          <div className="mt-2 text-sm">
                            <p className="text-muted-foreground">Reason: {String(log.oldValue.overrideReason)}</p>
                            <p className="text-muted-foreground">Justification: {String((log.oldValue as Record<string, unknown>).overrideJustification)}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}

