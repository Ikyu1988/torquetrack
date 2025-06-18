
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, ClipboardList, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { JobOrder, Customer, Motorcycle } from "@/types";
import { useEffect, useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { JOB_ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from "@/lib/constants";

const jobOrderFormSchema = z.object({
  customerId: z.string().min(1, { message: "Customer is required." }),
  motorcycleId: z.string().min(1, { message: "Motorcycle is required." }),
  status: z.enum(JOB_ORDER_STATUS_OPTIONS),
  diagnostics: z.string().max(1000).optional().or(z.literal('')),
  servicesDescription: z.string().max(1000).optional().or(z.literal('')),
  partsDescription: z.string().max(1000).optional().or(z.literal('')),
  totalLaborCost: z.coerce.number().min(0, "Labor cost must be non-negative."),
  totalPartsCost: z.coerce.number().min(0, "Parts cost must be non-negative."),
  discountAmount: z.coerce.number().min(0, "Discount must be non-negative.").optional().or(z.literal('')),
  // taxAmount: z.coerce.number().min(0).optional(), // Add later if needed
  estimatedCompletionDate: z.date().optional(),
  paymentStatus: z.enum(PAYMENT_STATUS_OPTIONS),
});

type JobOrderFormValues = z.infer<typeof jobOrderFormSchema>;

export default function NewJobOrderPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  const form = useForm<JobOrderFormValues>({
    resolver: zodResolver(jobOrderFormSchema),
    defaultValues: {
      customerId: "",
      motorcycleId: "",
      status: "Pending",
      diagnostics: "",
      servicesDescription: "",
      partsDescription: "",
      totalLaborCost: 0,
      totalPartsCost: 0,
      discountAmount: undefined,
      estimatedCompletionDate: undefined,
      paymentStatus: "Unpaid",
    },
  });

  const selectedCustomerId = form.watch("customerId");
  const totalLaborCost = form.watch("totalLaborCost") || 0;
  const totalPartsCost = form.watch("totalPartsCost") || 0;
  const discountAmount = form.watch("discountAmount") || 0;

  const grandTotal = useMemo(() => {
    const labor = Number(totalLaborCost) || 0;
    const parts = Number(totalPartsCost) || 0;
    const discount = Number(discountAmount) || 0;
    return labor + parts - discount;
  }, [totalLaborCost, totalPartsCost, discountAmount]);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      if ((window as any).__customerStore) {
        setCustomers((window as any).__customerStore.customers);
      }
      if ((window as any).__motorcycleStore) {
        setMotorcycles((window as any).__motorcycleStore.motorcycles);
      }
    }
  }, []);

  const filteredMotorcycles = useMemo(() => {
    if (!selectedCustomerId) return [];
    return motorcycles.filter(m => m.customerId === selectedCustomerId);
  }, [selectedCustomerId, motorcycles]);
  
  useEffect(() => {
    // Reset motorcycleId if customer changes and selected motorcycle doesn't belong to new customer
    if (selectedCustomerId && form.getValues("motorcycleId")) {
        const currentMotorcycle = motorcycles.find(m => m.id === form.getValues("motorcycleId"));
        if (currentMotorcycle && currentMotorcycle.customerId !== selectedCustomerId) {
            form.setValue("motorcycleId", "");
        }
    }
  }, [selectedCustomerId, form, motorcycles]);


  function onSubmit(data: JobOrderFormValues) {
    let newJobOrder: JobOrder | null = null;
    if (typeof window !== 'undefined' && (window as any).__jobOrderStore) {
        const jobOrderData: Omit<JobOrder, 'id' | 'createdAt' | 'updatedAt' | 'createdByUserId' | 'grandTotal'> = {
            ...data,
            discountAmount: data.discountAmount === '' ? undefined : Number(data.discountAmount),
        };
      newJobOrder = (window as any).__jobOrderStore.addJobOrder(jobOrderData);
    }

    if (newJobOrder) {
      toast({
        title: "Job Order Created",
        description: `Job Order #${newJobOrder.id.substring(0,6)} has been successfully created.`,
      });
      router.push("/dashboard/job-orders");
    } else {
       toast({
        title: "Error",
        description: "Failed to create job order. Please try again.",
        variant: "destructive",
      });
    }
  }
  
  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><p>Loading form...</p></div>;
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="mb-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard/job-orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Job Orders
          </Link>
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-primary" />
            <CardTitle className="font-headline text-2xl">Create New Job Order</CardTitle>
          </div>
          <CardDescription>Fill in the details below for the new job order.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="customerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Customer</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {customers.length === 0 && <SelectItem value="loading" disabled>Loading customers...</SelectItem>}
                          {customers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id}>
                              {customer.firstName} {customer.lastName} ({customer.phone})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="motorcycleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Motorcycle</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} disabled={!selectedCustomerId || filteredMotorcycles.length === 0}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={!selectedCustomerId ? "Select customer first" : (filteredMotorcycles.length === 0 ? "No motorcycles for customer" : "Select a motorcycle")} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {filteredMotorcycles.map(motorcycle => (
                            <SelectItem key={motorcycle.id} value={motorcycle.id}>
                              {motorcycle.make} {motorcycle.model} ({motorcycle.plateNumber})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Order Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {JOB_ORDER_STATUS_OPTIONS.map(status => (
                          <SelectItem key={status} value={status}>{status}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="diagnostics"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Diagnostics / Customer Complaint (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the issue or customer request..." {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="servicesDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Services Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="List services to be performed or completed..." {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="partsDescription"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parts Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="List parts used or to be used..." {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-end">
                 <FormField
                  control={form.control}
                  name="totalLaborCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Labor Cost</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="number" step="0.01" placeholder="0.00" {...field} className="pl-8" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="totalPartsCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Total Parts Cost</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="number" step="0.01" placeholder="0.00" {...field} className="pl-8" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discountAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Amount (Optional)</FormLabel>
                      <FormControl>
                        <div className="relative">
                           <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input type="number" step="0.01" placeholder="0.00" {...field} className="pl-8" onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Card className="bg-muted/50">
                <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Grand Total:</span>
                        <span className="text-2xl font-bold text-primary">${grandTotal.toFixed(2)}</span>
                    </div>
                </CardContent>
              </Card>


              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="estimatedCompletionDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Est. Completion Date (Optional)</FormLabel>
                      <DatePicker 
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select estimated date"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="paymentStatus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Status</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select payment status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {PAYMENT_STATUS_OPTIONS.map(status => (
                            <SelectItem key={status} value={status}>{status}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard/job-orders")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : "Create Job Order"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
