
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ClipboardList, Pencil, Trash2, Eye, Search } from "lucide-react";
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
import type { JobOrder, Customer, Motorcycle, Part, Service, Payment, PaymentMethod, ShopSettings, JobOrderStatus, JobOrderPartItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { PAYMENT_STATUSES, JOB_ORDER_STATUSES, JOB_ORDER_STATUS_OPTIONS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const today = new Date();
const yesterday = new Date(today);
yesterday.setDate(today.getDate() - 1);
const fiveDaysAgo = new Date(today);
fiveDaysAgo.setDate(today.getDate() - 5);


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
    createdAt: new Date(new Date().setDate(new Date().getDate() - 2)), 
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 2)),
    createdByUserId: "user123",
    estimatedCompletionDate: new Date(new Date().setDate(new Date().getDate() + 1)), 
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
        { id: "pay1", orderId: "jo2", orderType: 'JobOrder', amount: 537.50, paymentDate: new Date(new Date().setDate(new Date().getDate() -1)), method: "Credit Card", processedByUserId: "user456", createdAt: new Date(new Date().setDate(new Date().getDate() -1)), notes: "Paid in full via CC" } 
    ],
    createdAt: new Date(new Date().setDate(new Date().getDate() - 1)), 
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 1)),
    createdByUserId: "user456",
    actualCompletionDate: new Date(new Date().setDate(new Date().getDate() - 1)), 
  },
];

