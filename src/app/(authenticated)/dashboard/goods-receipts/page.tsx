
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, ArchiveRestore, Eye } from "lucide-react";
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
import type { GoodsReceipt, PurchaseOrder, Supplier, ShopSettings } from "@/types";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { GOODS_RECEIPT_STATUSES } from "@/lib/constants";

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

        // Update inventory store
        if ((window as any).__inventoryStore && newReceipt.status === GOODS_RECEIPT_STATUSES.COMPLETED) {
          newReceipt.items.forEach(item => {
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
          
          // Adjust inventory if status changed to/from completed
          if (oldReceipt.status !== GOODS_RECEIPT_STATUSES.COMPLETED && updatedReceipt.status === GOODS_RECEIPT_STATUSES.COMPLETED) {
             if ((window as any).__inventoryStore) {
                updatedReceipt.items.forEach(item => {
                    const part = (window as any).__inventoryStore.getPartById(item.partId);
                    if (part) {
                    part.stockQuantity += item.quantityReceived; // Assuming quantityReceived is the final amount
                    (window as any).__inventoryStore.updatePart(part);
                    }
                });
            }
          } else if (oldReceipt.status === GOODS_RECEIPT_STATUSES.COMPLETED && updatedReceipt.status !== GOODS_RECEIPT_STATUSES.COMPLETED) {
            // Revert stock (this is complex, ideally handled by distinct stock adjustment transaction)
            // For simplicity, this prototype might not fully implement stock reversal on status change away from COMPLETED
            console.warn("Reverting stock due to Goods Receipt status change is not fully implemented for this prototype.");
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
  }
}

export default function GoodsReceiptsPage() {
  const { toast } = useToast();
  const [goodsReceipts, setGoodsReceipts] = useState<GoodsReceipt[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const currency = useMemo(() => shopSettings?.currencySymbol || '₱', [shopSettings]);
  
  const supplierMap = useMemo(() => {
    const map = new Map<string, string>();
    suppliers.forEach(s => map.set(s.id, s.name));
    return map;
  }, [suppliers]);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      if ((window as any).__goodsReceiptStore) {
        setGoodsReceipts([...(window as any).__goodsReceiptStore.goodsReceipts]);
      }
      if ((window as any).__supplierStore) {
        setSuppliers([...(window as any).__supplierStore.suppliers]);
      }
      if ((window as any).__settingsStore) {
        setShopSettings((window as any).__settingsStore.getSettings());
      }
    }
  }, []);

  const refreshGoodsReceipts = () => {
    if (typeof window !== 'undefined' && (window as any).__goodsReceiptStore) {
      setGoodsReceipts([...(window as any).__goodsReceiptStore.goodsReceipts]);
    }
  };

  useEffect(() => {
    if (!isMounted) return;
    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).__goodsReceiptStore) {
        const storeGRs = (window as any).__goodsReceiptStore.goodsReceipts;
        if (JSON.stringify(storeGRs) !== JSON.stringify(goodsReceipts)) {
          refreshGoodsReceipts();
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [goodsReceipts, isMounted]);
  
  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><p>Loading goods receipts...</p></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <ArchiveRestore className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-2xl">Goods Receipts</CardTitle>
            </div>
            <CardDescription>Record and manage received items from suppliers.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/dashboard/goods-receipts/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Goods Receipt
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {goodsReceipts.length > 0 ? (
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
                {goodsReceipts.map((gr) => (
                  <TableRow key={gr.id}>
                    <TableCell className="font-medium">{`#${gr.id.substring(0,6)}`}</TableCell>
                    <TableCell>{`#${gr.purchaseOrderId.substring(0,6)}`}</TableCell>
                    <TableCell>{supplierMap.get(gr.supplierId) || "N/A"}</TableCell>
                    <TableCell><Badge variant={gr.status === GOODS_RECEIPT_STATUSES.COMPLETED ? "default" : "secondary"}>{gr.status}</Badge></TableCell>
                    <TableCell>{format(new Date(gr.receivedDate), "MMM dd, yyyy")}</TableCell>
                    <TableCell>{gr.items.reduce((sum, item) => sum + item.quantityReceived, 0)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" asChild className="hover:text-primary">
                        <Link href={`/dashboard/goods-receipts/${gr.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View</span>
                        </Link>
                      </Button>
                      {/* Edit/Delete for Goods Receipts might be complex depending on inventory impact */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-10 text-muted-foreground">
                <ArchiveRestore className="h-16 w-16" />
                <p className="text-lg">No goods receipts found.</p>
                <p>Get started by creating a new goods receipt (usually from a Purchase Order).</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
