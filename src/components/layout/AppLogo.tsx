
"use client";

import Link from "next/link";
import { Wrench } from "lucide-react"; 
import { useEffect, useState, useRef, useCallback } from "react";
import type { ShopSettings } from "@/types";

export function AppLogo({ collapsed } : { collapsed?: boolean }) {
  const [shopName, setShopName] = useState("TorqueTrack");
  const [isMounted, setIsMounted] = useState(false);
  const shopNameRef = useRef(shopName);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const updateShopNameDisplay = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).__settingsStore) {
      const currentSettings: ShopSettings | undefined = (window as any).__settingsStore.getSettings();
      const newName = currentSettings?.shopName || "TorqueTrack";
      if (shopNameRef.current !== newName) {
        setShopName(newName);
        shopNameRef.current = newName;
      }
    }
  }, []); // No dependencies needed for this version as it reads directly

  useEffect(() => {
    if (isMounted) {
      updateShopNameDisplay(); // Initial load

      const intervalId = setInterval(updateShopNameDisplay, 2000); 
      return () => clearInterval(intervalId); 
    }
  }, [isMounted, updateShopNameDisplay]);

  return (
    <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity duration-200">
      <Wrench className={`h-8 w-8 ${collapsed ? 'h-7 w-7' : 'h-8 w-8'} text-primary`} />
      {!collapsed && <span className="font-headline text-2xl font-bold text-primary truncate max-w-[160px]">{shopName}</span>}
    </Link>
  );
}
