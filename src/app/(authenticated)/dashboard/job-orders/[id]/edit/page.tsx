
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, ClipboardList, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useParams } from "next/navigation";
import type { JobOrder, Customer, Motorcycle, Service, Part, Mechanic, JobOrderServiceItem, JobOrderPartItem, ShopSettings } from "@/types";
import { useEffect, useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { JOB_ORDER_STATUS_OPTIONS, PAYMENT_STATUS_OPTIONS } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";

const jobOrderServiceItemSchema = z.object({
  id: z.string(),
  serviceId: z.string().min(1, "Service selection is required."),
  serviceName: z.string(),
  laborCost: z.coerce.number().min(0, "Labor cost must be non-negative."),
  assignedMechanicId: z.string().optional(),
  notes: z.string().optional(),
});

const jobOrderPartItemSchema = z.object({
  id: z.string(),
  partId: z.string().min(1, "Part selection is required."),
  partName: z.string(),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1."),
  pricePerUnit: z.coerce.number().min(0),
  totalPrice: z.coerce.number().min(0),
});

const jobOrderFormSchema = z.object({
  customerId: z.string().min(1, { message: "Customer is required." }),
  motorcycleId: z.string().min(1, { message: "Motorcycle is required." }),
  status: z.enum(JOB_ORDER_STATUS_OPTIONS),
  diagnostics: z.string().max(1000).optional().or(z.literal('')),
  
  servicesPerformed: z.array(jobOrderServiceItemSchema).min(0),
  partsUsed: z.array(jobOrderPartItemSchema).min(0),

  discountAmount: z.coerce.number().min(0, "Discount must be non-negative.").optional().or(z.literal('')),
  estimatedCompletionDate: z.date().optional(),
  actualCompletionDate: z.date().optional(),
  paymentStatus: z.enum(PAYMENT_STATUS_OPTIONS),
  servicesDescription: z.string().max(1000).optional().or(z.literal('')),
  partsDescription: z.string().max(1000).optional().or(z.literal('')),
});

type JobOrderFormValues = z.infer<typeof jobOrderFormSchema>;

const NO_MECHANIC_DISPLAY_VALUE = "__SELECT_NO_MECHANIC__";

export default function EditJobOrderPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const jobOrderId = params.id as string;

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  const [availableParts, setAvailableParts] = useState<Part[]>([]);
  const [availableMechanics, setAvailableMechanics] = useState<Mechanic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);

  const currency = useMemo(() => shopSettings?.currencySymbol || '₱', [shopSettings]);

  const form = useForm<JobOrderFormValues>({
    resolver: zodResolver(jobOrderFormSchema),
    defaultValues: {
      customerId: "",
      motorcycleId: "",
      status: "Pending",
      diagnostics: "",
      servicesPerformed: [],
      partsUsed: [],
      discountAmount: undefined,
      estimatedCompletionDate: undefined,
      actualCompletionDate: undefined,
      paymentStatus: "Unpaid",
      servicesDescription: "",
      partsDescription: "",
    },
  });

  const { fields: serviceFields, append: appendService, remove: removeService, replace: replaceServices } = useFieldArray({
    control: form.control,
    name: "servicesPerformed",
  });

  const { fields: partFields, append: appendPart, remove: removePart, replace: replaceParts } = useFieldArray({
    control: form.control,
    name: "partsUsed",
  });


  const selectedCustomerId = form.watch("customerId");
  const servicesPerformedWatch = form.watch("servicesPerformed");
  const partsUsedWatch = form.watch("partsUsed");
  const discountAmountWatch = form.watch("discountAmount") || 0;

  const totalLaborCost = useMemo(() => {
    return servicesPerformedWatch.reduce((sum, item) => sum + (Number(item.laborCost) || 0), 0);
  }, [servicesPerformedWatch]);

  const totalPartsCost = useMemo(() => {
    return partsUsedWatch.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
  }, [partsUsedWatch]);
  
  const grandTotal = useMemo(() => {
    const discount = Number(discountAmountWatch) || 0;
    return totalLaborCost + totalPartsCost - discount;
  }, [totalLaborCost, totalPartsCost, discountAmountWatch]);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      if ((window as any).__customerStore) setCustomers((window as any).__customerStore.customers);
      if ((window as any).__motorcycleStore) setMotorcycles((window as any).__motorcycleStore.motorcycles);
      if ((window as any).__serviceStore) setAvailableServices((window as any).__serviceStore.services.filter((s: Service) => s.isActive));
      if ((window as any).__inventoryStore) setAvailableParts((window as any).__inventoryStore.parts.filter((p: Part) => p.isActive));
      if ((window as any).__mechanicStore) setAvailableMechanics((window as any).__mechanicStore.mechanics.filter((m: Mechanic) => m.isActive));
      if ((window as any).__settingsStore) setShopSettings((window as any).__settingsStore.getSettings());
    }
  }, []);

  useEffect(() => {
    if (jobOrderId && customers.length > 0 && motorcycles.length > 0 && availableServices.length > 0 && availableParts.length > 0 && isMounted) {
      setIsLoading(true);
      let jobOrderData: JobOrder | undefined;
      if (typeof window !== 'undefined' && (window as any).__jobOrderStore) {
        jobOrderData = (window as any).__jobOrderStore.getJobOrderById(jobOrderId);
      }

      if (jobOrderData) {
        form.reset({
          customerId: jobOrderData.customerId,
          motorcycleId: jobOrderData.motorcycleId,
          status: jobOrderData.status,
          diagnostics: jobOrderData.diagnostics || "",
          servicesPerformed: jobOrderData.servicesPerformed?.map(s => ({...s, assignedMechanicId: s.assignedMechanicId || undefined })) || [],
          partsUsed: jobOrderData.partsUsed || [],
          discountAmount: jobOrderData.discountAmount === undefined ? '' : jobOrderData.discountAmount,
          estimatedCompletionDate: jobOrderData.estimatedCompletionDate ? new Date(jobOrderData.estimatedCompletionDate) : undefined,
          actualCompletionDate: jobOrderData.actualCompletionDate ? new Date(jobOrderData.actualCompletionDate) : undefined,
          paymentStatus: jobOrderData.paymentStatus,
          servicesDescription: jobOrderData.servicesDescription || "",
          partsDescription: jobOrderData.partsDescription || "",
        });
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
  }, [jobOrderId, form, router, toast, customers, motorcycles, availableServices, availableParts, isMounted]);
  
  const filteredMotorcycles = useMemo(() => {
    if (!selectedCustomerId) return motorcycles;
    return motorcycles.filter(m => m.customerId === selectedCustomerId);
  }, [selectedCustomerId, motorcycles]);

  useEffect(() => {
    if (selectedCustomerId && form.getValues("motorcycleId")) {
        const currentMotorcycle = motorcycles.find(m => m.id === form.getValues("motorcycleId"));
        if (currentMotorcycle && currentMotorcycle.customerId !== selectedCustomerId) {
            form.setValue("motorcycleId", "");
        }
    }
  }, [selectedCustomerId, form, motorcycles]);


  function onSubmit(data: JobOrderFormValues) {
    let success = false;
    if (typeof window !== 'undefined' && (window as any).__jobOrderStore) {
      const existingJobOrder = (window as any).__jobOrderStore.getJobOrderById(jobOrderId);
      if (existingJobOrder) {
        const updatedJobOrderData: JobOrder = {
          ...existingJobOrder,
          ...data,
          discountAmount: data.discountAmount === '' ? undefined : Number(data.discountAmount),
        };
        success = (window as any).__jobOrderStore.updateJobOrder(updatedJobOrderData);
      }
    }

    if (success) {
      toast({
        title: "Job Order Updated",
        description: `Job Order #${jobOrderId.substring(0,6)} has been successfully updated.`,
      });
      router.push("/dashboard/job-orders");
    } else {
       toast({
        title: "Error",
        description: "Failed to update job order. Please try again.",
        variant: "destructive",
      });
    }
  }
  
  if (!isMounted || isLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading job order data...</p></div>;
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
            <CardTitle className="font-headline text-2xl">Edit Job Order #{jobOrderId.substring(0,6)}</CardTitle>
          </div>
          <CardDescription>Update the details for this job order.</CardDescription>
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
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a customer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
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
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value} disabled={!selectedCustomerId || filteredMotorcycles.length === 0}>
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
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
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
                      <Textarea placeholder="Describe the issue or customer request..." {...field} rows={3}/>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <Separator />
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Services Performed</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendService({ id: Date.now().toString(), serviceId: "", serviceName: "", laborCost: 0, notes: "", assignedMechanicId: undefined })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Service
                  </Button>
                </div>
                {serviceFields.map((item, index) => (
                  <Card key={item.id} className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name={`servicesPerformed.${index}.serviceId`}
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Service</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                const selectedService = availableServices.find(s => s.id === value);
                                form.setValue(`servicesPerformed.${index}.serviceName`, selectedService?.name || "");
                                form.setValue(`servicesPerformed.${index}.laborCost`, selectedService?.defaultLaborCost || 0);
                              }} 
                              value={field.value} 
                            >
                              <FormControl><SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {availableServices.map(service => (
                                  <SelectItem key={service.id} value={service.id}>{service.name} ({currency}{service.defaultLaborCost.toFixed(2)})</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`servicesPerformed.${index}.laborCost`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Labor Cost</FormLabel>
                            <FormControl>
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">{currency}</span>
                                <Input type="number" step="0.01" {...field} className="pl-8" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                     <FormField
                        control={form.control}
                        name={`servicesPerformed.${index}.assignedMechanicId`}
                        render={({ field }) => ( 
                          <FormItem>
                            <FormLabel>Assigned Mechanic (Optional)</FormLabel>
                            <Select 
                              onValueChange={(selectedValueFromSelector) => {
                                field.onChange(selectedValueFromSelector === NO_MECHANIC_DISPLAY_VALUE ? undefined : selectedValueFromSelector);
                              }} 
                              value={field.value} 
                            >
                              <FormControl><SelectTrigger><SelectValue placeholder="Select mechanic" /></SelectTrigger></FormControl>
                              <SelectContent>
                                <SelectItem value={NO_MECHANIC_DISPLAY_VALUE}>None</SelectItem>
                                {availableMechanics
                                 .filter(mech => mech.id && mech.id.trim() !== "") 
                                 .map(mech => (
                                  <SelectItem key={mech.id} value={mech.id}>{mech.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    <FormField
                        control={form.control}
                        name={`servicesPerformed.${index}.notes`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Service Notes (Optional)</FormLabel>
                            <FormControl><Textarea placeholder="Notes for this service..." {...field} rows={2} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeService(index)} className="text-destructive hover:text-destructive/90">
                      <Trash2 className="mr-2 h-4 w-4" /> Remove Service
                    </Button>
                  </Card>
                ))}
                {serviceFields.length === 0 && <p className="text-sm text-muted-foreground">No services added yet.</p>}
              </div>
               <FormField
                  control={form.control}
                  name="servicesDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Service Notes / Overall (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="General notes about services..." {...field} rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <Separator />
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Parts Used</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendPart({ id: Date.now().toString(), partId: "", partName: "", quantity: 1, pricePerUnit: 0, totalPrice: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Part
                  </Button>
                </div>
                {partFields.map((item, index) => (
                  <Card key={item.id} className="p-4 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                       <FormField
                        control={form.control}
                        name={`partsUsed.${index}.partId`}
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Part</FormLabel>
                            <Select 
                              onValueChange={(value) => {
                                field.onChange(value);
                                const selectedPart = availableParts.find(p => p.id === value);
                                form.setValue(`partsUsed.${index}.partName`, selectedPart?.name || "");
                                form.setValue(`partsUsed.${index}.pricePerUnit`, selectedPart?.price || 0);
                                const qty = form.getValues(`partsUsed.${index}.quantity`) || 1;
                                form.setValue(`partsUsed.${index}.totalPrice`, (selectedPart?.price || 0) * qty);
                              }} 
                              value={field.value} 
                            >
                              <FormControl><SelectTrigger><SelectValue placeholder="Select a part" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {availableParts.map(part => (
                                  <SelectItem key={part.id} value={part.id}>{part.name} (Stock: {part.stockQuantity}, Price: {currency}{part.price.toFixed(2)})</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`partsUsed.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                min="1"
                                {...field} 
                                onChange={e => {
                                  const qty = parseInt(e.target.value, 10) || 0;
                                  field.onChange(qty);
                                  const pricePerUnit = form.getValues(`partsUsed.${index}.pricePerUnit`) || 0;
                                  form.setValue(`partsUsed.${index}.totalPrice`, pricePerUnit * qty);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                       <FormItem>
                          <FormLabel>Total Price</FormLabel>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">{currency}</span>
                            <Input 
                              type="number" 
                              value={form.getValues(`partsUsed.${index}.totalPrice`).toFixed(2)} 
                              readOnly 
                              className="pl-8 bg-muted/50" 
                            />
                          </div>
                        </FormItem>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removePart(index)} className="text-destructive hover:text-destructive/90">
                       <Trash2 className="mr-2 h-4 w-4" /> Remove Part
                    </Button>
                  </Card>
                ))}
                {partFields.length === 0 && <p className="text-sm text-muted-foreground">No parts added yet.</p>}
              </div>
              <FormField
                  control={form.control}
                  name="partsDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Part Notes / Overall (Optional)</FormLabel>
                      <FormControl>
                        <Textarea placeholder="General notes about parts..." {...field} rows={2} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

              <Separator />
               <Card className="bg-muted/20 p-2">
                <CardHeader className="p-2 pb-0"><CardTitle className="text-lg">Cost Calculation</CardTitle></CardHeader>
                <CardContent className="p-2 space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total Labor Cost:</span>
                        <span className="text-sm font-semibold">{currency}{totalLaborCost.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Total Parts Cost:</span>
                        <span className="text-sm font-semibold">{currency}{totalPartsCost.toFixed(2)}</span>
                    </div>
                    <FormField
                      control={form.control}
                      name="discountAmount"
                      render={({ field }) => (
                        <FormItem className="flex justify-between items-center">
                          <FormLabel className="text-sm font-medium">Discount Amount:</FormLabel>
                          <div className="relative w-32">
                            <span className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground">{currency}</span>
                            <Input 
                              type="number" step="0.01" placeholder="0.00" {...field} 
                              className="pl-6 h-8 text-sm" 
                              onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} />
                          </div>
                           <FormMessage className="text-xs col-span-full" />
                        </FormItem>
                      )}
                    />
                </CardContent>
              </Card>

              <Card className="bg-primary/10">
                <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold">Grand Total:</span>
                        <span className="text-2xl font-bold text-primary">{currency}{grandTotal.toFixed(2)}</span>
                    </div>
                </CardContent>
              </Card>


              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                  name="actualCompletionDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Actual Completion Date (Optional)</FormLabel>
                      <DatePicker 
                        value={field.value}
                        onChange={field.onChange}
                        placeholder="Select actual date"
                        disabled={(date) => date > new Date()}
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
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
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
                  {form.formState.isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
