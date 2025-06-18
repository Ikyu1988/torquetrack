
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, FilePlus, Pencil, Trash2, Eye, Search } from "lucide-react";
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
import type { PurchaseRequisition, ShopSettings } from "@/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { PURCHASE_REQUISITION_STATUSES, PURCHASE_REQUISITION_STATUS_OPTIONS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const initialRequisitions: PurchaseRequisition[] = [
  {
    id: "pr1",
    requestedByUserId: "user123", 
    status: PURCHASE_REQUISITION_STATUSES.PENDING_APPROVAL,
    items: [
      { id: "pri1", description: "Bulk Spark Plugs NGK BKR6E", quantity: 100, estimatedPricePerUnit: 10 },
      { id: "pri2", description: "Shop Towels (Case of 500)", quantity: 5 },
    ],
    totalEstimatedValue: 1100, 
    submittedDate: new Date(new Date().setDate(new Date().getDate() - 2)),
    createdAt: new Date(new Date().setDate(new Date().getDate() - 2)),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 2)),
  },
  {
    id: "pr2",
    requestedByUserId: "user456",
    status: PURCHASE_REQUISITION_STATUSES.APPROVED,
    items: [{ id: "pri3", partId: "part2", description: "Oil Filter Hiflo HF204", quantity: 20, estimatedPricePerUnit: 12.50 }],
    totalEstimatedValue: 250,
    submittedDate: new Date(new Date().setDate(new Date().getDate() - 5)),
    approvedDate: new Date(new Date().setDate(new Date().getDate() - 4)),
    approvedByUserId: "adminUser",
    createdAt: new Date(new Date().setDate(new Date().getDate() - 5)),
    updatedAt: new Date(new Date().setDate(new Date().getDate() - 4)),
  },
];