type AddJobOrderInput = Omit<JobOrder, 'id' | 'createdAt' | 'updatedAt' | 'createdByUserId' | 'grandTotal' | 'amountPaid' | 'paymentHistory' | 'taxAmount'> & {
  initialPaymentMethod?: PaymentMethod;
  initialPaymentNotes?: string;
  taxAmount?: number; 
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
                orderId: newJobOrder.id,
                orderType: 'JobOrder',
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
          newJobOrder.partsUsed.forEach((item: JobOrderPartItem) => {
            const partIndex = (window as any).__inventoryStore.parts.findIndex((p: Part) => p.id === item.partId);
            if (partIndex !== -1) {
              (window as any).__inventoryStore.parts[partIndex].stockQuantity -= item.quantity;
            }
          });
        }
        return newJobOrder;
      },
      updateJobOrder: (updatedJobOrder: JobOrder) => {
        const index = (window as any).__jobOrderStore.jobOrders.findIndex((jo: JobOrder) => jo.id === updatedJobOrder.id);
        if (index !== -1) {
          const oldJobOrder = { ...(window as any).__jobOrderStore.jobOrders[index] }; 
          oldJobOrder.partsUsed = oldJobOrder.partsUsed.map((p: JobOrderPartItem) => ({...p}));

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
            oldJobOrder.partsUsed.forEach((oldItem: JobOrderPartItem) => {
              const partIndex = (window as any).__inventoryStore.parts.findIndex((p: Part) => p.id === oldItem.partId);
              if (partIndex !== -1) {
                (window as any).__inventoryStore.parts[partIndex].stockQuantity += oldItem.quantity;
              }
            });

            updatedJobOrder.partsUsed.forEach((newItem: JobOrderPartItem) => {
                const partIndex = (window as any).__inventoryStore.parts.findIndex((p: Part) => p.id === newItem.partId);
                if(partIndex !== -1) {
                    (window as any).__inventoryStore.parts[partIndex].stockQuantity -= newItem.quantity;
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
            if ((window as any).__inventoryStore && jobOrderToDelete.partsUsed) {
                jobOrderToDelete.partsUsed.forEach((item: JobOrderPartItem) => {
                    const partIndex = (window as any).__inventoryStore.parts.findIndex((p: Part) => p.id === item.partId);
                    if (partIndex !== -1) {
                        (window as any).__inventoryStore.parts[partIndex].stockQuantity += item.quantity;
                    }
                });
            }
            (window as any).__jobOrderStore.jobOrders = (window as any).__jobOrderStore.jobOrders.filter((jo: JobOrder) => jo.id !== jobOrderId);
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
            const payments = (window as any).__paymentStore.getPaymentsByOrderId(jobOrder.id, 'JobOrder');
            jobOrder.paymentHistory = payments;
            jobOrder.amountPaid = payments.reduce((sum: number, p: Payment) => sum + p.amount, 0);
            
            const grandTotalNum = Number(jobOrder.grandTotal) || 0;
            if (jobOrder.amountPaid >= grandTotalNum - 0.001 && grandTotalNum > 0.001) {
                 jobOrder.paymentStatus = PAYMENT_STATUSES.PAID;
            } else if (grandTotalNum <= 0.001 && jobOrder.amountPaid <= 0.001) {
                 jobOrder.paymentStatus = PAYMENT_STATUSES.PAID;
            } else if (jobOrder.amountPaid > 0) {
                 jobOrder.paymentStatus = PAYMENT_STATUSES.PARTIAL;
            } else {
                 jobOrder.paymentStatus = PAYMENT_STATUSES.UNPAID;
            }
        }
        return jobOrder;
      },
      addPaymentToJobOrder: (jobOrderId: string, payment: Payment) => {
        const joIndex = (window as any).__jobOrderStore.jobOrders.findIndex((jo: JobOrder) => jo.id === jobOrderId);
        if (joIndex !== -1) {
          const jobOrder = (window as any).__jobOrderStore.jobOrders[joIndex];
          if (!jobOrder.paymentHistory.find(p => p.id === payment.id)) {
            jobOrder.paymentHistory.push(payment);
          }
          // Recalculate amountPaid and paymentStatus
          jobOrder.amountPaid = jobOrder.paymentHistory.reduce((sum: number, p: Payment) => sum + p.amount, 0);
          
          const grandTotalNum = Number(jobOrder.grandTotal) || 0;
          if (jobOrder.amountPaid >= grandTotalNum - 0.001 && grandTotalNum > 0.001) {
            jobOrder.paymentStatus = PAYMENT_STATUSES.PAID;
          } else if (grandTotalNum <= 0.001 && jobOrder.amountPaid <= 0.001) { 
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
  } else {
     if ((window as any).__jobOrderStore && (!(window as any).__jobOrderStore.jobOrders || (window as any).__jobOrderStore.jobOrders.length === 0)) {
        (window as any).__jobOrderStore.jobOrders = [...initialJobOrders];
    }
  }
}

export default function JobOrdersPage() {
  const { toast } = useToast();
  const [allJobOrders, setAllJobOrders] = useState<JobOrder[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [jobOrderToDelete, setJobOrderToDelete] = useState<JobOrder | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobOrderStatus | "ALL">("ALL");

  const currency = useMemo(() => shopSettings?.currencySymbol || '₱', [shopSettings]);

  const customerMap = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach(c => map.set(c.id, `${c.firstName} ${c.lastName}`));
    return map;
  }, [customers]);

  const motorcycleMap = useMemo(() => {
    const map = new Map<string, { make: string, model: string, plateNumber: string }>();
    motorcycles.forEach(m => {
        map.set(m.id, {make: m.make, model: m.model, plateNumber: m.plateNumber});
    });
    return map;
  }, [motorcycles]);

  const refreshJobOrders = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).__jobOrderStore) {
       const ordersFromStore = ((window as any).__jobOrderStore.jobOrders || []).map((jo: JobOrder) => {
            if ((window as any).__paymentStore && (window as any).__jobOrderStore.getJobOrderById) { 
                 return (window as any).__jobOrderStore.getJobOrderById(jo.id);
            }
            return jo;
        }).filter(Boolean);
      setAllJobOrders(prevOrders => {
        if (JSON.stringify(ordersFromStore) !== JSON.stringify(prevOrders)) {
            return [...ordersFromStore];
        }
        return prevOrders;
      });
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      if ((window as any).__jobOrderStore) {
        const ordersFromStore = ((window as any).__jobOrderStore.jobOrders || []).map((jo: JobOrder) => {
            if ((window as any).__paymentStore && (window as any).__jobOrderStore.getJobOrderById) { 
                 return (window as any).__jobOrderStore.getJobOrderById(jo.id);
            }
            return jo;
        }).filter(Boolean); 

        if (ordersFromStore.length > 0) {
            setAllJobOrders([...ordersFromStore]);
        } else if (initialJobOrders.length > 0 && (!ordersFromStore || ordersFromStore.length === 0)) {
            (window as any).__jobOrderStore.jobOrders = [...initialJobOrders]; // Prime the store if empty
            setAllJobOrders([...initialJobOrders]);
        }
      }
      if ((window as any).__customerStore) { 
        setCustomers([...((window as any).__customerStore.customers || [])]);
      }
      if ((window as any).__motorcycleStore) { 
        setMotorcycles([...((window as any).__motorcycleStore.motorcycles || [])]);
      }
      if ((window as any).__settingsStore) {
        setShopSettings((window as any).__settingsStore.getSettings() || null);
      }
    }
  }, []);


  useEffect(() => {
    if (!isMounted) return;
    const interval = setInterval(() => {
      refreshJobOrders();
    }, 1000);
    return () => clearInterval(interval);
  }, [isMounted, refreshJobOrders]);

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

  const filteredJobOrders = useMemo(() => {
    let filtered = allJobOrders;
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(jo => jo.status === statusFilter);
    }
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(jo => {
        const customerName = jo.customerId ? customerMap.get(jo.customerId)?.toLowerCase() : "";
        const motorcycleInfo = jo.motorcycleId ? motorcycleMap.get(jo.motorcycleId) : null;
        const motorcyclePlate = motorcycleInfo?.plateNumber?.toLowerCase() || "";
        const jobOrderId = jo.id.toLowerCase();
        
        return customerName?.includes(lowerSearchTerm) ||
               motorcyclePlate.includes(lowerSearchTerm) ||
               jobOrderId.includes(lowerSearchTerm);
      });
    }
    return filtered;
  }, [allJobOrders, searchTerm, statusFilter, customerMap, motorcycleMap]);
  
  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><p>Loading job orders...</p></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <ClipboardList className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-2xl">Job Orders</CardTitle>
            </div>
            <CardDescription>Manage all workshop job orders for services and repairs.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-auto md:w-48">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search ID, Customer, Plate..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as JobOrderStatus | "ALL")}>
              <SelectTrigger className="w-full sm:w-auto md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {JOB_ORDER_STATUS_OPTIONS.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/dashboard/job-orders/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Job Order
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredJobOrders.length > 0 ? (
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
                {filteredJobOrders.map((jo) => (
                  <TableRow key={jo.id}>
                    <TableCell className="font-medium">{`#${jo.id.substring(0,6)}`}</TableCell>
                    <TableCell>{jo.customerId ? customerMap.get(jo.customerId) || "N/A" : "N/A"}</TableCell>
                    <TableCell>
                        {jo.motorcycleId 
                            ? `${motorcycleMap.get(jo.motorcycleId)?.make} ${motorcycleMap.get(jo.motorcycleId)?.model} (${motorcycleMap.get(jo.motorcycleId)?.plateNumber || 'N/A'})`
                            : "N/A"
                        }
                    </TableCell>
                    <TableCell><Badge variant={jo.status === JOB_ORDER_STATUSES.COMPLETED ? "default" : "secondary"}>{jo.status}</Badge></TableCell>
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
                <p className="text-lg">{searchTerm || statusFilter !== "ALL" ? "No job orders match your criteria." : "No job orders found."}</p>
                {!(searchTerm || statusFilter !== "ALL") && <p>Get started by creating a new job order.</p>}
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
              Stock levels for any parts used will be readjusted. Associated payment records will also be removed.
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


