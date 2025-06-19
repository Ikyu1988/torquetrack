
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ArchiveRestore, Eye, Search } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { GoodsReceipt, PurchaseOrder, Supplier, ShopSettings, GoodsReceiptStatus, GoodsReceiptItem } from "@/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { GOODS_RECEIPT_STATUSES, GOODS_RECEIPT_STATUS_OPTIONS } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const initialGoodsReceipts: GoodsReceipt[] = [
    // Example: No initial receipts, users will create them
];

if (typeof window !== 'undefined') {
  if (!(window as any).__goodsReceiptStore) {
    (window as any).__goodsReceiptStore = {
      goodsReceipts: [...initialGoodsReceipts],
      addGoodsReceipt: (receiptData: Omit<GoodsReceipt, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newReceipt: GoodsReceipt = {
          ...receiptData,
          id: String(Date.now() + Math.random()),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        (window as any).__goodsReceiptStore.goodsReceipts.push(newReceipt);

        if ((window as any).__inventoryStore && newReceipt.status === GOODS_RECEIPT_STATUSES.COMPLETED) {
          newReceipt.items.forEach((item: GoodsReceiptItem) => {
            const part = (window as any).__inventoryStore.getPartById(item.partId);
            if (part) {
              part.stockQuantity += item.quantityReceived;
              (window as any).__inventoryStore.updatePart(part);
            }
          });
        }
        return newReceipt;
      },
      updateGoodsReceipt: (updatedReceipt: GoodsReceipt) => {
        const index = (window as any).__goodsReceiptStore.goodsReceipts.findIndex((gr: GoodsReceipt) => gr.id === updatedReceipt.id);
        if (index !== -1) {
          const oldReceipt = (window as any).__goodsReceiptStore.goodsReceipts[index];
          (window as any).__goodsReceiptStore.goodsReceipts[index] = { ...updatedReceipt, updatedAt: new Date() };
          
          if (oldReceipt.status !== GOODS_RECEIPT_STATUSES.COMPLETED && updatedReceipt.status === GOODS_RECEIPT_STATUSES.COMPLETED) {
             if ((window as any).__inventoryStore) {
                updatedReceipt.items.forEach((item: GoodsReceiptItem) => {
                    const part = (window as any).__inventoryStore.getPartById(item.partId);
                    if (part) {
                    part.stockQuantity += item.quantityReceived; 
                    (window as any).__inventoryStore.updatePart(part);
                    }
                });
            }
          } else if (oldReceipt.status === GOODS_RECEIPT_STATUSES.COMPLETED && updatedReceipt.status !== GOODS_RECEIPT_STATUSES.COMPLETED) {
            // Stock reversion logic would be complex and potentially error-prone for a mock store.
            // For a real app, this would need careful handling (e.g., audit logs, preventing reversal if stock is used).
          }
          return true;
        }
        return false;
      },
      getGoodsReceiptById: (receiptId: string) => {
        return (window as any).__goodsReceiptStore.goodsReceipts.find((gr: GoodsReceipt) => gr.id === receiptId);
      },
      getGoodsReceiptsByPOId: (poId: string) => {
        return (window as any).__goodsReceiptStore.goodsReceipts.filter((gr: GoodsReceipt) => gr.purchaseOrderId === poId);
      }
    };
  } else {
     if ((window as any).__goodsReceiptStore && (!(window as any).__goodsReceiptStore.goodsReceipts || (window as any).__goodsReceiptStore.goodsReceipts.length === 0)) {
        (window as any).__goodsReceiptStore.goodsReceipts = [...initialGoodsReceipts];
    }
  }
}

export default function GoodsReceiptsPage() {
  const { toast } = useToast();
  const [allGoodsReceipts, setAllGoodsReceipts] = useState<GoodsReceipt[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<GoodsReceiptStatus | "ALL">("ALL");
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  
  const supplierMap = useMemo(() => {
    const map = new Map<string, string>();
    suppliers.forEach(s => map.set(s.id, s.name));
    return map;
  }, [suppliers]);

  const refreshGoodsReceipts = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).__goodsReceiptStore) {
      const storeGRs = (window as any).__goodsReceiptStore.goodsReceipts;
      setAllGoodsReceipts(prevGRs => {
        if (JSON.stringify(storeGRs) !== JSON.stringify(prevGRs)) {
          return [...storeGRs];
        }
        return prevGRs;
      });
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      if ((window as any).__goodsReceiptStore) {
        const storeGRs = (window as any).__goodsReceiptStore.goodsReceipts;
         if (storeGRs && storeGRs.length > 0) {
            setAllGoodsReceipts([...storeGRs]);
        } else if (initialGoodsReceipts.length > 0 && (!storeGRs || storeGRs.length === 0)) {
            (window as any).__goodsReceiptStore.goodsReceipts = [...initialGoodsReceipts];
            setAllGoodsReceipts([...initialGoodsReceipts]);
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
      refreshGoodsReceipts();
    }, 1000);
    return () => clearInterval(interval);
  }, [isMounted, refreshGoodsReceipts]);
  
  const filteredGoodsReceipts = useMemo(() => {
    let filtered = allGoodsReceipts;
    if (statusFilter !== "ALL") {
      filtered = filtered.filter(gr => gr.status === statusFilter);
    }
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filtered = filtered.filter(gr =>
        gr.id.toLowerCase().includes(lowerSearchTerm) ||
        gr.purchaseOrderId.toLowerCase().includes(lowerSearchTerm) ||
        (supplierMap.get(gr.supplierId)?.toLowerCase() || "").includes(lowerSearchTerm)
      );
    }
    return filtered;
  }, [allGoodsReceipts, searchTerm, statusFilter, supplierMap]);

  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><p>Loading goods receipts...</p></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <ArchiveRestore className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-2xl">Goods Receipts</CardTitle>
            </div>
            <CardDescription>Record and manage received items from suppliers.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full sm:w-auto md:w-48">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search GR ID, PO ID, Supplier..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as GoodsReceiptStatus | "ALL")}>
              <SelectTrigger className="w-full sm:w-auto md:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                {GOODS_RECEIPT_STATUS_OPTIONS.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/dashboard/goods-receipts/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Create New Goods Receipt
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredGoodsReceipts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Receipt ID</TableHead>
                  <TableHead>PO ID</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Received Date</TableHead>
                  <TableHead>Items Received</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredGoodsReceipts.map((gr) => (
                  <TableRow key={gr.id}>
                    <TableCell className="font-medium">{`#${gr.id.substring(0,6)}`}</TableCell>
                    <TableCell>{`#${gr.purchaseOrderId.substring(0,6)}`}</TableCell>
                    <TableCell>{supplierMap.get(gr.supplierId) || "N/A"}</TableCell>
                    <TableCell><Badge variant={gr.status === GOODS_RECEIPT_STATUSES.COMPLETED ? "default" : "secondary"}>{gr.status}</Badge></TableCell>
                    <TableCell>{format(new Date(gr.receivedDate), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{gr.items.reduce((sum, item: GoodsReceiptItem) => sum + item.quantityReceived, 0)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" asChild className="hover:text-primary">
                        <Link href={`/dashboard/goods-receipts/${gr.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-10 text-muted-foreground">
                <ArchiveRestore className="h-16 w-16" />
                <p className="text-lg">{searchTerm || statusFilter !== "ALL" ? "No receipts match your criteria." : "No goods receipts found."}</p>
                {!(searchTerm || statusFilter !== "ALL") && <p>Get started by creating a new goods receipt (usually from a Purchase Order).</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

