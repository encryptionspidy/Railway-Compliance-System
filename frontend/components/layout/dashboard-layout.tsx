"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { Toaster } from "@/components/ui/toaster";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); if (!auth.isAuthenticated()) router.push("/login"); }, [router]);

  if (!mounted) return (<div className="min-h-screen bg-background flex items-center justify-center"><div className="flex flex-col items-center gap-2"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /><span className="text-sm text-muted-foreground">Loading...</span></div></div>);
  if (!auth.isAuthenticated()) return null;

  return (
    <Toaster>
      <div className="min-h-screen bg-background">
        <div className="flex"><Sidebar /><div className="flex-1 flex flex-col min-w-0"><Header /><main className="flex-1 p-4 md:p-6 pb-20 md:pb-6">{children}</main></div></div>
        <MobileNav />
      </div>
    </Toaster>
  );
}

