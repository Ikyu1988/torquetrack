
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Receipt, Pencil, Trash2, Eye, Search } from "lucide-react";
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
import type { PurchaseOrder, Supplier, ShopSettings, PurchaseOrderStatus, PurchaseOrderItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { PURCHASE_ORDER_STATUSES, PURCHASE_ORDER_STATUS_OPTIONS, PURCHASE_REQUISITION_STATUSES } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const initialPurchaseOrders: PurchaseOrder[] = [
  {
    id: "po1",
    supplierId: "sup1",
    orderDate: new Date(new Date().setDate(new Date().getDate() - 3)),
    expectedDeliveryDate: new Date(new Date().setDate(new Date().getDate() + 7)),
    items: [
      { id: "poi1", partId: "part1", partName: "Spark Plug NGK-CR8E", description: "Spark Plug NGK-CR8E", quantity: 50, unitPrice: 8.00, totalPrice: 400.00 },
    ],
    subTotal: 400.00,
    taxAmount: 48.00,
    grandTotal: 448.00,
    status: PURCHASE_ORDER_STATUSES.APPROVED,
    createdAt: new Date(new Date().setDate(new Date().getDate() - 3)),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 3)),
    createdByUserId: "user123",
  },
];

if (typeof window !== 'undefined') {
  if (!(window as any).__purchaseOrderStore) {
    (window as any).__purchaseOrderStore = {
      purchaseOrders: [...initialPurchaseOrders],
      addPurchaseOrder: (poData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt' | 'subTotal' | 'grandTotal' >) => {
        const subTotal = poData.items.reduce((sum, item: PurchaseOrderItem) => sum + item.totalPrice, 0);
        const taxAmount = poData.taxAmount !== undefined ? poData.taxAmount : (subTotal * 0.10); // Example tax
        const grandTotal = subTotal + taxAmount + (poData.shippingCost || 0);

        const newPurchaseOrder: PurchaseOrder = {
          ...poData,
          id: String(Date.now() + Math.random()),
          subTotal,
          taxAmount,
          grandTotal,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        (window as any).__purchaseOrderStore.purchaseOrders.push(newPurchaseOrder);
        if (newPurchaseOrder.purchaseRequisitionId && (window as any).__purchaseRequisitionStore) {
            const req = (window as any).__purchaseRequisitionStore.getRequisitionById(newPurchaseOrder.purchaseRequisitionId);
            if (req) {
                req.status = PURCHASE_REQUISITION_STATUSES.ORDERED as any; 
                (window as any).__purchaseRequisitionStore.updateRequisition(req);
            }
        }
        return newPurchaseOrder;
      },
      updatePurchaseOrder: (updatedPO: PurchaseOrder) => {
        const index = (window as any).__purchaseOrderStore.purchaseOrders.findIndex((po: PurchaseOrder) => po.id === updatedPO.id);
        if (index !== -1) {
           const subTotal = updatedPO.items.reduce((sum, item: PurchaseOrderItem) => sum + item.totalPrice, 0);
           const taxAmount = updatedPO.taxAmount !== undefined ? updatedPO.taxAmount : (subTotal * 0.10); // Example tax
           const grandTotal = subTotal + taxAmount + (updatedPO.shippingCost || 0);

          (window as any).__purchaseOrderStore.purchaseOrders[index] = {
            ...updatedPO,
            subTotal,
            taxAmount,
            grandTotal,
            updatedAt: new Date()
        };
          return true;
        }
        return false;
      },
      deletePurchaseOrder: (purchaseOrderId: string) => {
        (window as any).__purchaseOrderStore.purchaseOrders = (window as any).__purchaseOrderStore.purchaseOrders.filter((po: PurchaseOrder) => po.id !== purchaseOrderId);
        return true;
      },
      getPurchaseOrderById: (purchaseOrderId: string) => {
        return (window as any).__purchaseOrderStore.purchaseOrders.find((po: PurchaseOrder) => po.id === purchaseOrderId);
      }
    };
  } else {
      if ((window as any).__purchaseOrderStore && (!(window as any).__purchaseOrderStore.purchaseOrders || (window as any).__purchaseOrderStore.purchaseOrders.length === 0)) {
        (window as any).__purchaseOrderStore.purchaseOrders = [...initialPurchaseOrders];
    }
  }
}

export default function PurchaseOrdersPage() {
  const { toast } = useToast();
  const [allPurchaseOrders, setAllPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PurchaseOrderStatus | "ALL">("ALL");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [poToDelete, setPoToDelete] = useState<PurchaseOrder | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const currency = useMemo(() => shopSettings?.currencySymbol || '₱', [shopSettings]);

  const supplierMap = useMemo(() => {
    const map = new Map<string, string>();
    suppliers.forEach(s => map.set(s.id, s.name));
    return map;
  }, [suppliers]);

  const refreshPurchaseOrders = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).__purchaseOrderStore) {
      const storePOs = (window as any).__purchaseOrderStore.purchaseOrders;
      setAllPurchaseOrders(prevPOs => {
        if (JSON.stringify(storePOs) !== JSON.stringify(prevPOs)) {
          return [...storePOs];
        }
        return prevPOs;
      });
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      if ((window as any).__purchaseOrderStore) {
        const storePOs = (window as any).__purchaseOrderStore.purchaseOrders;
        if (storePOs && storePOs.length > 0) {
            setAllPurchaseOrders([...storePOs]);
        } else if (initialPurchaseOrders.length > 0 && (!storePOs || storePOs.length === 0)) {
            (window as any).__purchaseOrderStore.purchaseOrders = [...initialPurchaseOrders];
            setAllPurchaseOrders([...initialPurchaseOrders]);
        }
      }
      if ((window as any).__supplierStore) {
        setSuppliers([...((window as any).__supplierStore.suppliers || [])]);
      }
      if ((window as any).__settingsStore) {
        setShopSettings((window as any).__settingsStore.getSettings());
      }
    }
  }, []);


  useEffect(() => {
    if (!isMounted) return;
    const interval = setInterval(() => {
      refreshPurchaseOrders();
    }, 1000);
    return () => clearInterval(interval);
  }, [isMounted, refreshPurchaseOrders]);

  const handleDeletePurchaseOrder = (po: PurchaseOrder) => {
    if (po.status === PURCHASE_ORDER_STATUSES.FULLY_RECEIVED || po.status === PURCHASE_ORDER_STATUSES.PARTIALLY_RECEIVED) {
         toast({ title: "Cannot Delete", description: "This PO has received items and cannot be deleted directly. Consider cancelling or closing.", variant: "destructive"});
        return;
    }
    setPoToDelete(po);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (poToDelete) {
      if (typeof window !== 'undefined' && (window as any).__purchaseOrderStore) {
        (window as any).__purchaseOrderStore.deletePurchaseOrder(poToDelete.id);
        refreshPurchaseOrders();
        toast({
          title: "Purchase Order Deleted",
          description: `PO #${poToDelete.id.substring(0,6)} has been successfully deleted.`,
        });
      }
    }
    setShowDeleteDialog(false);
    setPoToDelete(null);
  };

  const filteredPurchaseOrders = useMemo(() => {
    let filtered = allPurchaseOrders;
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(po => po.status === statusFilter);
    }
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(po =>
        po.id.toLowerCase().includes(lowerSearchTerm) ||
        (supplierMap.get(po.supplierId)?.toLowerCase() || "").includes(lowerSearchTerm)
      );
    }
    return filtered;
  }, [allPurchaseOrders, searchTerm, statusFilter, supplierMap]);

  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><p>Loading purchase orders...</p></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Receipt className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-2xl">Purchase Orders</CardTitle>
            </div>
            <CardDescription>Manage orders placed with your suppliers.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
             <div className="relative w-full sm:w-auto md:w-48">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search PO ID, Supplier..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PurchaseOrderStatus | "ALL")}>
              <SelectTrigger className="w-full sm:w-auto md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {PURCHASE_ORDER_STATUS_OPTIONS.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/dashboard/purchase-orders/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Create New PO
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredPurchaseOrders.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO ID</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Order Date</TableHead>
                  <TableHead>Expected Delivery</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPurchaseOrders.map((po) => (
                  <TableRow key={po.id}>
                    <TableCell className="font-medium">{`#${po.id.substring(0,6)}`}</TableCell>
                    <TableCell>{supplierMap.get(po.supplierId) || "N/A"}</TableCell>
                    <TableCell><Badge variant={po.status === PURCHASE_ORDER_STATUSES.FULLY_RECEIVED || po.status === PURCHASE_ORDER_STATUSES.CLOSED ? "default" : "secondary"}>{po.status}</Badge></TableCell>
                    <TableCell>{format(new Date(po.orderDate), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{po.expectedDeliveryDate ? format(new Date(po.expectedDeliveryDate), "MMM dd, yyyy") : "-"}</TableCell>
                    <TableCell className="text-right">{currency}{(po.grandTotal || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" asChild className="hover:text-primary">
                        <Link href={`/dashboard/purchase-orders/${po.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Link>
                      </Button>
                      {po.status !== PURCHASE_ORDER_STATUSES.FULLY_RECEIVED && po.status !== PURCHASE_ORDER_STATUSES.CLOSED && (
                        <Button variant="ghost" size="icon" asChild className="hover:text-primary">
                            <Link href={`/dashboard/purchase-orders/${po.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                            </Link>
                        </Button>
                       )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hover:text-destructive"
                        onClick={() => handleDeletePurchaseOrder(po)}
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
                <Receipt className="h-16 w-16" />
                <p className="text-lg">{searchTerm || statusFilter !== "ALL" ? "No POs match your criteria." : "No purchase orders found."}</p>
                 {!(searchTerm || statusFilter !== "ALL") && <p>Get started by creating a new purchase order.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete Purchase Order #{poToDelete?.id.substring(0,6)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPoToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

