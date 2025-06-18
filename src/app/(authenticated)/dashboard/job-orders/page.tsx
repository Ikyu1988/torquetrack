
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
import type { JobOrder, Customer, Motorcycle, Part, Service, Payment, PaymentMethod, ShopSettings } from "@/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { PAYMENT_STATUSES, JOB_ORDER_STATUSES } from "@/lib/constants";

const initialJobOrders: JobOrder[] = [
  {
    id: "jo1",
    customerId: "1", 
    motorcycleId: "m1", 
    status: JOB_ORDER_STATUSES.IN_PROGRESS,
    servicesPerformed: [
      { id: "jos1", serviceId: "svc1", serviceName: "Oil Change", laborCost: 50, assignedMechanicId: "mech1" }
    ],
    partsUsed: [
      { id: "jop1", partId: "part2", partName: "Oil Filter Hiflo HF204", quantity: 1, pricePerUnit: 12.50, totalPrice: 12.50 }
    ],
    servicesDescription: "Standard oil change, chain lubrication.", 
    partsDescription: "Oil filter, 4L synthetic oil.", 
    taxAmount: 4.69, 
    grandTotal: 67.19, 
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
    customerId: "2", 
    motorcycleId: "m2", 
    status: JOB_ORDER_STATUSES.COMPLETED,
    servicesPerformed: [
      { id: "jos2", serviceId: "svc2", serviceName: "Tire Replacement", laborCost: 150, assignedMechanicId: "mech2" }
    ],
    partsUsed: [
      { id: "jop2", partId: "someTirePartId1", partName: "Pirelli Diablo Rosso III (Front)", quantity: 1, pricePerUnit: 175, totalPrice: 175 },
      { id: "jop3", partId: "someTirePartId2", partName: "Pirelli Diablo Rosso III (Rear)", quantity: 1, pricePerUnit: 175, totalPrice: 175 }
    ],
    servicesDescription: "Tire replacement (front and rear), brake fluid flush.",
    taxAmount: 37.50, 
    grandTotal: 537.50, 
    paymentStatus: PAYMENT_STATUSES.PAID,
    amountPaid: 537.50,
    paymentHistory: [
        { id: "pay1", jobOrderId: "jo2", amount: 537.50, paymentDate: new Date(2023, 11, 3), method: "Credit Card", processedByUserId: "user456", createdAt: new Date(2023, 11, 3), notes: "Paid in full via CC" }
    ],
    createdAt: new Date(2023, 11, 1),
    updatedAt: new Date(2023, 11, 3),
    createdByUserId: "user456",
    actualCompletionDate: new Date(2023, 11, 3),
  },
];

type AddJobOrderInput = Omit<JobOrder, 'id' | 'createdAt' | 'updatedAt' | 'createdByUserId' | 'grandTotal' | 'amountPaid' | 'paymentHistory' | 'taxAmount'> & {
  initialPaymentMethod?: PaymentMethod;
  initialPaymentNotes?: string;
  taxAmount?: number; // Keep this optional for direct sales if pre-calculated
};


