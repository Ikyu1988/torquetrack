
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { JobOrder, Customer, Motorcycle, JobOrderServiceItem, JobOrderPartItem, Mechanic } from "@/types";
import { ArrowLeft, ClipboardList, DollarSign, Edit, Printer, Send, UserCog, PackageSearch, Wrench } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";


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

  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  useEffect(() => {
    if (jobOrderId && isMounted) {
      setIsLoading(true);
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
      setIsLoading(false);
    }
  }, [jobOrderId, router, toast, isMounted]);

  const DetailItem = ({ label, value, className, isBadge = false, badgeVariant = "secondary" }: { label: string, value?: string | number | Date | null | React.ReactNode, className?: string, isBadge?: boolean, badgeVariant?: "default" | "secondary" | "destructive" | "outline" | null | undefined }) => {
    if (value === undefined || value === null || value === '') return null;
    let displayValue = value;
    if (value instanceof Date) {
      displayValue = format(value, "PPP p");
    } else if (typeof value === 'number' && (label.toLowerCase().includes('cost') || label.toLowerCase().includes('total') || label.toLowerCase().includes('amount')) ) {
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


  if (!isMounted || isLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading job order details...</p></div>;
  }

  if (!jobOrder) {
    return <div className="flex justify-center items-center h-screen"><p>Job order not found.</p></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-between items-center mb-4">
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

          {/* Services Performed */}
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

          {/* Parts Used */}
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
                <CardHeader><CardTitle className="text-xl">Cost Summary</CardTitle></CardHeader>
                <CardContent>
                    <DetailItem label="Total Labor Cost" value={totalLaborCost} />
                    <DetailItem label="Total Parts Cost" value={totalPartsCost} />
                    <DetailItem label="Discount Amount" value={jobOrder.discountAmount} />
                    <DetailItem label="Tax Amount" value={jobOrder.taxAmount} />
                    <Separator className="my-3"/>
                    <div className="flex justify-between items-center mt-2">
                        <p className="text-lg font-semibold">Grand Total:</p>
                        <p className="text-2xl font-bold text-primary">${jobOrder.grandTotal.toFixed(2)}</p>
                    </div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader><CardTitle className="text-xl">Dates & Payment</CardTitle></CardHeader>
                <CardContent>
                    <DetailItem label="Estimated Completion Date" value={jobOrder.estimatedCompletionDate} />
                    <DetailItem label="Actual Completion Date" value={jobOrder.actualCompletionDate} />
                    <DetailItem 
                        label="Payment Status" 
                        value={jobOrder.paymentStatus} 
                        isBadge 
                        badgeVariant={jobOrder.paymentStatus === "Paid" ? "default" : (jobOrder.paymentStatus === "Unpaid" ? "destructive" : "secondary")} />
                </CardContent>
            </Card>
          </div>

        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
            Last updated: {format(new Date(jobOrder.updatedAt), "PPP p")} by {jobOrder.createdByUserId || 'N/A'}
        </CardFooter>
      </Card>
    </div>
  );
}
