
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { PurchaseRequisition, ShopSettings, Part } from "@/types";
import { ArrowLeft, FilePlus, Edit, Printer, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PURCHASE_REQUISITION_STATUSES } from "@/lib/constants";

export default function ViewPurchaseRequisitionPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const requisitionId = params.id as string;

  const [requisition, setRequisition] = useState<PurchaseRequisition | null>(null);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null); 
  const [availableParts, setAvailableParts] = useState<Part[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const currency = useMemo(() => shopSettings?.currencySymbol || '₱', [shopSettings]);
  
  const partMap = useMemo(() => {
    const map = new Map<string, Part>();
    availableParts.forEach(p => map.set(p.id, p));
    return map;
  }, [availableParts]);


  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      if ((window as any).__settingsStore) setShopSettings((window as any).__settingsStore.getSettings());
      if ((window as any).__inventoryStore) setAvailableParts((window as any).__inventoryStore.parts || []);
    }
  }, []);
  
  useEffect(() => {
    if (requisitionId && isMounted) {
      setIsLoading(true);
      let reqData: PurchaseRequisition | undefined;
      if (typeof window !== 'undefined' && (window as any).__purchaseRequisitionStore) {
        reqData = (window as any).__purchaseRequisitionStore.getRequisitionById(requisitionId);
      }

      if (reqData) {
        setRequisition(reqData);
      } else {
        toast({
          title: "Error",
          description: "Purchase Requisition not found.",
          variant: "destructive",
        });
        router.push("/dashboard/purchase-requisitions");
      }
      setIsLoading(false);
    }
  }, [requisitionId, isMounted, router, toast]);

  const DetailItem = ({ label, value, className, isBadge = false, badgeVariant = "secondary" }: { label:string, value?: string | number | Date | null, className?: string, isBadge?:boolean, badgeVariant?: "default" | "secondary" | "destructive" | "outline" | null | undefined }) => {
    if (value === undefined || value === null || value === '') return null;
    
    let finalDisplayValue: React.ReactNode;

    if (value instanceof Date) {
      finalDisplayValue = format(value, "PPP p");
    } else if (typeof value === 'number' && (label.toLowerCase().includes('value') || label.toLowerCase().includes('price'))){
        finalDisplayValue = `${currency}${value.toFixed(2)}`;
    } else {
        finalDisplayValue = value; 
    }

    if (isBadge && typeof finalDisplayValue === 'string') { 
        finalDisplayValue = <Badge variant={badgeVariant}>{finalDisplayValue}</Badge>;
    }
    
    return (
      <div className={className}>
        <p className="text-sm text-muted-foreground">{label}</p>
        {typeof finalDisplayValue === 'string' || typeof finalDisplayValue === 'number' ? (
          <p className="font-medium">{finalDisplayValue}</p>
        ) : (
          finalDisplayValue
        )}
      </div>
    );
  };

  if (!isMounted || isLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading requisition details...</p></div>;
  }

  if (!requisition) {
    return <div className="flex justify-center items-center h-screen"><p>Requisition not found.</p></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center mb-4 print:hidden">
        <Button variant="outline" asChild>
          <Link href="/dashboard/purchase-requisitions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Requisitions
          </Link>
        </Button>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            {requisition.status === PURCHASE_REQUISITION_STATUSES.APPROVED && (
                 <Button asChild>
                    <Link href={`/dashboard/purchase-orders/new?requisitionId=${requisition.id}`}>
                        <ShoppingCart className="mr-2 h-4 w-4" /> Create Purchase Order
                    </Link>
                </Button>
            )}
            {requisition.status !== PURCHASE_REQUISITION_STATUSES.ORDERED && (
                <Button asChild>
                    <Link href={`/dashboard/purchase-requisitions/${requisition.id}/edit`}>
                        <Edit className="mr-2 h-4 w-4" /> Edit Requisition
                    </Link>
                </Button>
            )}
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FilePlus className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-headline text-3xl">Purchase Requisition #{requisition.id.substring(0,6)}</CardTitle>
                <CardDescription>Submitted on: {format(new Date(requisition.submittedDate), "PPP")}</CardDescription>
              </div>
            </div>
             <div className="text-right">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={requisition.status === PURCHASE_REQUISITION_STATUSES.APPROVED ? "default" : "secondary"} className="text-lg px-3 py-1">{requisition.status}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DetailItem label="Requested By" value={requisition.requestedByUserId} />
            <DetailItem label="Department" value={requisition.department} />
            {requisition.status === PURCHASE_REQUISITION_STATUSES.APPROVED && (
                <>
                    <DetailItem label="Approved By" value={requisition.approvedByUserId} />
                    <DetailItem label="Approved Date" value={requisition.approvedDate ? format(new Date(requisition.approvedDate), "PPP") : 'N/A'} />
                </>
            )}
            {requisition.status === PURCHASE_REQUISITION_STATUSES.REJECTED && (
                 <DetailItem label="Rejected Date" value={requisition.updatedAt ? format(new Date(requisition.updatedAt), "PPP") : 'N/A'} />
            )}
          </div>
          
          <Separator />
          <DetailItem label="Overall Notes / Justification" value={requisition.notes} />
          <Separator />

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Requested Items</CardTitle>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Item Description</TableHead>
                        <TableHead>Existing Part (SKU)</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Est. Price/Unit</TableHead>
                        <TableHead className="text-right">Est. Total</TableHead>
                        <TableHead>Notes</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requisition.items.map((item) => {
                            const partDetails = item.partId ? partMap.get(item.partId) : null;
                            const estimatedTotal = (item.quantity || 0) * (item.estimatedPricePerUnit || 0);
                            return (
                            <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.description}</TableCell>
                                <TableCell>{partDetails ? `${partDetails.name} (${partDetails.sku || 'N/A'})` : (item.partName || 'New Item')}</TableCell>
                                <TableCell className="text-center">{item.quantity}</TableCell>
                                <TableCell className="text-right">{currency}{(item.estimatedPricePerUnit || 0).toFixed(2)}</TableCell>
                                <TableCell className="text-right">{currency}{estimatedTotal.toFixed(2)}</TableCell>
                                <TableCell className="max-w-xs truncate">{item.notes || "-"}</TableCell>
                            </TableRow>
                        );
                        })}
                    </TableBody>
                    </Table>
                </CardContent>
            </Card>
          
          <Separator />
          
          <div className="flex justify-end">
            <div className="text-right space-y-1">
                <p className="text-md text-muted-foreground">Total Estimated Value:</p>
                <p className="text-2xl font-bold text-primary">{currency}{(requisition.totalEstimatedValue || 0).toFixed(2)}</p>
            </div>
          </div>

        </CardContent>
        <CardFooter className="text-xs text-muted-foreground print:hidden">
            Last updated: {format(new Date(requisition.updatedAt), "PPP p")}
        </CardFooter>
      </Card>
    </div>
  );
}