if (typeof window !== 'undefined') {
  if (!(window as any).__jobOrderStore) {
    (window as any).__jobOrderStore = {
      jobOrders: [...initialJobOrders],
      addJobOrder: (jobOrderData: AddJobOrderInput) => {
        const totalLabor = jobOrderData.servicesPerformed.reduce((sum, s) => sum + s.laborCost, 0);
        const totalParts = jobOrderData.partsUsed.reduce((sum, p) => sum + p.totalPrice, 0);
        const discount = Number(jobOrderData.discountAmount) || 0;
        
        let taxRateValue = 0;
        if(typeof window !== 'undefined' && (window as any).__settingsStore) {
            taxRateValue = (window as any).__settingsStore.getSettings()?.defaultTaxRate || 0;
        }
        const subTotalBeforeTax = totalLabor + totalParts - discount;
        // Always calculate tax unless it's explicitly provided (e.g. for direct sales where it might be calculated on client)
        const calculatedTaxAmount = jobOrderData.taxAmount !== undefined ? Number(jobOrderData.taxAmount) : (subTotalBeforeTax * (taxRateValue / 100));


        const newJobOrder: JobOrder = {
          ...jobOrderData,
          id: String(Date.now()), 
          servicesPerformed: jobOrderData.servicesPerformed || [],
          partsUsed: jobOrderData.partsUsed || [],
          taxAmount: calculatedTaxAmount,
          grandTotal: subTotalBeforeTax + calculatedTaxAmount,
          amountPaid: jobOrderData.paymentStatus === PAYMENT_STATUSES.PAID ? (subTotalBeforeTax + calculatedTaxAmount) : 0,
          paymentHistory: [],
          createdAt: new Date(),
          updatedAt: new Date(),
          createdByUserId: "current_user_placeholder", 
        };

        if (newJobOrder.paymentStatus === PAYMENT_STATUSES.PAID && newJobOrder.amountPaid > 0 && newJobOrder.paymentHistory.length === 0) {
            const initialPayment: Payment = {
                id: String(Date.now() + 1), 
                jobOrderId: newJobOrder.id,
                amount: newJobOrder.amountPaid,
                paymentDate: new Date(),
                method: jobOrderData.initialPaymentMethod || 'Cash', 
                notes: jobOrderData.initialPaymentNotes || `Initial payment for order #${newJobOrder.id.substring(0,6)}`,
                processedByUserId: newJobOrder.createdByUserId,
                createdAt: new Date(),
            };
            newJobOrder.paymentHistory.push(initialPayment);
            if(typeof window !== 'undefined' && (window as any).__paymentStore) {
                (window as any).__paymentStore.addPayment(initialPayment);
            }
        }

        (window as any).__jobOrderStore.jobOrders.push(newJobOrder);

        if ((window as any).__inventoryStore) {
          newJobOrder.partsUsed.forEach(item => {
            const partIndex = (window as any).__inventoryStore.parts.findIndex((p: Part) => p.id === item.partId);
            if (partIndex !== -1) {
              (window as any).__inventoryStore.parts[partIndex].stockQuantity -= item.quantity;
              if ((window as any).__inventoryStore.parts[partIndex].stockQuantity < 0) {
                console.warn(`Stock for part ${item.partName} (${item.partId}) is now negative: ${(window as any).__inventoryStore.parts[partIndex].stockQuantity}`);
              }
            }
          });
        }
        return newJobOrder;
      },
      updateJobOrder: (updatedJobOrder: JobOrder) => {
        const index = (window as any).__jobOrderStore.jobOrders.findIndex((jo: JobOrder) => jo.id === updatedJobOrder.id);
        if (index !== -1) {
          const oldJobOrder = { ...(window as any).__jobOrderStore.jobOrders[index] }; // Deep copy partsUsed for accurate stock reversal
          oldJobOrder.partsUsed = oldJobOrder.partsUsed.map(p => ({...p}));

          const totalLabor = updatedJobOrder.servicesPerformed.reduce((sum, s) => sum + s.laborCost, 0);
          const totalParts = updatedJobOrder.partsUsed.reduce((sum, p) => sum + p.totalPrice, 0);
          const discount = Number(updatedJobOrder.discountAmount) || 0;
          
          let taxRateValue = 0;
          if(typeof window !== 'undefined' && (window as any).__settingsStore) {
              taxRateValue = (window as any).__settingsStore.getSettings()?.defaultTaxRate || 0;
          }
          const subTotalBeforeTax = totalLabor + totalParts - discount;
          const calculatedTaxAmount = subTotalBeforeTax * (taxRateValue / 100);

          (window as any).__jobOrderStore.jobOrders[index] = {
             ...updatedJobOrder,
             taxAmount: calculatedTaxAmount,
             grandTotal: subTotalBeforeTax + calculatedTaxAmount,
             updatedAt: new Date() 
            };
          
          if ((window as any).__inventoryStore) {
            // Return old parts to stock
            oldJobOrder.partsUsed.forEach(oldItem => {
              const partIndex = (window as any).__inventoryStore.parts.findIndex((p: Part) => p.id === oldItem.partId);
              if (partIndex !== -1) {
                (window as any).__inventoryStore.parts[partIndex].stockQuantity += oldItem.quantity;
              }
            });

            // Deduct new parts from stock
            updatedJobOrder.partsUsed.forEach(newItem => {
                const partIndex = (window as any).__inventoryStore.parts.findIndex((p: Part) => p.id === newItem.partId);
                if(partIndex !== -1) {
                    (window as any).__inventoryStore.parts[partIndex].stockQuantity -= newItem.quantity;
                     if ((window as any).__inventoryStore.parts[partIndex].stockQuantity < 0) {
                        console.warn(`Stock for part ${newItem.partName} (${newItem.partId}) is now negative after update: ${(window as any).__inventoryStore.parts[partIndex].stockQuantity}`);
                    }
                }
             });
          }
          return true;
        }
        return false;
      },
      deleteJobOrder: (jobOrderId: string) => {
         const jobOrderIndex = (window as any).__jobOrderStore.jobOrders.findIndex((jo: JobOrder) => jo.id === jobOrderId);
        if (jobOrderIndex !== -1) {
            const jobOrderToDelete = (window as any).__jobOrderStore.jobOrders[jobOrderIndex];
            // Return parts to inventory
            if ((window as any).__inventoryStore && jobOrderToDelete.partsUsed) {
                jobOrderToDelete.partsUsed.forEach(item => {
                    const partIndex = (window as any).__inventoryStore.parts.findIndex((p: Part) => p.id === item.partId);
                    if (partIndex !== -1) {
                        (window as any).__inventoryStore.parts[partIndex].stockQuantity += item.quantity;
                    }
                });
            }
            // Delete the job order
            (window as any).__jobOrderStore.jobOrders = (window as any).__jobOrderStore.jobOrders.filter((jo: JobOrder) => jo.id !== jobOrderId);
            // Delete associated payments
            if ((window as any).__paymentStore && jobOrderToDelete.paymentHistory) {
                jobOrderToDelete.paymentHistory.forEach(p => (window as any).__paymentStore.deletePaymentById?.(p.id));
            }
            return true;
        }
        return false;
      },
      getJobOrderById: (jobOrderId: string) => {
        const jobOrder = (window as any).__jobOrderStore.jobOrders.find((jo: JobOrder) => jo.id === jobOrderId);
        if (jobOrder && (window as any).__paymentStore) {
            const payments = (window as any).__paymentStore.getPaymentsByJobOrderId(jobOrder.id);
            jobOrder.paymentHistory = payments;
            jobOrder.amountPaid = payments.reduce((sum: number, p: Payment) => sum + p.amount, 0);
            if (jobOrder.amountPaid >= jobOrder.grandTotal && jobOrder.grandTotal > 0.001) jobOrder.paymentStatus = PAYMENT_STATUSES.PAID;
            else if (jobOrder.grandTotal <= 0.001 && jobOrder.amountPaid <= 0.001) jobOrder.paymentStatus = PAYMENT_STATUSES.PAID; // Zero total orders are Paid
            else if (jobOrder.amountPaid > 0) jobOrder.paymentStatus = PAYMENT_STATUSES.PARTIAL;
            else jobOrder.paymentStatus = PAYMENT_STATUSES.UNPAID;
        }
        return jobOrder;
      },
      addPaymentToJobOrder: (jobOrderId: string, payment: Payment) => {
        const joIndex = (window as any).__jobOrderStore.jobOrders.findIndex((jo: JobOrder) => jo.id === jobOrderId);
        if (joIndex !== -1) {
          const jobOrder = (window as any).__jobOrderStore.jobOrders[joIndex];
          if (!jobOrder.paymentHistory.find(p => p.id === payment.id)) {
            jobOrder.paymentHistory.push(payment);
            jobOrder.amountPaid += payment.amount;
          } else {
            // This case might happen if a payment is added externally and then again through this function
            // Recalculate amountPaid to be safe
            jobOrder.amountPaid = jobOrder.paymentHistory.reduce((sum: number, p: Payment) => sum + p.amount, 0);
          }
          
          const grandTotalNum = Number(jobOrder.grandTotal) || 0;
          // Check for floating point precision issues with a small epsilon
          if (jobOrder.amountPaid >= grandTotalNum - 0.001 && grandTotalNum > 0.001) {
            jobOrder.paymentStatus = PAYMENT_STATUSES.PAID;
          } else if (grandTotalNum <= 0.001 && jobOrder.amountPaid <= 0.001) { // For zero or negative grand total, consider paid
             jobOrder.paymentStatus = PAYMENT_STATUSES.PAID;
          }
           else if (jobOrder.amountPaid > 0) {
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
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [jobOrderToDelete, setJobOrderToDelete] = useState<JobOrder | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const currency = useMemo(() => shopSettings?.currencySymbol || '₱', [shopSettings]);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      if ((window as any).__jobOrderStore) {
        const ordersFromStore = (window as any).__jobOrderStore.jobOrders.map((jo: JobOrder) => {
            if ((window as any).__paymentStore && (window as any).__jobOrderStore.getJobOrderById) { // ensure getJobOrderById is used
                 return (window as any).__jobOrderStore.getJobOrderById(jo.id);
            }
            return jo;
        }).filter(Boolean); // Filter out any undefined results if getJobOrderById returns undefined
        setJobOrders([...ordersFromStore]);
      }
      if ((window as any).__customerStore) { 
        setCustomers([...(window as any).__customerStore.customers]);
      }
      if ((window as any).__motorcycleStore) { 
        setMotorcycles([...(window as any).__motorcycleStore.motorcycles]);
      }
      if ((window as any).__settingsStore) {
        setShopSettings((window as any).__settingsStore.getSettings());
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
    motorcycles.forEach(m => {
        map.set(m.id, `${m.make} ${m.model} (${m.plateNumber || 'N/A'})`);
    });
    return map;
  }, [motorcycles]);

  const refreshJobOrders = () => {
    if (typeof window !== 'undefined' && (window as any).__jobOrderStore) {
       const ordersFromStore = (window as any).__jobOrderStore.jobOrders.map((jo: JobOrder) => {
            if ((window as any).__paymentStore && (window as any).__jobOrderStore.getJobOrderById) { // ensure getJobOrderById is used
                 return (window as any).__jobOrderStore.getJobOrderById(jo.id);
            }
            return jo;
        }).filter(Boolean);
      setJobOrders([...ordersFromStore]);
    }
  };

  useEffect(() => {
    if (!isMounted) return;
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).__jobOrderStore) {
        const storeJobOrdersRaw = (window as any).__jobOrderStore.jobOrders;
        const currentJOStates = jobOrders.map(jo => ({id: jo.id, updatedAt: jo.updatedAt, amountPaid: jo.amountPaid, paymentStatus: jo.paymentStatus}));
        const storeJOStates = storeJobOrdersRaw.map((jo:JobOrder) => {
            const fullJo = (window as any).__jobOrderStore.getJobOrderById(jo.id);
            return {id: fullJo?.id, updatedAt: fullJo?.updatedAt, amountPaid: fullJo?.amountPaid, paymentStatus: fullJo?.paymentStatus};
        }).filter(Boolean);

        if (JSON.stringify(storeJOStates) !== JSON.stringify(currentJOStates)) {
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
          description: `Job Order/Sale #${jobOrderToDelete.id.substring(0,6)} has been successfully deleted.`,
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
              <CardTitle className="font-headline text-2xl">Job Orders & Sales</CardTitle>
            </div>
            <CardDescription>Manage all workshop job orders and direct sales.</CardDescription>
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
                  <TableHead>Motorcycle/Type</TableHead>
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
                    <TableCell>{jo.customerId ? customerMap.get(jo.customerId) || "N/A" : "Walk-in Sale"}</TableCell>
                    <TableCell>{jo.motorcycleId ? motorcycleMap.get(jo.motorcycleId) || "N/A" : (jo.status === JOB_ORDER_STATUSES.SALE_COMPLETED ? "Direct Sale" : "N/A")}</TableCell>
                    <TableCell><Badge variant={jo.status === JOB_ORDER_STATUSES.COMPLETED || jo.status === JOB_ORDER_STATUSES.SALE_COMPLETED ? "default" : "secondary"}>{jo.status}</Badge></TableCell>
                    <TableCell><Badge variant={jo.paymentStatus === PAYMENT_STATUSES.PAID ? "default" : (jo.paymentStatus === PAYMENT_STATUSES.UNPAID ? "destructive" : "secondary") }>{jo.paymentStatus}</Badge></TableCell>
                    <TableCell className="text-right">{currency}{(Number(jo.grandTotal) || 0).toFixed(2)}</TableCell>
                    <TableCell>{format(new Date(jo.createdAt), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" asChild className="hover:text-primary">
                        <Link href={`/dashboard/job-orders/${jo.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Link>
                      </Button>
                       {jo.status !== JOB_ORDER_STATUSES.SALE_COMPLETED && (
                        <Button variant="ghost" size="icon" asChild className="hover:text-primary">
                            <Link href={`/dashboard/job-orders/${jo.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                            </Link>
                        </Button>
                       )}
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
                <p className="text-lg">No job orders or sales found.</p>
                <p>Get started by creating a new job order or making a direct sale.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete Order/Sale #{jobOrderToDelete?.id.substring(0,6)}.
              If this is a direct sale or a job order with parts, stock levels for those parts will be readjusted. Associated payment records will also be removed.
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

