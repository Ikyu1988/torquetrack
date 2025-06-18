
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { GoodsReceipt, PurchaseOrder, Supplier, ShopSettings } from "@/types";
import { ArrowLeft, ArchiveRestore, Printer } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function ViewGoodsReceiptPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const receiptId = params.id as string;

  const [receipt, setReceipt] = useState<GoodsReceipt | null>(null);
  const [purchaseOrder, setPurchaseOrder] = useState<PurchaseOrder | null>(null);
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null); 
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const currency = useMemo(() => shopSettings?.currencySymbol || '₱', [shopSettings]);
  
  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      if ((window as any).__settingsStore) setShopSettings((window as any).__settingsStore.getSettings());
    }
  }, []);
  
  useEffect(() => {
    if (receiptId && isMounted) {
      setIsLoading(true);
      let grData: GoodsReceipt | undefined;
      let poData: PurchaseOrder | undefined;
      let supData: Supplier | undefined;

      if (typeof window !== 'undefined') {
        if ((window as any).__goodsReceiptStore) {
            grData = (window as any).__goodsReceiptStore.getGoodsReceiptById(receiptId);
        }
        if (grData && (window as any).__purchaseOrderStore) {
            poData = (window as any).__purchaseOrderStore.getPurchaseOrderById(grData.purchaseOrderId);
        }
        if (grData && (window as any).__supplierStore) {
            supData = (window as any).__supplierStore.getSupplierById(grData.supplierId);
        }
      }

      if (grData) {
        setReceipt(grData);
        setPurchaseOrder(poData || null);
        setSupplier(supData || null);
      } else {
        toast({
          title: "Error",
          description: "Goods Receipt not found.",
          variant: "destructive",
        });
        router.push("/dashboard/goods-receipts");
      }
      setIsLoading(false);
    }
  }, [receiptId, isMounted, router, toast]);

  const DetailItem = ({ label, value, className }: { label:string, value?: string | number | Date | null, className?: string}) => {
    if (value === undefined || value === null || value === '') return null;
    let displayValue: React.ReactNode = value;
    if (value instanceof Date) {
      displayValue = format(value, "PPP p");
    }
    
    return (
      <div className={className}>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{displayValue}</p>
      </div>
    );
  };

  if (!isMounted || isLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading goods receipt details...</p></div>;
  }

  if (!receipt) {
    return <div className="flex justify-center items-center h-screen"><p>Goods Receipt not found.</p></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center mb-4 print:hidden">
        <Button variant="outline" asChild>
          <Link href="/dashboard/goods-receipts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Goods Receipts
          </Link>
        </Button>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            {/* Edit button could be added if GR editing is implemented */}
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ArchiveRestore className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-headline text-3xl">Goods Receipt #{receipt.id.substring(0,6)}</CardTitle>
                <CardDescription>Received on: {format(new Date(receipt.receivedDate), "PPP")}</CardDescription>
              </div>
            </div>
             <div className="text-right">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={receipt.status === "Completed" ? "default" : "secondary"} className="text-lg px-3 py-1">{receipt.status}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <DetailItem label="Purchase Order ID" value={purchaseOrder ? `#${purchaseOrder.id.substring(0,6)}` : 'N/A'} />
            <DetailItem label="Supplier" value={supplier?.name || 'N/A'} />
            <DetailItem label="Received By (User)" value={receipt.receivedByUserId} />
          </div>
          
          <Separator />
          <DetailItem label="Overall Notes" value={receipt.notes} />
          <DetailItem label="Discrepancies Noted" value={receipt.discrepancies} />
          <Separator />

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Received Items</CardTitle>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Part Name</TableHead>
                        <TableHead className="text-center">Qty Ordered</TableHead>
                        <TableHead className="text-center">Qty Received</TableHead>
                        <TableHead>Condition</TableHead>
                        <TableHead>Notes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {receipt.items.map((item) => (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.partName}</TableCell>
                                <TableCell className="text-center">{item.quantityOrdered}</TableCell>
                                <TableCell className="text-center">{item.quantityReceived}</TableCell>
                                <TableCell>{item.condition || "-"}</TableCell>
                                <TableCell className="max-w-xs truncate">{item.notes || "-"}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </CardContent>
        <CardFooter className="text-xs text-muted-foreground print:hidden">
            Last updated: {format(new Date(receipt.updatedAt), "PPP p")}
        </CardFooter>
      </Card>
    </div>
  );
}
