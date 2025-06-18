
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import type { JobOrder, Customer, Motorcycle } from "@/types";
import { ArrowLeft, ClipboardList, Edit, Printer, Send } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function ViewJobOrderPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const jobOrderId = params.id as string;

  const [jobOrder, setJobOrder] = useState<JobOrder | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [motorcycle, setMotorcycle] = useState<Motorcycle | null>(null);
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

  const DetailItem = ({ label, value, className }: { label: string, value?: string | number | Date | null, className?: string }) => {
    if (value === undefined || value === null || value === '') return null;
    let displayValue = value;
    if (value instanceof Date) {
      displayValue = format(value, "PPP p");
    } else if (typeof value === 'number' && (label.toLowerCase().includes('cost') || label.toLowerCase().includes('total') || label.toLowerCase().includes('amount')) ) {
      displayValue = `$${value.toFixed(2)}`;
    }
    return (
      <div className={cn("mb-2", className)}>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-medium">{String(displayValue)}</p>
      </div>
    );
  };
  
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
            <Button variant="outline" onClick={() => alert("Print functionality coming soon!")}>
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

          <Card>
            <CardHeader><CardTitle className="text-xl">Service & Parts Information</CardTitle></CardHeader>
            <CardContent>
              <DetailItem label="Diagnostics / Customer Complaint" value={jobOrder.diagnostics} />
              <DetailItem label="Services Description" value={jobOrder.servicesDescription} />
              <DetailItem label="Parts Description" value={jobOrder.partsDescription} />
            </CardContent>
          </Card>

          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader><CardTitle className="text-xl">Cost Summary</CardTitle></CardHeader>
                <CardContent>
                    <DetailItem label="Total Labor Cost" value={jobOrder.totalLaborCost} />
                    <DetailItem label="Total Parts Cost" value={jobOrder.totalPartsCost} />
                    <DetailItem label="Discount Amount" value={jobOrder.discountAmount} />
                    {/* <DetailItem label="Tax Amount" value={jobOrder.taxAmount} /> */}
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
                    <DetailItem label="Payment Status" value={jobOrder.paymentStatus && <Badge variant={jobOrder.paymentStatus === "Paid" ? "default" : (jobOrder.paymentStatus === "Unpaid" ? "destructive" : "secondary") }>{jobOrder.paymentStatus}</Badge>} />
                </CardContent>
            </Card>
          </div>

        </CardContent>
        <CardFooter className="text-xs text-muted-foreground">
            Last updated: {format(new Date(jobOrder.updatedAt), "PPP p")} by {jobOrder.createdByUserId}
        </CardFooter>
      </Card>
    </div>
  );
}

