"use client"; // Required for state and effects

import React, { useState, useEffect } from "react";
import { AppHeader } from "@/components/layout/AppHeader";
import { SidebarNav } from "@/components/navigation/SidebarNav";
import { cn } from "@/lib/utils";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    const storedSidebarState = localStorage.getItem("sidebarCollapsed");
    if (storedSidebarState) {
      setIsSidebarCollapsed(JSON.parse(storedSidebarState));
    }
  }, []);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => {
      const newState = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem("sidebarCollapsed", JSON.stringify(newState));
      }
      return newState;
    });
  };

  if (!isMounted) {
    // To prevent hydration mismatch, render null or a loading skeleton until client-side mount
    return null; 
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <aside className={cn(
        "hidden md:flex fixed h-full z-40 transition-all duration-300 ease-in-out",
        isSidebarCollapsed ? "w-20" : "w-64"
      )}>
        <SidebarNav collapsed={isSidebarCollapsed} />
      </aside>
      <div 
        className={cn(
          "flex flex-1 flex-col transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
        )}
      >
        <AppHeader toggleSidebar={toggleSidebar} isSidebarCollapsed={isSidebarCollapsed} />
        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
