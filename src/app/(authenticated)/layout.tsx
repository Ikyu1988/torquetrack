// src/app/(authenticated)/layout.tsx
"use client"; 

import React, { useState, useEffect, useCallback } from "react";
import { AppHeader } from "../../components/layout/AppHeader";
import { SidebarNav } from "../../components/navigation/SidebarNav";
import { cn } from "../../lib/utils";
import { useAuth } from "../../contexts/AuthContext";
import { useRouter } from "next/navigation";
import { Skeleton } from "../../components/ui/skeleton"; // For loading state

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    setIsMounted(true);
    const storedSidebarState = localStorage.getItem("sidebarCollapsed");
    if (storedSidebarState) {
      setIsSidebarCollapsed(JSON.parse(storedSidebarState));
    }
  }, []);

  useEffect(() => {
    if (isMounted && !loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router, isMounted]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarCollapsed(prev => {
      const newState = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem("sidebarCollapsed", JSON.stringify(newState));
      }
      return newState;
    });
  }, [setIsSidebarCollapsed]); // setIsSidebarCollapsed is stable

  if (!isMounted || loading || !user) {
    // Show a full-page loading skeleton or spinner
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full bg-muted" />
          <Skeleton className="h-4 w-[200px] bg-muted" />
          <Skeleton className="h-4 w-[150px] bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full bg-muted/40">
      <aside className={cn(
        "hidden md:flex fixed h-full z-40 transition-all duration-300 ease-in-out print:hidden",
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
