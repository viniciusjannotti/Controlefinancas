"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/Sidebar";
import { MobileHeader } from "@/components/MobileHeader";
import { NotificationsDropdown } from "@/components/NotificationsDropdown";

export function ClientLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();

  // Close sidebar when navigating on mobile
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [pathname]);

  return (
    <div className="flex min-h-screen">
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
