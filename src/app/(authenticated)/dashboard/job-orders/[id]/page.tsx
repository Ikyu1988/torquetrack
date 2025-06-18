
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { JobOrder, Customer, Motorcycle, Mechanic, Payment, ShopSettings } from "@/types";
import { ArrowLeft, ClipboardList, Edit, Printer, Send, UserCog, PackageSearch, Wrench, CreditCard, PlusCircle, ShoppingCart } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddPaymentDialog } from "@/components/dashboard/job-orders/AddPaymentDialog";
import { JOB_ORDER_STATUSES, PAYMENT_STATUSES } from "@/lib/constants";

if (typeof window !== 'undefined' && !(window as any).__paymentStore) {
    (window as any).__paymentStore = {
        payments: [], 
        addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => {
            const newPayment: Payment = {
                ...payment,
                id: String(Date.now() + Math.random()), 
                createdAt: new Date(),
            };
            (window as any).__paymentStore.payments.push(newPayment);
            return newPayment;
        },
        getPaymentsByJobOrderId: (jobOrderId: string) => {
            return (window as any).__paymentStore.payments.filter((p: Payment) => p.jobOrderId === jobOrderId);
        },
        deletePaymentById: (paymentId: string) => {
            (window as any).__paymentStore.payments = (window as any).__paymentStore.payments.filter((p: Payment) => p.id !== paymentId);
            return true;
        }
    };
}


