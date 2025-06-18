
"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Package, Users, Wrench, ArrowRight, ClipboardList, AlertTriangle, DollarSign, ShoppingCart } from "lucide-react"; 
import Link from "next/link";
import Image from "next/image";
import React, { useEffect, useState, useMemo } from "react";
import type { JobOrder, Part, Customer, ShopSettings } from "@/types";
import { JOB_ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";

interface QuickStat {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  description?: string;
  href?: string;
}

export default function DashboardPage() {
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
  const [parts, setParts] = useState<Part[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isMounted, setIsMounted] = useState(false);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);

  const currency = useMemo(() => shopSettings?.currencySymbol || '₱', [shopSettings]);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      if ((window as any).__jobOrderStore) {
         const allOrders = ((window as any).__jobOrderStore.jobOrders || []).map((jo: JobOrder) => 
            (window as any).__jobOrderStore.getJobOrderById ? (window as any).__jobOrderStore.getJobOrderById(jo.id) : jo
         ).filter(Boolean);
        setJobOrders(allOrders);
      }
      if ((window as any).__inventoryStore) {
        setParts((window as any).__inventoryStore.parts || []);
      }
      if ((window as any).__customerStore) {
        setCustomers((window as any).__customerStore.customers || []);
      }
       if ((window as any).__settingsStore) {
        setShopSettings((window as any).__settingsStore.getSettings() || null);
      }
    }
  }, []);

  const quickStats = useMemo(() => {
    if (!isMounted) {
      return [
        { title: "Active Job Orders", value: "...", icon: <ClipboardList className="h-6 w-6 text-primary" />, color: "text-blue-500", href:"/dashboard/job-orders" },
        { title: "Pending Payments", value: "...", icon: <DollarSign className="h-6 w-6 text-primary" />, color: "text-yellow-500" , href:"/dashboard/job-orders"},
        { title: "Low Stock Items", value: "...", icon: <AlertTriangle className="h-6 w-6 text-primary" />, color: "text-red-500", href:"/dashboard/inventory" },
        { title: "Total Customers", value: "...", icon: <Users className="h-6 w-6 text-primary" />, color: "text-green-500", href:"/dashboard/customers" },
      ];
    }

    const activeJobOrders = jobOrders.filter(jo => 
      jo.status === JOB_ORDER_STATUSES.PENDING ||
      jo.status === JOB_ORDER_STATUSES.IN_PROGRESS ||
      jo.status === JOB_ORDER_STATUSES.AWAITING_PARTS ||
      jo.status === JOB_ORDER_STATUSES.READY_FOR_PICKUP
    ).length;

    const pendingPaymentsCount = jobOrders.filter(jo =>
      (jo.paymentStatus === PAYMENT_STATUSES.UNPAID || jo.paymentStatus === PAYMENT_STATUSES.PARTIAL) && jo.grandTotal > 0
    ).length;
    
    const pendingPaymentsAmount = jobOrders.reduce((sum, jo) => {
        if ((jo.paymentStatus === PAYMENT_STATUSES.UNPAID || jo.paymentStatus === PAYMENT_STATUSES.PARTIAL) && jo.grandTotal > 0) {
            return sum + (jo.grandTotal - jo.amountPaid);
        }
        return sum;
    },0);


    const lowStockItems = parts.filter(part => part.isActive && part.minStockAlert !== undefined && part.stockQuantity <= part.minStockAlert).length;

    return [
      { title: "Active Job Orders", value: activeJobOrders, icon: <ClipboardList className="h-6 w-6 text-primary" />, color: "text-blue-500", description: "Currently open tasks", href:"/dashboard/job-orders" },
      { title: "Pending Payments", value: pendingPaymentsCount, icon: <DollarSign className="h-6 w-6 text-primary" />, color: "text-yellow-500", description: `${currency}${pendingPaymentsAmount.toFixed(2)} due`, href:"/dashboard/job-orders"}, // Consider linking to a filtered J.O. list if possible
      { title: "Low Stock Items", value: lowStockItems, icon: <AlertTriangle className="h-6 w-6 text-primary" />, color: "text-red-500", description:"Needs reordering", href:"/dashboard/inventory" },
      { title: "Total Customers", value: customers.length, icon: <Users className="h-6 w-6 text-primary" />, color: "text-green-500", description: "Registered clients", href:"/dashboard/customers" },
    ];
  }, [isMounted, jobOrders, parts, customers, currency]);

  const quickActions = [
    { label: "New Job Order", href: "/dashboard/job-orders/new", icon: <Wrench className="mr-2 h-4 w-4" /> },
    { label: "Add Customer", href: "/dashboard/customers/new", icon: <Users className="mr-2 h-4 w-4" /> },
    { label: "Add Part", href: "/dashboard/inventory/new", icon: <Package className="mr-2 h-4 w-4" /> },
    { label: "Direct Part Sale", href: "/dashboard/direct-sales", icon: <ShoppingCart className="mr-2 h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="font-headline text-3xl">Welcome to TorqueTrack!</CardTitle>
          <CardDescription>Here's a quick overview of your workshop.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickStats.map((stat) => (
              <Card key={stat.title} className="hover:shadow-md transition-shadow">
                 <Link href={stat.href || "#"} className="cursor-pointer">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                    </CardTitle>
                    {stat.icon}
                    </CardHeader>
                    <CardContent>
                    <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                    {stat.description && <p className="text-xs text-muted-foreground pt-1">{stat.description}</p>}
                    </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Quick Actions</CardTitle>
          <CardDescription>Get started with common tasks.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => (
            <Button key={action.label} asChild variant="outline" size="lg" className="justify-start py-6 text-base group hover:bg-primary/5 hover:border-primary">
              <Link href={action.href}>
                {action.icon}
                {action.label}
                <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Recent Activity (Placeholder)</CardTitle>
            <CardDescription>Latest updates in your workshop.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for recent activity feed */}
            <ul className="space-y-3">
              <li className="flex items-center gap-3 p-3 bg-muted/30 rounded-md">
                <Image src="https://placehold.co/40x40.png" alt="User avatar" width={40} height={40} className="rounded-full" data-ai-hint="user activity icon"/>
                <div>
                  <p className="text-sm font-medium">Job Order #JO-0012 status changed to "In Progress".</p>
                  <p className="text-xs text-muted-foreground">2 hours ago by Alex M.</p>
                </div>
              </li>
              <li className="flex items-center gap-3 p-3 bg-muted/30 rounded-md">
                <Image src="https://placehold.co/40x40.png" alt="User avatar" width={40} height={40} className="rounded-full" data-ai-hint="user activity icon"/>
                <div>
                  <p className="text-sm font-medium">New Customer "Jane Doe" added.</p>
                  <p className="text-xs text-muted-foreground">5 hours ago by Sarah C.</p>
                </div>
              </li>
               <li className="flex items-center gap-3 p-3 bg-muted/30 rounded-md">
                <Image src="https://placehold.co/40x40.png" alt="User avatar" width={40} height={40} className="rounded-full" data-ai-hint="inventory update icon"/>
                <div>
                  <p className="text-sm font-medium">Part "Spark Plug NGK-CR8E" stock updated.</p>
                  <p className="text-xs text-muted-foreground">Yesterday by Mike L.</p>
                </div>
              </li>
            </ul>
             <Button variant="link" className="mt-4 text-primary px-0" onClick={() => alert("View all activity page is not yet implemented.")}>View all activity</Button>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Performance Snapshot (Placeholder)</CardTitle>
            <CardDescription>Key metrics overview.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            <Image src="https://placehold.co/400x200.png" alt="Performance chart placeholder" width={400} height={200} data-ai-hint="business chart graph" className="rounded-md"/>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
