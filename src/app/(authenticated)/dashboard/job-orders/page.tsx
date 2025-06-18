
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ClipboardList, Pencil, Trash2, Eye } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { JobOrder, Customer, Motorcycle } from "@/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

// Initial mock data for job orders
const initialJobOrders: JobOrder[] = [
  {
    id: "jo1",
    customerId: "1", // John Doe
    motorcycleId: "m1", // Honda CBR600RR
    status: "In Progress",
    servicesDescription: "Standard oil change, chain lubrication.",
    partsDescription: "Oil filter, 4L synthetic oil.",
    totalLaborCost: 75,
    totalPartsCost: 45,
    grandTotal: 120,
    paymentStatus: "Unpaid",
    createdAt: new Date(2023, 10, 15),
    updatedAt: new Date(2023, 10, 16),
    createdByUserId: "user123",
    estimatedCompletionDate: new Date(2023, 10, 17),
  },
  {
    id: "jo2",
    customerId: "2", // Jane Smith
    motorcycleId: "m2", // Yamaha MT-07
    status: "Completed",
    servicesDescription: "Tire replacement (front and rear), brake fluid flush.",
    partsDescription: "2x Pirelli Diablo Rosso III tires, DOT4 brake fluid.",
    totalLaborCost: 150,
    totalPartsCost: 350,
    grandTotal: 500,
    paymentStatus: "Paid",
    createdAt: new Date(2023, 11, 1),
    updatedAt: new Date(2023, 11, 3),
    createdByUserId: "user456",
    actualCompletionDate: new Date(2023, 11, 3),
  },
];

// In-memory store for job orders
if (typeof window !== 'undefined') {
  if (!(window as any).__jobOrderStore) {
    (window as any).__jobOrderStore = {
      jobOrders: [...initialJobOrders],
      addJobOrder: (jobOrder: Omit<JobOrder, 'id' | 'createdAt' | 'updatedAt' | 'createdByUserId' | 'grandTotal'>) => {
        const newJobOrder: JobOrder = {
          ...jobOrder,
          id: String(Date.now()),
          grandTotal: jobOrder.totalLaborCost + jobOrder.totalPartsCost - (jobOrder.discountAmount || 0) + (jobOrder.taxAmount || 0),
          createdAt: new Date(),
          updatedAt: new Date(),
          createdByUserId: "current_user_placeholder", // Replace with actual user ID
        };
        (window as any).__jobOrderStore.jobOrders.push(newJobOrder);
        return newJobOrder;
      },
      updateJobOrder: (updatedJobOrder: JobOrder) => {
        const index = (window as any).__jobOrderStore.jobOrders.findIndex((jo: JobOrder) => jo.id === updatedJobOrder.id);
        if (index !== -1) {
          (window as any).__jobOrderStore.jobOrders[index] = {
             ...updatedJobOrder,
             grandTotal: updatedJobOrder.totalLaborCost + updatedJobOrder.totalPartsCost - (updatedJobOrder.discountAmount || 0) + (updatedJobOrder.taxAmount || 0),
             updatedAt: new Date() 
            };
          return true;
        }
        return false;
      },
      deleteJobOrder: (jobOrderId: string) => {
        (window as any).__jobOrderStore.jobOrders = (window as any).__jobOrderStore.jobOrders.filter((jo: JobOrder) => jo.id !== jobOrderId);
        return true;
      },
      getJobOrderById: (jobOrderId: string) => {
        return (window as any).__jobOrderStore.jobOrders.find((jo: JobOrder) => jo.id === jobOrderId);
      }
    };
  }
}

export default function JobOrdersPage() {
  const { toast } = useToast();
  const [jobOrders, setJobOrders] = useState<JobOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [jobOrderToDelete, setJobOrderToDelete] = useState<JobOrder | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      if ((window as any).__jobOrderStore) {
        setJobOrders([...(window as any).__jobOrderStore.jobOrders]);
      }
      if ((window as any).__customerStore) { 
        setCustomers([...(window as any).__customerStore.customers]);
      }
      if ((window as any).__motorcycleStore) { 
        setMotorcycles([...(window as any).__motorcycleStore.motorcycles]);
      }
    }
  }, []);

  const customerMap = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach(c => map.set(c.id, `${c.firstName} ${c.lastName}`));
    return map;
  }, [customers]);

  const motorcycleMap = useMemo(() => {
    const map = new Map<string, string>();
    motorcycles.forEach(m => map.set(m.id, `${m.make} ${m.model} (${m.plateNumber})`));
    return map;
  }, [motorcycles]);

  const refreshJobOrders = () => {
    if (typeof window !== 'undefined' && (window as any).__jobOrderStore) {
      setJobOrders([...(window as any).__jobOrderStore.jobOrders]);
    }
  };

  useEffect(() => {
    if (!isMounted) return;
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).__jobOrderStore) {
        const storeJobOrders = (window as any).__jobOrderStore.jobOrders;
        if (JSON.stringify(storeJobOrders) !== JSON.stringify(jobOrders)) {
          refreshJobOrders();
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [jobOrders, isMounted]);

  const handleDeleteJobOrder = (jobOrder: JobOrder) => {
    setJobOrderToDelete(jobOrder);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (jobOrderToDelete) {
      if (typeof window !== 'undefined' && (window as any).__jobOrderStore) {
        (window as any).__jobOrderStore.deleteJobOrder(jobOrderToDelete.id);
        refreshJobOrders();
        toast({
          title: "Job Order Deleted",
          description: `Job Order #${jobOrderToDelete.id} has been successfully deleted.`,
        });
      }
    }
    setShowDeleteDialog(false);
    setJobOrderToDelete(null);
  };
  
  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><p>Loading job orders...</p></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <ClipboardList className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-2xl">Job Orders</CardTitle>
            </div>
            <CardDescription>Manage all workshop job orders.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/dashboard/job-orders/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Job Order
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {jobOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Motorcycle</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobOrders.map((jo) => (
                  <TableRow key={jo.id}>
                    <TableCell className="font-medium">{`#${jo.id.substring(0,6)}`}</TableCell>
                    <TableCell>{customerMap.get(jo.customerId) || "N/A"}</TableCell>
                    <TableCell>{motorcycleMap.get(jo.motorcycleId) || "N/A"}</TableCell>
                    <TableCell><Badge variant={jo.status === "Completed" ? "default" : "secondary"}>{jo.status}</Badge></TableCell>
                    <TableCell><Badge variant={jo.paymentStatus === "Paid" ? "default" : (jo.paymentStatus === "Unpaid" ? "destructive" : "secondary") }>{jo.paymentStatus}</Badge></TableCell>
                    <TableCell className="text-right">${jo.grandTotal.toFixed(2)}</TableCell>
                    <TableCell>{format(new Date(jo.createdAt), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" asChild className="hover:text-primary">
                        <Link href={`/dashboard/job-orders/${jo.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild className="hover:text-primary">
                        <Link href={`/dashboard/job-orders/${jo.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="hover:text-destructive"
                        onClick={() => handleDeleteJobOrder(jo)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-10 text-muted-foreground">
                <ClipboardList className="h-16 w-16" />
                <p className="text-lg">No job orders found.</p>
                <p>Get started by creating a new job order.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete Job Order #{jobOrderToDelete?.id.substring(0,6)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setJobOrderToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
