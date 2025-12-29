"use client";

import { useEffect, useState } from "react";
import { auth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toaster";
import { User, Building2, Calendar, Mail } from "lucide-react";

interface UserProfile {
  id: string;
  email: string;
  role: string;
  depotId: string | null;
  isActive: boolean;
  createdAt: string;
  depot: {
    id: string;
    name: string;
    code: string;
  } | null;
  driverProfile: {
    id: string;
    pfNumber: string;
    driverName: string;
    designation: string;
    basicPay: number;
    dateOfAppointment: string;
    dateOfEntry: string;
  } | null;
}

export default function ProfilePage() {
  const { toast } = useToast();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const response = await api.get("/users/me");
      setProfile(response.data);
    } catch (error) {
      console.error("Failed to load profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
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

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-lg text-muted-foreground">Failed to load profile</p>
      </div>
    );
  }

  const roleLabels: Record<string, string> = {
    SUPER_ADMIN: "Super Administrator",
    DEPOT_MANAGER: "Depot Manager",
    DRIVER: "Driver",
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">My Profile</h2>
        <p className="text-muted-foreground">Your account information</p>
      </div>

      {/* User Info Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-2xl font-bold text-primary">
                {profile.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <CardTitle>{profile.driverProfile?.driverName || profile.email}</CardTitle>
              <div className="mt-1">
                <Badge variant="secondary">
                  {roleLabels[profile.role] || profile.role}
                </Badge>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{profile.email}</p>
              </div>
            </div>
            {profile.depot && (
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Depot</p>
                  <p className="font-medium">
                    {profile.depot.name} ({profile.depot.code})
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Account Created</p>
                <p className="font-medium">
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Driver Profile Card (if applicable) */}
      {profile.driverProfile && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Driver Information</CardTitle>
            <CardDescription>Your driver profile details</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">PF Number</p>
                <p className="font-mono font-medium">{profile.driverProfile.pfNumber}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{profile.driverProfile.driverName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Designation</p>
                <p className="font-medium">{profile.driverProfile.designation}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Basic Pay</p>
                <p className="font-medium">
                  ₹{profile.driverProfile.basicPay.toLocaleString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date of Appointment</p>
                <p className="font-medium">
                  {new Date(profile.driverProfile.dateOfAppointment).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Date of Entry</p>
                <p className="font-medium">
                  {new Date(profile.driverProfile.dateOfEntry).toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

