
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
import type { JobOrder, Customer, Motorcycle, Part, Service, Payment } from "@/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { PAYMENT_STATUSES } from "@/lib/constants";

// Initial mock data for job orders
const initialJobOrders: JobOrder[] = [
  {
    id: "jo1",
    customerId: "1", // John Doe
    motorcycleId: "m1", // Honda CBR600RR
    status: "In Progress",
    servicesPerformed: [
      { id: "jos1", serviceId: "svc1", serviceName: "Oil Change", laborCost: 50 }
    ],
    partsUsed: [
      { id: "jop1", partId: "part2", partName: "Oil Filter Hiflo HF204", quantity: 1, pricePerUnit: 12.50, totalPrice: 12.50 }
    ],
    servicesDescription: "Standard oil change, chain lubrication.", 
    partsDescription: "Oil filter, 4L synthetic oil.", 
    grandTotal: 62.50, 
    paymentStatus: PAYMENT_STATUSES.UNPAID,
    amountPaid: 0,
    paymentHistory: [],
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
    servicesPerformed: [
      { id: "jos2", serviceId: "svc2", serviceName: "Tire Replacement", laborCost: 150 }
    ],
    partsUsed: [
      { id: "jop2", partId: "someTirePartId1", partName: "Pirelli Diablo Rosso III (Front)", quantity: 1, pricePerUnit: 175, totalPrice: 175 },
      { id: "jop3", partId: "someTirePartId2", partName: "Pirelli Diablo Rosso III (Rear)", quantity: 1, pricePerUnit: 175, totalPrice: 175 }
    ],
    servicesDescription: "Tire replacement (front and rear), brake fluid flush.",
    grandTotal: 500, 
    paymentStatus: PAYMENT_STATUSES.PAID,
    amountPaid: 500,
    paymentHistory: [
        { id: "pay1", jobOrderId: "jo2", amount: 500, paymentDate: new Date(2023, 11, 3), method: "Credit Card", processedByUserId: "user456", createdAt: new Date(2023, 11, 3) }
    ],
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
      addJobOrder: (jobOrderData: Omit<JobOrder, 'id' | 'createdAt' | 'updatedAt' | 'createdByUserId' | 'grandTotal' | 'amountPaid' | 'paymentHistory'> & {grandTotal?: number}) => {
        const totalLabor = jobOrderData.servicesPerformed.reduce((sum, s) => sum + s.laborCost, 0);
        const totalParts = jobOrderData.partsUsed.reduce((sum, p) => sum + p.totalPrice, 0);
        const discount = Number(jobOrderData.discountAmount) || 0;
        const tax = Number(jobOrderData.taxAmount) || 0; 

        const newJobOrder: JobOrder = {
          ...jobOrderData,
          id: String(Date.now()),
          grandTotal: totalLabor + totalParts - discount + tax,
          amountPaid: 0,
          paymentHistory: [],
          // paymentStatus is set in the form, default or chosen by user
          createdAt: new Date(),
          updatedAt: new Date(),
          createdByUserId: "current_user_placeholder", 
        };
        (window as any).__jobOrderStore.jobOrders.push(newJobOrder);

        if ((window as any).__inventoryStore) {
          newJobOrder.partsUsed.forEach(item => {
            const partIndex = (window as any).__inventoryStore.parts.findIndex((p: Part) => p.id === item.partId);
            if (partIndex !== -1) {
              (window as any).__inventoryStore.parts[partIndex].stockQuantity -= item.quantity;
              if ((window as any).__inventoryStore.parts[partIndex].stockQuantity < 0) {
                console.warn(`Stock for part ${item.partName} is now negative.`);
              }
            }
          });
        }
        return newJobOrder;
      },
      updateJobOrder: (updatedJobOrder: JobOrder) => {
        const index = (window as any).__jobOrderStore.jobOrders.findIndex((jo: JobOrder) => jo.id === updatedJobOrder.id);
        if (index !== -1) {
          const oldJobOrder = (window as any).__jobOrderStore.jobOrders[index];
          const totalLabor = updatedJobOrder.servicesPerformed.reduce((sum, s) => sum + s.laborCost, 0);
          const totalParts = updatedJobOrder.partsUsed.reduce((sum, p) => sum + p.totalPrice, 0);
          const discount = Number(updatedJobOrder.discountAmount) || 0;
          const tax = Number(updatedJobOrder.taxAmount) || 0;

          (window as any).__jobOrderStore.jobOrders[index] = {
             ...updatedJobOrder,
             grandTotal: totalLabor + totalParts - discount + tax,
             updatedAt: new Date() 
            };
          
          if ((window as any).__inventoryStore) {
            oldJobOrder.partsUsed.forEach(oldItem => {
              const newItem = updatedJobOrder.partsUsed.find(ni => ni.partId === oldItem.partId);
              const partIndex = (window as any).__inventoryStore.parts.findIndex((p: Part) => p.id === oldItem.partId);
              if (partIndex !== -1) {
                if (!newItem) { 
                  (window as any).__inventoryStore.parts[partIndex].stockQuantity += oldItem.quantity;
                } else if (newItem.quantity !== oldItem.quantity) { 
                  (window as any).__inventoryStore.parts[partIndex].stockQuantity += (oldItem.quantity - newItem.quantity);
                }
              }
            });
             updatedJobOrder.partsUsed.forEach(newItem => {
                const oldItem = oldJobOrder.partsUsed.find(oi => oi.partId === newItem.partId);
                const partIndex = (window as any).__inventoryStore.parts.findIndex((p: Part) => p.id === newItem.partId);
                if(partIndex !== -1) {
                    if(!oldItem) { 
                         (window as any).__inventoryStore.parts[partIndex].stockQuantity -= newItem.quantity;
                    }
                }
             });
          }
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
      },
      addPaymentToJobOrder: (jobOrderId: string, payment: Payment) => {
        const joIndex = (window as any).__jobOrderStore.jobOrders.findIndex((jo: JobOrder) => jo.id === jobOrderId);
        if (joIndex !== -1) {
          const jobOrder = (window as any).__jobOrderStore.jobOrders[joIndex];
          jobOrder.paymentHistory.push(payment);
          jobOrder.amountPaid += payment.amount;
          if (jobOrder.amountPaid >= jobOrder.grandTotal) {
            jobOrder.paymentStatus = PAYMENT_STATUSES.PAID;
          } else if (jobOrder.amountPaid > 0) {
            jobOrder.paymentStatus = PAYMENT_STATUSES.PARTIAL;
          } else {
            jobOrder.paymentStatus = PAYMENT_STATUSES.UNPAID;
          }
          jobOrder.updatedAt = new Date();
          return true;
        }
        return false;
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
          description: `Job Order #${jobOrderToDelete.id.substring(0,6)} has been successfully deleted.`,
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
                    <TableCell><Badge variant={jo.paymentStatus === PAYMENT_STATUSES.PAID ? "default" : (jo.paymentStatus === PAYMENT_STATUSES.UNPAID ? "destructive" : "secondary") }>{jo.paymentStatus}</Badge></TableCell>
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

