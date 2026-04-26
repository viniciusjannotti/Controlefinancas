"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";
import { useAuth } from "@/lib/auth/AuthContext";
import { Wallet } from "lucide-react";
import { PWAIconManager } from "@/components/PWAIconManager";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();

  // Close sidebar when navigating on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  // Public routes that bypass auth
  const isPublicPath = pathname === "/login" || pathname.startsWith("/admin");

  // Redirect unauthenticated users to /login (except on public paths)
  useEffect(() => {
    if (!loading && !user && !isPublicPath) {
      router.replace("/login");
    }
  }, [loading, user, isPublicPath, router]);

  // Render public pages without the app shell
  if (isPublicPath) {
    return <>{children}</>;
  }

  // Full-screen loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-primary/10 to-slate-900 gap-4">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/30 animate-pulse">
          <Wallet className="w-8 h-8 text-white" />
        </div>
        <p className="text-slate-400 text-sm animate-pulse">Verificando sessão...</p>
      </div>
    );
  }

  // If not authenticated and not on /login, return null while redirect happens
  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <PWAIconManager />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader onToggle={() => setIsSidebarOpen(true)} />
        
        <main className="flex-1 lg:ml-64 p-4 lg:p-8 min-h-screen relative overflow-x-hidden">
          <div className="max-w-6xl mx-auto relative">
            <div className="absolute top-0 right-0 z-50 hidden lg:block">
              <NotificationsDropdown />
            </div>
            
            <div className="pt-2">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