export default function ViewJobOrderPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const jobOrderId = params.id as string;

  const [jobOrder, setJobOrder] = useState<JobOrder | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [motorcycle, setMotorcycle] = useState<Motorcycle | null>(null);
  const [mechanicsMap, setMechanicsMap] = useState<Map<string, string>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [showAddPaymentDialog, setShowAddPaymentDialog] = useState(false);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null); 

  const currency = useMemo(() => shopSettings?.currencySymbol || '₱', [shopSettings]);
  const isDirectSale = useMemo(() => jobOrder?.status === JOB_ORDER_STATUSES.SALE_COMPLETED, [jobOrder]);

  const refreshJobOrderData = useCallback(() => {
    if (jobOrderId && isMounted) {
        let joData: JobOrder | undefined;
        let custData: Customer | undefined;
        let motoData: Motorcycle | undefined;
        let allMechanics: Mechanic[] = [];
        let currentShopSettings: ShopSettings | null = null;


        if (typeof window !== 'undefined') {
            if ((window as any).__jobOrderStore) {
                joData = (window as any).__jobOrderStore.getJobOrderById(jobOrderId);
            }
            if (joData && (window as any).__customerStore && joData.customerId) {
                custData = (window as any).__customerStore.getCustomerById(joData.customerId);
            }
            if (joData && (window as any).__motorcycleStore && joData.motorcycleId) {
                motoData = (window as any).__motorcycleStore.getMotorcycleById(joData.motorcycleId);
            }
            if ((window as any).__mechanicStore) {
                allMechanics = (window as any).__mechanicStore.mechanics;
                const map = new Map<string, string>();
                allMechanics.forEach(m => map.set(m.id, m.name));
                setMechanicsMap(map);
            }
            if ((window as any).__settingsStore) {
                currentShopSettings = (window as any).__settingsStore.getSettings();
                setShopSettings(currentShopSettings);
            }
        }

        if (joData) {
            setJobOrder(joData);
            setCustomer(custData || null);
            setMotorcycle(motoData || null);
        } else {
            toast({
            title: "Error",
            description: "Job Order/Sale not found.",
            variant: "destructive",
            });
            router.push("/dashboard/job-orders");
        }
    }
  }, [jobOrderId, isMounted, router, toast]);


  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    if (jobOrderId && isMounted) {
      setIsLoading(true);
      refreshJobOrderData();
      setIsLoading(false);
    }
  }, [jobOrderId, isMounted, refreshJobOrderData]);

  const handlePaymentAdded = () => {
    refreshJobOrderData(); 
    toast({
        title: "Payment Added",
        description: "The payment has been successfully recorded.",
    });
  };
  

  const DetailItem = ({ label, value, className, isBadge = false, badgeVariant = "secondary" }: { label: string, value?: string | number | Date | null | React.ReactNode, className?: string, isBadge?: boolean, badgeVariant?: "default" | "secondary" | "destructive" | "outline" | null | undefined }) => {
    if (value === undefined || value === null || value === '') return null;
    let displayValue = value;
    if (value instanceof Date) {
      displayValue = format(value, "PPP p");
    } else if (typeof value === 'number' && (label.toLowerCase().includes('cost') || label.toLowerCase().includes('total') || label.toLowerCase().includes('amount') || label.toLowerCase().includes('balance')) ) {
      displayValue = `${currency}${value.toFixed(2)}`;
    }

    if (isBadge && typeof displayValue === 'string') {
        displayValue = <Badge variant={badgeVariant}>{displayValue}</Badge>;
    }

    return (
      <div className={cn("mb-2 print:mb-1", className)}>
        <p className="text-sm text-muted-foreground print:text-xs">{label}</p>
        {typeof displayValue === 'string' ? <p className="font-medium print:text-sm">{displayValue}</p> : displayValue}
      </div>
    );
  };
  
  const totalLaborCost = useMemo(() => {
    return jobOrder?.servicesPerformed.reduce((sum, item) => sum + (Number(item.laborCost) || 0), 0) || 0;
  }, [jobOrder?.servicesPerformed]);

  const totalPartsCost = useMemo(() => {
    return jobOrder?.partsUsed.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0) || 0;
  }, [jobOrder?.partsUsed]);

  const balanceDue = useMemo(() => {
    if (!jobOrder) return 0;
    return jobOrder.grandTotal - jobOrder.amountPaid;
  }, [jobOrder]);


  if (!isMounted || isLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading details...</p></div>;
  }

  if (!jobOrder) {
    return <div className="flex justify-center items-center h-screen"><p>Order/Sale not found.</p></div>;
  }
  
  const isFullyPaid = jobOrder.paymentStatus === PAYMENT_STATUSES.PAID || balanceDue <= 0.001; 

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center mb-4 print:hidden">
        <Button variant="outline" asChild>
          <Link href="/dashboard/job-orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Job Orders & Sales
          </Link>
        </Button>
        <div className="flex gap-2">
            <Button variant="outline" onClick={() => window.print()}>
                <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            <Button onClick={() => alert("Email functionality coming soon!")}>
                <Send className="mr-2 h-4 w-4" /> Email to Customer
            </Button>
            <Button asChild>
                <Link href={`/dashboard/job-orders/${jobOrder.id}/edit`}>
                    <Edit className="mr-2 h-4 w-4" /> Edit {isDirectSale ? "Sale" : "Job Order"}
                </Link>
            </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between print:flex-row print:items-start">
            <div className="flex items-center gap-3">
              {isDirectSale ? <ShoppingCart className="h-8 w-8 text-primary" /> : <ClipboardList className="h-8 w-8 text-primary" />}
              <div>
                <CardTitle className="font-headline text-3xl">{isDirectSale ? "Direct Sale" : "Job Order"} #{jobOrder.id.substring(0,6)}</CardTitle>
                <CardDescription>Created on: {format(new Date(jobOrder.createdAt), "PPP p")}</CardDescription>
              </div>
            </div>
            <div className="text-right">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={jobOrder.status === "Completed" || jobOrder.status === "Sale - Completed" ? "default" : "secondary"} className="text-lg px-3 py-1">{jobOrder.status}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
        {jobOrder.customerId && customer && (
          <div className={cn("grid grid-cols-1 gap-6", jobOrder.motorcycleId && motorcycle ? "md:grid-cols-2" : "md:grid-cols-1")}>
            <Card>
              <CardHeader><CardTitle className="text-xl">Customer Details</CardTitle></CardHeader>
              <CardContent>
                <DetailItem label="Name" value={customer ? `${customer.firstName} ${customer.lastName}` : "N/A"} />
                <DetailItem label="Phone" value={customer?.phone} />
                <DetailItem label="Email" value={customer?.email} />
              </CardContent>
            </Card>
             {jobOrder.motorcycleId && motorcycle && !isDirectSale && (
                <Card>
                <CardHeader><CardTitle className="text-xl">Motorcycle Details</CardTitle></CardHeader>
                <CardContent>
                    <DetailItem label="Make & Model" value={motorcycle ? `${motorcycle.make} ${motorcycle.model}` : "N/A"} />
                    <DetailItem label="Plate Number" value={motorcycle?.plateNumber} />
                    <DetailItem label="Year" value={motorcycle?.year} />
                    <DetailItem label="Odometer" value={motorcycle ? `${motorcycle.odometer} km/mi` : undefined} />
                </CardContent>
                </Card>
             )}
          </div>
        )}
          
          <Separator />
           {(jobOrder.diagnostics && (!isDirectSale || jobOrder.diagnostics !== "Direct Parts Sale")) && (
            <>
              <DetailItem label={isDirectSale ? "Sale Type" : "Diagnostics / Customer Complaint"} value={jobOrder.diagnostics} />
              <Separator />
            </>
           )}


          {jobOrder.servicesPerformed && jobOrder.servicesPerformed.length > 0 && (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Wrench className="h-5 w-5 text-primary"/>
                        <CardTitle className="text-xl">Services Performed</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                        <TableHead>Service</TableHead>
                        <TableHead>Mechanic</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {jobOrder.servicesPerformed.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell>{item.serviceName}</TableCell>
                            <TableCell>{item.assignedMechanicId ? mechanicsMap.get(item.assignedMechanicId) || 'N/A' : 'N/A'}</TableCell>
                            <TableCell className="max-w-xs truncate">{item.notes || "-"}</TableCell>
                            <TableCell className="text-right">{currency}{item.laborCost.toFixed(2)}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                {jobOrder.servicesDescription && <DetailItem label="Overall Service Notes" value={jobOrder.servicesDescription} className="mt-4" />}
                </CardContent>
            </Card>
          )}


          {jobOrder.partsUsed && jobOrder.partsUsed.length > 0 && (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <PackageSearch className="h-5 w-5 text-primary"/>
                        <CardTitle className="text-xl">Parts Used</CardTitle>
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
                        {jobOrder.partsUsed.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell>{item.partName}</TableCell>
                            <TableCell className="text-center">{item.quantity}</TableCell>
                            <TableCell className="text-right">{currency}{item.pricePerUnit.toFixed(2)}</TableCell>
                            <TableCell className="text-right">{currency}{item.totalPrice.toFixed(2)}</TableCell>
                        </TableRow>
                        ))}
                    </TableBody>
                    </Table>
                {jobOrder.partsDescription && <DetailItem label="Overall Parts Notes" value={jobOrder.partsDescription} className="mt-4" />}
                </CardContent>
            </Card>
          )}
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader><CardTitle className="text-xl">Financial Summary</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    {totalLaborCost > 0 && <DetailItem label="Total Labor Cost" value={totalLaborCost} />}
                    {totalPartsCost > 0 && <DetailItem label="Total Parts Cost" value={totalPartsCost} />}
                    <DetailItem label="Discount Amount" value={jobOrder.discountAmount} />
                    {jobOrder.taxAmount !== undefined && jobOrder.taxAmount > 0 && <DetailItem label="Tax Amount" value={jobOrder.taxAmount} />}
                    <Separator className="my-3"/>
                    <div className="flex justify-between items-center mt-2">
                        <p className="text-lg font-semibold">Grand Total:</p>
                        <p className="text-2xl font-bold text-primary">{currency}{jobOrder.grandTotal.toFixed(2)}</p>
                    </div>
                     <div className="flex justify-between items-center mt-1">
                        <p className="text-sm font-medium">Amount Paid:</p>
                        <p className="text-sm font-semibold text-green-500">{currency}{jobOrder.amountPaid.toFixed(2)}</p>
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
                        value={jobOrder.paymentStatus} 
                        isBadge 
                        badgeVariant={jobOrder.paymentStatus === PAYMENT_STATUSES.PAID ? "default" : (jobOrder.paymentStatus === PAYMENT_STATUSES.UNPAID ? "destructive" : "secondary")} 
                    />
                    {!isDirectSale && jobOrder.estimatedCompletionDate && (
                        <DetailItem label="Estimated Completion Date" value={jobOrder.estimatedCompletionDate} />
                    )}
                    {!isDirectSale && jobOrder.actualCompletionDate && (
                        <DetailItem label="Actual Completion Date" value={jobOrder.actualCompletionDate} />
                    )}
                    
                    {jobOrder.paymentHistory && jobOrder.paymentHistory.length > 0 && (
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
                                    {jobOrder.paymentHistory.map(payment => (
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
                     {(!jobOrder.paymentHistory || jobOrder.paymentHistory.length === 0) && !isFullyPaid && (
                         <p className="text-sm text-muted-foreground mt-4">No payments recorded yet.</p>
                     )}
                      {isFullyPaid && (!jobOrder.paymentHistory || jobOrder.paymentHistory.length === 0) && jobOrder.amountPaid === jobOrder.grandTotal && jobOrder.grandTotal > 0 && (
                         <p className="text-sm text-green-600 mt-4">Marked as paid (e.g., on creation).</p>
                     )}
                     {isFullyPaid && jobOrder.grandTotal === 0 && (
                        <p className="text-sm text-green-600 mt-4">Zero balance order marked as paid.</p>
                     )}


                </CardContent>
            </Card>
          </div>

        </CardContent>
        <CardFooter className="text-xs text-muted-foreground print:hidden">
            Last updated: {format(new Date(jobOrder.updatedAt), "PPP p")} by {jobOrder.createdByUserId || 'N/A'}
        </CardFooter>
      </Card>
      {jobOrder && !isFullyPaid && (
         <AddPaymentDialog
            isOpen={showAddPaymentDialog}
            onOpenChange={setShowAddPaymentDialog}
            jobOrder={jobOrder}
            onPaymentAdded={handlePaymentAdded}
            currencySymbol={currency}
         />
      )}
    </div>
  );

    