if (typeof window !== 'undefined') {
  if (!(window as any).__purchaseRequisitionStore) {
    (window as any).__purchaseRequisitionStore = {
      requisitions: [...initialRequisitions],
      addRequisition: (requisition: Omit<PurchaseRequisition, 'id' | 'createdAt' | 'updatedAt' | 'totalEstimatedValue' | 'submittedDate'>) => {
        const totalValue = requisition.items.reduce((sum, item) => sum + (item.quantity * (item.estimatedPricePerUnit || 0)), 0);
        const newRequisition: PurchaseRequisition = {
          ...requisition,
          id: String(Date.now() + Math.random()),
          submittedDate: new Date(),
          totalEstimatedValue: totalValue,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        (window as any).__purchaseRequisitionStore.requisitions.push(newRequisition);
        return newRequisition;
      },
      updateRequisition: (updatedRequisition: PurchaseRequisition) => {
        const index = (window as any).__purchaseRequisitionStore.requisitions.findIndex((r: PurchaseRequisition) => r.id === updatedRequisition.id);
        if (index !== -1) {
          const totalValue = updatedRequisition.items.reduce((sum, item) => sum + (item.quantity * (item.estimatedPricePerUnit || 0)), 0);
          (window as any).__purchaseRequisitionStore.requisitions[index] = { 
            ...updatedRequisition, 
            totalEstimatedValue: totalValue,
            updatedAt: new Date() 
          };
          return true;
        }
        return false;
      },
      deleteRequisition: (requisitionId: string) => {
        (window as any).__purchaseRequisitionStore.requisitions = (window as any).__purchaseRequisitionStore.requisitions.filter((r: PurchaseRequisition) => r.id !== requisitionId);
        return true;
      },
      getRequisitionById: (requisitionId: string) => {
        return (window as any).__purchaseRequisitionStore.requisitions.find((r: PurchaseRequisition) => r.id === requisitionId);
      }
    };
  }
}

export default function PurchaseRequisitionsPage() {
  const { toast } = useToast();
  const [allRequisitions, setAllRequisitions] = useState<PurchaseRequisition[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<PurchaseRequisitionStatus | "ALL">("ALL");
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [requisitionToDelete, setRequisitionToDelete] = useState<PurchaseRequisition | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const currency = useMemo(() => shopSettings?.currencySymbol || '₱', [shopSettings]);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      if ((window as any).__purchaseRequisitionStore) {
        setAllRequisitions([...(window as any).__purchaseRequisitionStore.requisitions]);
      }
       if ((window as any).__settingsStore) {
        setShopSettings((window as any).__settingsStore.getSettings());
      }
    }
  }, []);

  const refreshRequisitions = () => {
    if (typeof window !== 'undefined' && (window as any).__purchaseRequisitionStore) {
      setAllRequisitions([...(window as any).__purchaseRequisitionStore.requisitions]);
    }
  };

  useEffect(() => {
    if (!isMounted) return;
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).__purchaseRequisitionStore) {
        const storeRequisitions = (window as any).__purchaseRequisitionStore.requisitions;
        if (JSON.stringify(storeRequisitions) !== JSON.stringify(allRequisitions)) {
          refreshRequisitions();
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [allRequisitions, isMounted]);

  const handleDeleteRequisition = (requisition: PurchaseRequisition) => {
    if (requisition.status === PURCHASE_REQUISITION_STATUSES.ORDERED) {
        toast({ title: "Cannot Delete", description: "This requisition has already been ordered and cannot be deleted.", variant: "destructive"});
        return;
    }
    setRequisitionToDelete(requisition);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (requisitionToDelete) {
      if (typeof window !== 'undefined' && (window as any).__purchaseRequisitionStore) {
        (window as any).__purchaseRequisitionStore.deleteRequisition(requisitionToDelete.id);
        refreshRequisitions();
        toast({
          title: "Requisition Deleted",
          description: `Purchase Requisition #${requisitionToDelete.id.substring(0,6)} has been successfully deleted.`,
        });
      }
    }
    setShowDeleteDialog(false);
    setRequisitionToDelete(null);
  };
  
  const filteredRequisitions = useMemo(() => {
    let filtered = allRequisitions;
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(req => req.status === statusFilter);
    }
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(req =>
        req.id.toLowerCase().includes(lowerSearchTerm) ||
        (req.requestedByUserId && req.requestedByUserId.toLowerCase().includes(lowerSearchTerm)) ||
        (req.department && req.department.toLowerCase().includes(lowerSearchTerm)) ||
        req.items.some(item => item.description.toLowerCase().includes(lowerSearchTerm) || (item.partName && item.partName.toLowerCase().includes(lowerSearchTerm)))
      );
    }
    return filtered;
  }, [allRequisitions, searchTerm, statusFilter]);

  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><p>Loading purchase requisitions...</p></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <FilePlus className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-2xl">Purchase Requisitions</CardTitle>
            </div>
            <CardDescription>Manage internal requests for parts and supplies.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-auto md:w-48">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search requisitions..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as PurchaseRequisitionStatus | "ALL")}>
              <SelectTrigger className="w-full sm:w-auto md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {PURCHASE_REQUISITION_STATUS_OPTIONS.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/dashboard/purchase-requisitions/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Requisition
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRequisitions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Req. ID</TableHead>
                  <TableHead>Requested By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead className="text-right">Est. Value</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequisitions.map((req) => (
                  <TableRow key={req.id}>
                    <TableCell className="font-medium">{`#${req.id.substring(0,6)}`}</TableCell>
                    <TableCell>{req.requestedByUserId || "N/A"}</TableCell>
                    <TableCell><Badge variant={req.status === PURCHASE_REQUISITION_STATUSES.APPROVED ? "default" : "secondary"}>{req.status}</Badge></TableCell>
                    <TableCell>{req.items.length}</TableCell>
                    <TableCell className="text-right">{currency}{(req.totalEstimatedValue || 0).toFixed(2)}</TableCell>
                    <TableCell>{format(new Date(req.submittedDate), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" asChild className="hover:text-primary">
                        <Link href={`/dashboard/purchase-requisitions/${req.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Link>
                      </Button>
                      {req.status !== PURCHASE_REQUISITION_STATUSES.ORDERED && (
                        <Button variant="ghost" size="icon" asChild className="hover:text-primary">
                            <Link href={`/dashboard/purchase-requisitions/${req.id}/edit`}>
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                            </Link>
                        </Button>
                       )}
                      {req.status !== PURCHASE_REQUISITION_STATUSES.ORDERED && (
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            className="hover:text-destructive"
                            onClick={() => handleDeleteRequisition(req)}
                        >
                            <Trash2 className="h-4 w-4" />
                            <span className="sr-only">Delete</span>
                        </Button>
                       )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-10 text-muted-foreground">
                <FilePlus className="h-16 w-16" />
                <p className="text-lg">{searchTerm || statusFilter !== "ALL" ? "No requisitions match your criteria." : "No purchase requisitions found."}</p>
                {!(searchTerm || statusFilter !== "ALL") &&  <p>Get started by creating a new requisition.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete Purchase Requisition #{requisitionToDelete?.id.substring(0,6)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRequisitionToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
