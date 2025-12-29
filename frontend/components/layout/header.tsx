"use client";
import { useState, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { auth } from "@/lib/auth";
import { api } from "@/lib/api";
import { Bell, LogOut, User, ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Notification { id: string; title: string; message: string; isRead: boolean; createdAt: string; relatedEntityType?: string; relatedEntityId?: string; }

function getPageTitle(pathname: string): string {
  const routes: Record<string, string> = { "/dashboard": "Dashboard", "/dashboard/drivers": "Driver Management", "/dashboard/compliance": "Compliance Management", "/dashboard/routes": "Route Authorization", "/dashboard/depots": "Depot Management", "/dashboard/admins": "Admin Management", "/dashboard/notifications": "Notifications", "/dashboard/settings": "System Settings", "/dashboard/audit": "Audit Log" };
  if (pathname.startsWith("/dashboard/drivers/")) return "Driver Details";
  return routes[pathname] || "Dashboard";
}

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const user = auth.getCurrentUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) { loadNotifications(); const interval = setInterval(loadNotifications, 30000); return () => clearInterval(interval); }
  }, [user]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) { if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) setShowNotifications(false); }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadNotifications = async () => { try { const response = await api.get("/notifications?isRead=false"); setNotifications(response.data.slice(0, 10)); setUnreadCount(response.data.length); } catch { /* Silent fail */ } };
  const markAsRead = async (notification: Notification) => { try { await api.patch(`/notifications/${notification.id}/read`); setNotifications((prev) => prev.filter((n) => n.id !== notification.id)); setUnreadCount((prev) => Math.max(0, prev - 1)); } catch { /* Silent fail */ } };
  const handleLogout = () => { auth.logout(); router.push("/login"); };

  if (!user) return null;
  const pageTitle = getPageTitle(pathname);

  return (
    <header className="glass border-b sticky top-0 z-40 h-16">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4"><h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1></div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={notificationRef}>
            <Button variant="ghost" size="icon" onClick={() => setShowNotifications(!showNotifications)} className="relative" aria-label="Notifications">
              <Bell className="w-5 h-5" />{unreadCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full animate-pulse" />}
            </Button>
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 glass-elevated rounded-lg border shadow-lg z-50 max-h-96 overflow-hidden animate-slide-in-top">
                <div className="p-3 border-b flex items-center justify-between"><h3 className="text-sm font-semibold">Notifications</h3>{unreadCount > 0 && <Badge variant="secondary">{unreadCount} new</Badge>}</div>
                <div className="overflow-y-auto max-h-72">
                  {notifications.length === 0 ? <div className="p-6 text-sm text-muted-foreground text-center">No new notifications</div> : (
                    <div className="divide-y divide-border">{notifications.map((notification) => (
                      <button key={notification.id} onClick={() => markAsRead(notification)} className="w-full p-3 text-left hover:bg-accent/50 transition-colors">
                        <p className="text-sm font-medium text-foreground line-clamp-1">{notification.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{notification.message}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">{new Date(notification.createdAt).toLocaleString()}</p>
                      </button>
                    ))}</div>
                  )}
                </div>
                {notifications.length > 0 && <div className="p-2 border-t"><Button variant="ghost" size="sm" className="w-full" onClick={() => { router.push("/dashboard/notifications"); setShowNotifications(false); }}>View all notifications</Button></div>}
              </div>
            )}
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 px-2"><Avatar className="w-8 h-8"><AvatarFallback className="bg-primary/20 text-primary text-sm">{user.email.charAt(0).toUpperCase()}</AvatarFallback></Avatar><span className="hidden md:inline text-sm font-medium">{user.email.split("@")[0]}</span><ChevronDown className="w-4 h-4 text-muted-foreground" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel><div className="flex flex-col space-y-1"><p className="text-sm font-medium">{user.email}</p><p className="text-xs text-muted-foreground">{user.role.replace("_", " ")}</p></div></DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push("/dashboard/profile")}><User className="mr-2 h-4 w-4" />Profile</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive"><LogOut className="mr-2 h-4 w-4" />Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}

