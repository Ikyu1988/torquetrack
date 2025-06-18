
"use client";

import Link from "next/link";
import { Wrench } from "lucide-react"; 
import { useEffect, useState, useRef } from "react";
import type { ShopSettings } from "@/types";

export function AppLogo({ collapsed } : { collapsed?: boolean }) {
  const [shopName, setShopName] = useState("TorqueTrack");
  const [isMounted, setIsMounted] = useState(false);
  const shopNameRef = useRef(shopName); // To compare against in interval

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && typeof window !== 'undefined' && (window as any).__settingsStore) {
      const updateShopNameDisplay = () => {
        const currentSettings: ShopSettings | undefined = (window as any).__settingsStore.getSettings();
        const newName = currentSettings?.shopName || "TorqueTrack";
        if (shopNameRef.current !== newName) {
          setShopName(newName);
          shopNameRef.current = newName;
        }
      };
      
      updateShopNameDisplay(); // Initial load

      const intervalId = setInterval(updateShopNameDisplay, 2000); // Periodically check every 2 seconds
      return () => clearInterval(intervalId); // Cleanup interval on unmount
    }
  }, [isMounted]);

  return (
    <Link href="/" className="flex items-center gap-2 text-primary hover:opacity-80 transition-opacity duration-200">
      <Wrench className={`h-8 w-8 ${collapsed ? 'h-7 w-7' : 'h-8 w-8'} text-primary`} />
      {!collapsed && <span className="font-headline text-2xl font-bold text-primary truncate max-w-[160px]">{shopName}</span>}
    </Link>
  );
}
