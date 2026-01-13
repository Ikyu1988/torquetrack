
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Wrench,
  Users,
  Bike,
  Package,
  ClipboardList,
  FileText,
  Settings,
  UserCog,
  ShoppingCart,
  Truck, // For Suppliers
  FilePlus, // For Purchase Requisitions
  Receipt, // For Purchase Orders
  ArchiveRestore // For Goods Receipts
} from "lucide-react";
import { cn } from "../../lib/utils";
import { ScrollArea } from "../../components/ui/scroll-area";
import { AppLogo } from "../../components/layout/AppLogo";
import { Separator } from "../../components/ui/separator";

// TODO: This should be dynamically generated based on user role and module settings
const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/job-orders", label: "Job Orders", icon: ClipboardList },
  { href: "/dashboard/direct-sales", label: "Direct Sales", icon: ShoppingCart },
  { type: "separator" as const },
  { href: "/dashboard/customers", label: "Customers", icon: Users },
  { href: "/dashboard/motorcycles", label: "Motorcycles", icon: Bike },
  { type: "separator" as const },
  { href: "/dashboard/inventory", label: "Inventory", icon: Package },
  { href: "/dashboard/services", label: "Services", icon: Wrench },
  { href: "/dashboard/mechanics", label: "Mechanics", icon: UserCog },
  { type: "separator" as const },
  { href: "/dashboard/suppliers", label: "Suppliers", icon: Truck },
  { href: "/dashboard/purchase-requisitions", label: "Purchase Reqs", icon: FilePlus },
  { href: "/dashboard/purchase-orders", label: "Purchase Orders", icon: Receipt },
  { href: "/dashboard/goods-receipts", label: "Goods Receipts", icon: ArchiveRestore },
  { type: "separator" as const },
  { href: "/dashboard/reports", label: "Reports", icon: FileText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function SidebarNav({ collapsed }: { collapsed?: boolean }) {
  const pathname = usePathname();

  return (
    <div className={cn("flex h-full flex-col border-r bg-card text-card-foreground shadow-md", collapsed ? "w-20 items-center" : "w-64")}>
      <div className={cn("p-4 border-b", collapsed ? "h-[65px] flex items-center justify-center" : "h-[65px] flex items-center")}>
         <AppLogo collapsed={collapsed} />
      </div>
      <ScrollArea className="flex-1">
        <nav className={cn("flex flex-col gap-1 p-2", collapsed ? "items-center" : "")}>
          {navItems.map((item, index) =>
            item.type === "separator" ? (
              <Separator key={`sep-${index}`} className={cn("my-2", collapsed ? "w-12" : "")} />
            ) : (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary",
                pathname.startsWith(item.href) && item.href !== "/dashboard" ? "bg-primary/10 text-primary font-semibold" : (pathname === item.href ? "bg-primary/10 text-primary font-semibold" : "text-muted-foreground"),
                collapsed ? "justify-center" : ""
              )}
              title={collapsed ? item.label : undefined}
              aria-label={item.label}
            >
              <item.icon className={cn("h-5 w-5", collapsed ? "" : "")} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          ))}
        </nav>
      </ScrollArea>
    </div>
  );
}
