
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { JobOrder, Customer, Motorcycle, JobOrderServiceItem, JobOrderPartItem, Mechanic, Payment } from "@/types";
import { ArrowLeft, ClipboardList, DollarSign, Edit, Printer, Send, UserCog, PackageSearch, Wrench, CreditCard, PlusCircle } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AddPaymentDialog } from "@/components/dashboard/job-orders/AddPaymentDialog";
import { PAYMENT_STATUSES } from "@/lib/constants";

// Initialize payment store if not already present
if (typeof window !== 'undefined' && !(window as any).__paymentStore) {
    (window as any).__paymentStore = {
        payments: [], // Start with an empty array
        addPayment: (payment: Omit<Payment, 'id' | 'createdAt'>) => {
            const newPayment: Payment = {
                ...payment,
                id: String(Date.now()),
                createdAt: new Date(),
            };
            (window as any).__paymentStore.payments.push(newPayment);
            return newPayment;
        },
        getPaymentsByJobOrderId: (jobOrderId: string) => {
            return (window as any).__paymentStore.payments.filter((p: Payment) => p.jobOrderId === jobOrderId);
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

  const refreshJobOrderData = useCallback(() => {
    if (jobOrderId && isMounted) {
        let joData: JobOrder | undefined;
        let custData: Customer | undefined;
        let motoData: Motorcycle | undefined;
        let allMechanics: Mechanic[] = [];

        if (typeof window !== 'undefined') {
            if ((window as any).__jobOrderStore) {
            joData = (window as any).__jobOrderStore.getJobOrderById(jobOrderId);
            }
            if (joData && (window as any).__customerStore) {
            custData = (window as any).__customerStore.getCustomerById(joData.customerId);
            }
            if (joData && (window as any).__motorcycleStore) {
            motoData = (window as any).__motorcycleStore.getMotorcycleById(joData.motorcycleId);
            }
            if ((window as any).__mechanicStore) {
                allMechanics = (window as any).__mechanicStore.mechanics;
                const map = new Map<string, string>();
                allMechanics.forEach(m => map.set(m.id, m.name));
                setMechanicsMap(map);
            }
        }

        if (joData) {
            // Simulate fetching payments from paymentStore and attaching to jobOrder if not already there
            // In a real app, paymentHistory would likely be part of the joData fetched from backend
            if ((window as any).__paymentStore && (!joData.paymentHistory || joData.paymentHistory.length === 0)) {
                 const payments = (window as any).__paymentStore.getPaymentsByJobOrderId(joData.id);
                 if(payments.length > 0) {
                    // This is a bit of a hack for the mock store; ideally, jobOrder in __jobOrderStore should be the source of truth.
                    // For now, we ensure the viewed jobOrder object has the payments.
                    joData.paymentHistory = payments;
                    // Recalculate amountPaid and status for display consistency
                    joData.amountPaid = payments.reduce((sum: number, p: Payment) => sum + p.amount, 0);
                    if (joData.amountPaid >= joData.grandTotal) joData.paymentStatus = PAYMENT_STATUSES.PAID;
                    else if (joData.amountPaid > 0) joData.paymentStatus = PAYMENT_STATUSES.PARTIAL;
                    else joData.paymentStatus = PAYMENT_STATUSES.UNPAID;
                 }
            }
            setJobOrder(joData);
            setCustomer(custData || null);
            setMotorcycle(motoData || null);
        } else {
            toast({
            title: "Error",
            description: "Job Order not found.",
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
    refreshJobOrderData(); // Re-fetch/re-process job order data to show new payment
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
      displayValue = `$${value.toFixed(2)}`;
    }

    if (isBadge && typeof displayValue === 'string') {
        displayValue = <Badge variant={badgeVariant}>{displayValue}</Badge>;
    }

    return (
      <div className={cn("mb-2", className)}>
        <p className="text-sm text-muted-foreground">{label}</p>
        {typeof displayValue === 'string' ? <p className="font-medium">{displayValue}</p> : displayValue}
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
    return <div className="flex justify-center items-center h-screen"><p>Loading job order details...</p></div>;
  }

  if (!jobOrder) {
    return <div className="flex justify-center items-center h-screen"><p>Job order not found.</p></div>;
  }
  
  const isFullyPaid = jobOrder.paymentStatus === PAYMENT_STATUSES.PAID || balanceDue <= 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center mb-4 print:hidden">
        <Button variant="outline" asChild>
          <Link href="/dashboard/job-orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Job Orders
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
                    <Edit className="mr-2 h-4 w-4" /> Edit Job Order
                </Link>
            </Button>
        </div>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ClipboardList className="h-8 w-8 text-primary" />
              <div>
                <CardTitle className="font-headline text-3xl">Job Order #{jobOrder.id.substring(0,6)}</CardTitle>
                <CardDescription>Created on: {format(new Date(jobOrder.createdAt), "PPP p")}</CardDescription>
              </div>
            </div>
            <div className="text-right">
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge variant={jobOrder.status === "Completed" ? "default" : "secondary"} className="text-lg px-3 py-1">{jobOrder.status}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader><CardTitle className="text-xl">Customer Details</CardTitle></CardHeader>
              <CardContent>
                <DetailItem label="Name" value={customer ? `${customer.firstName} ${customer.lastName}` : "N/A"} />
                <DetailItem label="Phone" value={customer?.phone} />
                <DetailItem label="Email" value={customer?.email} />
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-xl">Motorcycle Details</CardTitle></CardHeader>
              <CardContent>
                <DetailItem label="Make & Model" value={motorcycle ? `${motorcycle.make} ${motorcycle.model}` : "N/A"} />
                <DetailItem label="Plate Number" value={motorcycle?.plateNumber} />
                <DetailItem label="Year" value={motorcycle?.year} />
                <DetailItem label="Odometer" value={motorcycle ? `${motorcycle.odometer} km/mi` : undefined} />
              </CardContent>
            </Card>
          </div>
          
          <Separator />
           <DetailItem label="Diagnostics / Customer Complaint" value={jobOrder.diagnostics} />
          <Separator />

          <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Wrench className="h-5 w-5 text-primary"/>
                    <CardTitle className="text-xl">Services Performed</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
              {jobOrder.servicesPerformed && jobOrder.servicesPerformed.length > 0 ? (
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
                        <TableCell className="text-right">${item.laborCost.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No specific services listed.</p>
              )}
               <DetailItem label="Overall Service Notes" value={jobOrder.servicesDescription} className="mt-4" />
            </CardContent>
          </Card>

          <Card>
             <CardHeader>
                <div className="flex items-center gap-2">
                    <PackageSearch className="h-5 w-5 text-primary"/>
                    <CardTitle className="text-xl">Parts Used</CardTitle>
                </div>
            </CardHeader>
            <CardContent>
              {jobOrder.partsUsed && jobOrder.partsUsed.length > 0 ? (
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
                        <TableCell className="text-right">${item.pricePerUnit.toFixed(2)}</TableCell>
                        <TableCell className="text-right">${item.totalPrice.toFixed(2)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-muted-foreground">No specific parts listed.</p>
              )}
              <DetailItem label="Overall Parts Notes" value={jobOrder.partsDescription} className="mt-4" />
            </CardContent>
          </Card>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader><CardTitle className="text-xl">Financial Summary</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                    <DetailItem label="Total Labor Cost" value={totalLaborCost} />
                    <DetailItem label="Total Parts Cost" value={totalPartsCost} />
                    <DetailItem label="Discount Amount" value={jobOrder.discountAmount} />
                    <DetailItem label="Tax Amount" value={jobOrder.taxAmount} />
                    <Separator className="my-3"/>
                    <div className="flex justify-between items-center mt-2">
                        <p className="text-lg font-semibold">Grand Total:</p>
                        <p className="text-2xl font-bold text-primary">${jobOrder.grandTotal.toFixed(2)}</p>
                    </div>
                     <div className="flex justify-between items-center mt-1">
                        <p className="text-sm font-medium">Amount Paid:</p>
                        <p className="text-sm font-semibold text-green-500">${jobOrder.amountPaid.toFixed(2)}</p>
                    </div>
                    <div className="flex justify-between items-center mt-1">
                        <p className="text-sm font-medium">Balance Due:</p>
                        <p className={cn("text-sm font-semibold", balanceDue > 0 ? "text-destructive" : "text-green-500")}>
                            ${balanceDue.toFixed(2)}
                        </p>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-xl">Payment Details</CardTitle>
                    {!isFullyPaid && (
                        <Button size="sm" onClick={() => setShowAddPaymentDialog(true)}>
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
                    <DetailItem label="Estimated Completion Date" value={jobOrder.estimatedCompletionDate} />
                    <DetailItem label="Actual Completion Date" value={jobOrder.actualCompletionDate} />
                    
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
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {jobOrder.paymentHistory.map(payment => (
                                        <TableRow key={payment.id}>
                                            <TableCell>{format(new Date(payment.paymentDate), "MMM dd, yyyy")}</TableCell>
                                            <TableCell>{payment.method}</TableCell>
                                            <TableCell className="text-right">${payment.amount.toFixed(2)}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </>
                    )}
                     {(!jobOrder.paymentHistory || jobOrder.paymentHistory.length === 0) && !isFullyPaid && (
                         <p className="text-sm text-muted-foreground mt-4">No payments recorded yet.</p>
                     )}
                      {isFullyPaid && (!jobOrder.paymentHistory || jobOrder.paymentHistory.length === 0) && jobOrder.amountPaid === jobOrder.grandTotal && (
                         <p className="text-sm text-green-600 mt-4">Marked as paid (e.g., on creation or zero balance).</p>
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
         />
      )}
    </div>
  );
}

