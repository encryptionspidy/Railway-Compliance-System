'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { api } from '@/lib/api';
import { auth } from '@/lib/auth';
import { useRouter } from 'next/navigation';

interface SystemSetting {
  id: string;
  key: string;
  value: string;
  description?: string;
  updatedAt: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const user = auth.getCurrentUser();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    if (user?.role !== 'SUPER_ADMIN') {
      router.push('/dashboard');
      return;
    }
    loadSettings();
  }, [user, router]);

  const loadSettings = async () => {
    try {
      const response = await api.get('/system-settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to load settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (setting: SystemSetting) => {
    setEditing(setting.key);
    setEditValue(setting.value);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditValue('');
  };

  const saveSetting = async (key: string) => {
    try {
      await api.patch(`/system-settings/${key}`, { value: editValue });
      await loadSettings();
      setEditing(null);
      setEditValue('');
    } catch (error) {
      console.error('Failed to update setting:', error);
      alert('Failed to update setting. Please try again.');
    }
  };

  if (user?.role !== 'SUPER_ADMIN') {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground mb-1">
            System Settings
          </h1>
          <p className="text-sm text-muted-foreground">
            Configure system-wide parameters
          </p>
        </div>

        {loading ? (
          <div className="glass rounded-lg p-8 text-center text-muted-foreground">
            Loading...
          </div>
        ) : (
          <div className="space-y-4">
            {settings.map((setting) => (
              <div
                key={setting.id}
                className="glass rounded-lg p-6 border border-slate-700/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-foreground mb-1">
                      {setting.key}
                    </h3>
                    {setting.description && (
                      <p className="text-xs text-muted-foreground mb-3">
                        {setting.description}
                      </p>
                    )}
                    {editing === setting.key ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-lg bg-background/50 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                        <button
                          onClick={() => saveSetting(setting.key)}
                          className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors text-sm font-medium"
                        >
                          Save
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-4 py-2 rounded-lg glass border border-slate-700/50 hover:bg-accent/50 transition-colors text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono text-foreground bg-accent/20 px-2 py-1 rounded">
                          {setting.value}
                        </span>
                        <button
                          onClick={() => startEdit(setting)}
                          className="px-3 py-1 rounded-lg glass border border-slate-700/50 hover:bg-accent/50 transition-colors text-xs"
                        >
                          Edit
                        </button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Last updated:{' '}
                      {new Date(setting.updatedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
