"use client";

import { useEffect, useState } from "react";
import { auth, User } from "@/lib/auth";
import { api } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/toaster";
import { Settings, Save, RotateCcw } from "lucide-react";

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description: string | null;
  updatedBy: string | null;
  updatedAt: string;
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editedValues, setEditedValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    const currentUser = auth.getCurrentUser();
    setUser(currentUser);
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await api.get("/system-settings");
      setSettings(response.data);
      // Initialize edited values
      const values: Record<string, string> = {};
      response.data.forEach((s: SystemSetting) => {
        values[s.key] = s.value;
      });
      setEditedValues(values);
    } catch (error) {
      console.error("Failed to load settings:", error);
      toast({
        title: "Error",
        description: "Failed to load system settings",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string) => {
    setSaving(key);

    try {
      await api.patch(`/system-settings/${key}`, {
        value: editedValues[key],
      });
      toast({
        title: "Success",
        description: `Setting "${key}" updated`,
        variant: "success",
      });
      loadSettings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to update setting",
        variant: "destructive",
      });
    } finally {
      setSaving(null);
    }
  };

  const handleReset = (key: string, originalValue: string) => {
    setEditedValues((prev) => ({
      ...prev,
      [key]: originalValue,
    }));
  };

  const hasChanges = (key: string) => {
    const setting = settings.find((s) => s.key === key);
    return setting ? editedValues[key] !== setting.value : false;
  };

  if (user?.role !== "SUPER_ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-lg text-muted-foreground">Access denied</p>
        <p className="text-sm text-muted-foreground">
          Only Super Admins can manage system settings
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">System Settings</h2>
        <p className="text-muted-foreground">
          Configure system-wide settings and thresholds
        </p>
      </div>

      {/* Settings Cards */}
      <div className="grid gap-4">
        {settings.map((setting) => (
          <Card key={setting.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base font-mono">{setting.key}</CardTitle>
                  {setting.description && (
                    <CardDescription className="mt-1">
                      {setting.description}
                    </CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {hasChanges(setting.key) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleReset(setting.key, setting.value)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant={hasChanges(setting.key) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleSave(setting.key)}
                    disabled={!hasChanges(setting.key) || saving === setting.key}
                  >
                    {saving === setting.key ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    ) : (
                      <Save className="h-4 w-4 mr-2" />
                    )}
                    Save
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Label htmlFor={setting.key}>Value</Label>
                <Input
                  id={setting.key}
                  value={editedValues[setting.key] || ""}
                  onChange={(e) =>
                    setEditedValues((prev) => ({
                      ...prev,
                      [setting.key]: e.target.value,
                    }))
                  }
                  className="max-w-md"
                />
                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(setting.updatedAt).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Info Card */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Settings className="w-5 h-5 text-primary mt-0.5" />
            <div>
              <p className="font-medium">About System Settings</p>
              <p className="text-sm text-muted-foreground mt-1">
                These settings control system behavior such as notification thresholds and
                timezone configuration. Changes take effect immediately for new operations.
                All changes are logged in the audit trail.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

