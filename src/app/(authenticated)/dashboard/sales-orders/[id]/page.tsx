
"use client";

import { Button } from "../../../../../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../../../components/ui/card";
import { useToast } from "../../../../../hooks/use-toast";
import type { SalesOrder, Customer, ShopSettings, Payment, PaymentMethod } from "../../../../../types";
import { ArrowLeft, ShoppingCart, Edit, Printer, Send, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { Badge } from "../../../../../components/ui/badge";
import { Separator } from "../../../../../components/ui/separator";
import { cn } from "../../../../../lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../../../../../components/ui/table";
import { SALES_ORDER_STATUSES, PAYMENT_STATUSES } from "../../../../../lib/constants";
import { AddSalesOrderPaymentDialog } from "../../../../../components/dashboard/sales-orders/AddSalesOrderPaymentDialog";

export default function ViewSalesOrderPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const salesOrderId = params.id as string;

  const [salesOrder, setSalesOrder] = useState<SalesOrder | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null); 

  const currency = useMemo(() => shopSettings?.currencySymbol || '₱', [shopSettings]);
  
  const refreshSalesOrderData = useCallback(() => {
    if (salesOrderId && isMounted) {
        let soData: SalesOrder | undefined;
        let custData: Customer | undefined;
        let currentShopSettings: ShopSettings | null = null;

        if (typeof window !== 'undefined') {
            if ((window as any).__salesOrderStore) {
                soData = (window as any).__salesOrderStore.getSalesOrderById(salesOrderId);
            }
            if (soData && soData.customerId && (window as any).__customerStore) {
                custData = (window as any).__customerStore.getCustomerById(soData.customerId);
            }
            if ((window as any).__settingsStore) {
                currentShopSettings = (window as any).__settingsStore.getSettings();
                setShopSettings(currentShopSettings);
            }
        }

        if (soData) {
            setSalesOrder(soData);
            setCustomer(custData || null);
        } else {
            toast({
            title: "Error",
            description: "Sales Order not found.",
            variant: "destructive",
            });
            router.push("/dashboard/direct-sales"); 
        }
    }
  }, [salesOrderId, isMounted, router, toast]);


  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    if (salesOrderId && isMounted) {
      setIsLoading(true);
      refreshSalesOrderData();
      setIsLoading(false);
    }
  }, [salesOrderId, isMounted, refreshSalesOrderData]);

  const handlePaymentAdded = () => {
    refreshSalesOrderData(); 
    toast({
        title: "Payment Added",
        description: "The payment has been successfully recorded for this sales order.",
    });
  };
  

  const DetailItem = ({ label, value, className, isBadge = false, badgeVariant = "secondary" }: { label: string, value?: string | number | Date | null | React.ReactNode, className?: string, isBadge?: boolean, badgeVariant?: "default" | "secondary" | "destructive" | "outline" | null | undefined }) => {
    if (value === undefined || value === null || value === '') return null;
    
    let renderableValue: React.ReactNode;

    if (value instanceof Date) {
      renderableValue = format(value, "PPP p");
    } else if (typeof value === 'number' && (label.toLowerCase().includes('cost') || label.toLowerCase().includes('total') || label.toLowerCase().includes('amount') || label.toLowerCase().includes('balance')) ) {
      renderableValue = `${currency}${value.toFixed(2)}`;
    } else if (React.isValidElement(value) || typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      renderableValue = value;
    } else {
      renderableValue = String(value); // Fallback
    }

    if (isBadge && typeof renderableValue === 'string') {
        renderableValue = <Badge variant={badgeVariant}>{renderableValue}</Badge>;
    }

    return (
      <div className={cn("mb-2 print:mb-1", className)}>
        <p className="text-sm text-muted-foreground print:text-xs">{label}</p>
        {typeof renderableValue === 'string' || typeof renderableValue === 'number'
          ? <p className="font-medium print:text-sm">{renderableValue}</p>
          : renderableValue
        }
      </div>
    );
  };
  
  const balanceDue = useMemo(() => {
    if (!salesOrder) return 0;
    return salesOrder.grandTotal - salesOrder.amountPaid;
  }, [salesOrder]);


  if (!isMounted || isLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading sales order details...</p></div>;
  }

  if (!salesOrder) {
    return <div className="flex justify-center items-center h-screen"><p>Sales Order not found.</p></div>;
  }
  
  const isFullyPaid = salesOrder.paymentStatus === PAYMENT_STATUSES.PAID || balanceDue <= 0.001; 

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center mb-4 print:hidden">
        <Button variant="outline" asChild>
          <Link href="/dashboard/direct-sales">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Sales Orders
          </Link>
        </Button>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            <Button onClick={() => alert("Email functionality is not yet implemented. This would email sales order details to the customer.")}>
                <Send className="mr-2 h-4 w-4" /> Email to Customer
            </Button>
            {/* <Button asChild>
                <Link href={`/dashboard/sales-orders/${salesOrder.id}/edit`}> // Future edit page
                    <Edit className="mr-2 h-4 w-4" /> Edit Sales Order
                </Link>
            </Button> */}
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between print:flex-row print:items-start">
            <div className="flex items-center gap-3">
              <ShoppingCart className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-headline text-3xl">Sales Order #{salesOrder.id.substring(0,6)}</CardTitle>
                <CardDescription>Created on: {format(new Date(salesOrder.createdAt), "PPP p")}</CardDescription>
              </div>
            </div>
            <div className="text-right">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={salesOrder.status === SALES_ORDER_STATUSES.COMPLETED ? "default" : "secondary"} className="text-lg px-3 py-1">{salesOrder.status}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
        {salesOrder.customerId && customer ? (
          <Card>
            <CardHeader><CardTitle className="text-xl">Customer Details</CardTitle></CardHeader>
            <CardContent>
              <DetailItem label="Name" value={`${customer.firstName} ${customer.lastName}`} />
              <DetailItem label="Phone" value={customer.phone} />
              <DetailItem label="Email" value={customer.email} />
            </CardContent>
          </Card>
        ) : (
             <DetailItem label="Customer" value="Walk-in Customer" />
        )}
          
          {salesOrder.notes && salesOrder.notes !== "Direct Parts Sale" && (
            <>
              <Separator />
              <DetailItem label="Sale Notes" value={salesOrder.notes} />
            </>
          )}
          <Separator />

          {salesOrder.items && salesOrder.items.length > 0 && (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <ShoppingCart className="h-5 w-5 text-primary"/>
                        <CardTitle className="text-xl">Items Sold</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Part</TableHead>
                        <TableHead className="text-center">Qty</TableHead>
                        <TableHead className="text-right">Price/Unit</TableHead>
                        <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {salesOrder.items.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell>{item.partName}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">{currency}{item.pricePerUnit.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{currency}{item.totalPrice.toFixed(2)}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                </CardContent>
            </Card>
          )}
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader><CardTitle className="text-xl">Financial Summary</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <DetailItem label="Subtotal Items" value={salesOrder.items.reduce((sum, item) => sum + item.totalPrice, 0)} />
                    <DetailItem label="Discount Amount" value={salesOrder.discountAmount} />
                    {salesOrder.taxAmount !== undefined && salesOrder.taxAmount > 0 && <DetailItem label="Tax Amount" value={salesOrder.taxAmount} />}
                    <Separator className="my-3"/>
                    <div className="flex justify-between items-center mt-2">
                        <p className="text-lg font-semibold">Grand Total:</p>
                        <p className="text-2xl font-bold text-primary">{currency}{salesOrder.grandTotal.toFixed(2)}</p>
                    </div>
                     <div className="flex justify-between items-center mt-1">
                        <p className="text-sm font-medium">Amount Paid:</p>
                        <p className="text-sm font-semibold text-green-500">{currency}{salesOrder.amountPaid.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-sm font-medium">Balance Due:</p>
                        <p className={cn("text-sm font-semibold", balanceDue > 0.001 ? "text-destructive" : "text-green-500")}>
                            {currency}{balanceDue.toFixed(2)}
                        </p>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl">Payment Details</CardTitle>
                    {!isFullyPaid && (
                        <Button size="sm" onClick={() => setShowAddPaymentDialog(true)} className="print:hidden">
                            <PlusCircle className="mr-2 h-4 w-4"/> Add Payment
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    <DetailItem 
                        label="Payment Status" 
                        value={salesOrder.paymentStatus} 
                        isBadge 
                        badgeVariant={salesOrder.paymentStatus === PAYMENT_STATUSES.PAID ? "default" : (salesOrder.paymentStatus === PAYMENT_STATUSES.UNPAID ? "destructive" : "secondary")} 
                    />
                    
                    {salesOrder.paymentHistory && salesOrder.paymentHistory.length > 0 && (
                        <>
                            <Separator className="my-4"/>
                            <h4 className="text-md font-medium mb-2">Payment History</h4>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Method</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead>Notes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {salesOrder.paymentHistory.map(payment => (
                                        <TableRow key={payment.id}>
                                            <TableCell>{format(new Date(payment.paymentDate), "MMM dd, yyyy")}</TableCell>
                                            <TableCell>{payment.method}</TableCell>
                                            <TableCell className="text-right">{currency}{payment.amount.toFixed(2)}</TableCell>
                                            <TableCell className="max-w-[150px] truncate">{payment.notes || "-"}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </>
                    )}
                     {(!salesOrder.paymentHistory || salesOrder.paymentHistory.length === 0) && !isFullyPaid && (
                         <p className="text-sm text-muted-foreground mt-4">No payments recorded yet.</p>
                     )}
                      {isFullyPaid && (!salesOrder.paymentHistory || salesOrder.paymentHistory.length === 0) && salesOrder.amountPaid === salesOrder.grandTotal && salesOrder.grandTotal > 0 && (
                         <p className="text-sm text-green-600 mt-4">Marked as paid (e.g., on creation).</p>
                     )}
                     {isFullyPaid && salesOrder.grandTotal === 0 && (
                        <p className="text-sm text-green-600 mt-4">Zero balance order marked as paid.</p>
                     )}
                </CardContent>
            </Card>
          </div>

        </CardContent>
        <CardFooter className="text-xs text-muted-foreground print:hidden">
            Last updated: {format(new Date(salesOrder.updatedAt), "PPP p")} by {salesOrder.createdByUserId || 'N/A'}
        </CardFooter>
      </Card>
      {salesOrder && !isFullyPaid && (
         <AddSalesOrderPaymentDialog
            isOpen={showAddPaymentDialog}
            onOpenChange={setShowAddPaymentDialog}
            salesOrder={salesOrder}
            onPaymentAdded={handlePaymentAdded}
            currencySymbol={currency}
         />
      )}
    </div>
  );
}
