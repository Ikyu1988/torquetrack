
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
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
import { ShoppingCart, PlusCircle, Trash2, Printer, Eye, ClipboardList } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { JobOrder, Customer, Part, PaymentMethod, ShopSettings } from "@/types";
import { useEffect, useState, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { JOB_ORDER_STATUSES, PAYMENT_STATUSES, PAYMENT_METHOD_OPTIONS } from "@/lib/constants";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const directSalePartItemSchema = z.object({
  id: z.string(), 
  partId: z.string().min(1, "Part selection is required."),
  partName: z.string(), 
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1."),
  pricePerUnit: z.coerce.number().min(0), 
  totalPrice: z.coerce.number().min(0), 
});

const directSaleFormSchema = z.object({
  customerId: z.string().optional(), 
  partsUsed: z.array(directSalePartItemSchema).min(1, { message: "At least one part must be added to the sale." }),
  discountAmount: z.coerce.number().min(0, "Discount must be non-negative.").optional().or(z.literal('')),
  paymentMethod: z.enum(PAYMENT_METHOD_OPTIONS),
  paymentNotes: z.string().max(250).optional().or(z.literal('')),
});

type DirectSaleFormValues = z.infer<typeof directSaleFormSchema>;

const WALK_IN_CUSTOMER_IDENTIFIER = "__walk_in_special_value__";

type AddJobOrderInput = Omit<JobOrder, 'id' | 'createdAt' | 'updatedAt' | 'createdByUserId' | 'grandTotal' | 'amountPaid' | 'paymentHistory' | 'taxAmount'> & {
  initialPaymentMethod?: PaymentMethod;
  initialPaymentNotes?: string;
  taxAmount?: number;
};


export default function DirectSalesPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [availableParts, setAvailableParts] = useState<Part[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [completedSales, setCompletedSales] = useState<JobOrder[]>([]);

  const currency = useMemo(() => shopSettings?.currencySymbol || '₱', [shopSettings]);

  const customerMap = useMemo(() => {
    const map = new Map<string, string>();
    customers.forEach(c => map.set(c.id, `${c.firstName} ${c.lastName}`));
    return map;
  }, [customers]);

  const form = useForm<DirectSaleFormValues>({
    resolver: zodResolver(directSaleFormSchema),
    defaultValues: {
      customerId: undefined,
      partsUsed: [],
      discountAmount: undefined,
      paymentMethod: "Cash",
      paymentNotes: "",
    },
  });

  const { fields: partFields, append: appendPart, remove: removePart } = useFieldArray({
    control: form.control,
    name: "partsUsed",
  });

  const partsUsedWatch = form.watch("partsUsed");
  const discountAmountWatch = form.watch("discountAmount") || 0;

  const subTotalParts = useMemo(() => {
    return partsUsedWatch.reduce((sum, item) => sum + (Number(item.totalPrice) || 0), 0);
  }, [partsUsedWatch]);

  const calculatedTaxAmountForDisplay = useMemo(() => {
    if (!shopSettings || shopSettings.defaultTaxRate === undefined || shopSettings.defaultTaxRate <= 0) return 0;
    const currentSubTotalNet = subTotalParts - (Number(discountAmountWatch) || 0);
    return currentSubTotalNet * (shopSettings.defaultTaxRate / 100);
  }, [subTotalParts, discountAmountWatch, shopSettings]);

  const grandTotal = useMemo(() => {
    const currentSubTotalNet = subTotalParts - (Number(discountAmountWatch) || 0);
    return currentSubTotalNet + calculatedTaxAmountForDisplay;
  }, [subTotalParts, discountAmountWatch, calculatedTaxAmountForDisplay]);

  const fetchAndSetData = () => {
    if (typeof window !== 'undefined') {
      if ((window as any).__customerStore) setCustomers((window as any).__customerStore.customers);
      if ((window as any).__inventoryStore) setAvailableParts((window as any).__inventoryStore.parts.filter((p: Part) => p.isActive && p.stockQuantity > 0));
      if ((window as any).__settingsStore) setShopSettings((window as any).__settingsStore.getSettings());
      if ((window as any).__jobOrderStore) {
        const allJobOrders: JobOrder[] = (window as any).__jobOrderStore.jobOrders || [];
        const sales = allJobOrders.map(jo => (window as any).__jobOrderStore.getJobOrderById ? (window as any).__jobOrderStore.getJobOrderById(jo.id) : jo).filter(Boolean).filter(jo => jo.status === JOB_ORDER_STATUSES.SALE_COMPLETED);
        setCompletedSales(sales);
      }
    }
  };

  useEffect(() => {
    setIsMounted(true);
    fetchAndSetData();
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const interval = setInterval(fetchAndSetData, 2000); // Refresh data periodically
    return () => clearInterval(interval);
  }, [isMounted]);


  function onSubmit(data: DirectSaleFormValues) {
    let newSaleOrder: JobOrder | null = null;
    if (typeof window !== 'undefined' && (window as any).__jobOrderStore && typeof (window as any).__jobOrderStore.addJobOrder === 'function') {
        const saleOrderData: AddJobOrderInput = {
            customerId: data.customerId === WALK_IN_CUSTOMER_IDENTIFIER ? undefined : data.customerId,
            motorcycleId: undefined, 
            status: JOB_ORDER_STATUSES.SALE_COMPLETED,
            servicesPerformed: [], 
            partsUsed: data.partsUsed.map(p => ({...p})), 
            diagnostics: "Direct Parts Sale",
            discountAmount: data.discountAmount === '' ? undefined : Number(data.discountAmount),
            paymentStatus: PAYMENT_STATUSES.PAID, 
            initialPaymentMethod: data.paymentMethod, 
            initialPaymentNotes: data.paymentNotes || `Payment for direct sale`,
            taxAmount: calculatedTaxAmountForDisplay,
        };
      
      try {
        newSaleOrder = (window as any).__jobOrderStore.addJobOrder(saleOrderData);

        if (newSaleOrder && typeof newSaleOrder.id === 'string') { // Added check for valid newSaleOrder
          toast({
            title: "Sale Completed",
            description: `Direct sale #${newSaleOrder.id.substring(0,6)} processed successfully. Grand Total: ${currency}${newSaleOrder.grandTotal.toFixed(2)}`,
          });
          form.reset({ customerId: undefined, partsUsed: [], discountAmount: undefined, paymentMethod: "Cash", paymentNotes: "" });
          fetchAndSetData(); // Refresh lists after sale
        } else {
           toast({
            title: "Processing Error",
            description: "Sale processing returned an unexpected result. Please check console for details.",
            variant: "destructive",
          });
          console.error("newSaleOrder was not a valid JobOrder object:", newSaleOrder);
        }
      } catch (e: any) {
        console.error("Error during sale processing:", e);
        toast({
            title: "Store Operation Error",
            description: `Failed to process sale due to a store error: ${e.message || "Unknown error"}`,
            variant: "destructive",
        });
      }
    } else {
       toast({
        title: "Store Not Ready",
        description: "Cannot process sale. The job order system is not available or not fully loaded. Please try reloading or wait a moment.",
        variant: "destructive",
      });
    }
  }
  
  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><p>Loading form...</p></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-6 w-6 text-primary" />
            <CardTitle className="font-headline text-2xl">Direct Parts Sale</CardTitle>
          </div>
          <CardDescription>Create a new sale for parts purchased by a walk-in customer.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer (Optional)</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a customer or leave for Walk-in" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={WALK_IN_CUSTOMER_IDENTIFIER}>Walk-in Customer</SelectItem>
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

              <Separator />
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Parts to Sell</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendPart({ id: Date.now().toString(), partId: "", partName: "", quantity: 1, pricePerUnit: 0, totalPrice: 0 })} className="print:hidden">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Part
                  </Button>
                </div>
                {partFields.map((item, index) => (
                  <Card key={item.id} className="p-4 space-y-4 bg-muted/30">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
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
                                {availableParts.length === 0 && <SelectItem value="loading" disabled>No parts available or in stock.</SelectItem>}
                                {availableParts.map(part => (
                                  <SelectItem key={part.id} value={part.id} disabled={part.stockQuantity <=0 } >{part.name} (Stock: {part.stockQuantity}, Price: {currency}{part.price.toFixed(2)})</SelectItem>
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
                              className="pl-7 bg-background" 
                            />
                          </div>
                        </FormItem>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removePart(index)} className="text-destructive hover:text-destructive/90 print:hidden">
                       <Trash2 className="mr-2 h-4 w-4" /> Remove Part
                    </Button>
                  </Card>
                ))}
                {form.formState.errors.partsUsed && !form.formState.errors.partsUsed.root && partFields.length > 0 && (
                    <p className="text-sm font-medium text-destructive">
                        {form.formState.errors.partsUsed.message}
                    </p>
                )}
                {partFields.length === 0 && (
                    <>
                        <p className="text-sm text-muted-foreground p-4 text-center">No parts added to the sale yet.</p>
                        {form.formState.errors.partsUsed?.root && (
                             <p className="text-sm font-medium text-destructive text-center">
                                {form.formState.errors.partsUsed.root.message}
                            </p>
                        )}
                         {form.formState.errors.partsUsed && typeof form.formState.errors.partsUsed === 'string' && (
                            <p className="text-sm font-medium text-destructive text-center">
                                {form.formState.errors.partsUsed}
                            </p>
                        )}
                    </>
                )}
              </div>

              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <Card className="bg-muted/20 p-2">
                    <CardHeader className="p-2 pb-0"><CardTitle className="text-lg">Sale Summary</CardTitle></CardHeader>
                    <CardContent className="p-2 space-y-2">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Subtotal (Parts):</span>
                            <span className="text-sm font-semibold">{currency}{subTotalParts.toFixed(2)}</span>
                        </div>
                        <FormField
                        control={form.control}
                        name="discountAmount"
                        render={({ field }) => (
                            <FormItem className="flex justify-between items-center">
                            <FormLabel className="text-sm font-medium shrink-0 mr-2">Discount:</FormLabel>
                            <div className="relative w-32">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground">{currency}</span>
                                <Input 
                                type="number" step="0.01" placeholder="0.00" {...field} 
                                className="pl-6 h-8 text-sm" 
                                value={field.value === undefined || field.value === null ? '' : field.value} 
                                onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} />
                            </div>
                            <FormMessage className="text-xs col-span-full" />
                            </FormItem>
                        )}
                        />
                         {shopSettings?.defaultTaxRate !== undefined && shopSettings.defaultTaxRate > 0 && (
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium">Tax ({shopSettings.defaultTaxRate}%):</span>
                                <span className="text-sm font-semibold">{currency}{calculatedTaxAmountForDisplay.toFixed(2)}</span>
                            </div>
                        )}
                        <Separator className="my-2"/>
                        <div className="flex justify-between items-center pt-1">
                            <span className="text-lg font-semibold text-primary">Grand Total:</span>
                            <span className="text-xl font-bold text-primary">{currency}{grandTotal.toFixed(2)}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-muted/20 p-2">
                    <CardHeader className="p-2 pb-0"><CardTitle className="text-lg">Payment Details</CardTitle></CardHeader>
                    <CardContent className="p-2 space-y-4">
                        <FormField
                            control={form.control}
                            name="paymentMethod"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Payment Method</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select payment method" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {PAYMENT_METHOD_OPTIONS.map(method => (
                                        <SelectItem key={method} value={method}>{method}</SelectItem>
                                    ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="paymentNotes"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Payment Notes (Optional)</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="e.g., Reference number, quick note" {...field} rows={2} />
                                </FormControl>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                </Card>
              </div>
              
              <div className="flex justify-end gap-4 pt-4 print:hidden">
                <Button type="button" variant="outline" onClick={() => window.print()}>
                  <Printer className="mr-2 h-4 w-4" /> Print Form
                </Button>
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
                  Cancel Sale
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting || grandTotal < 0 || partFields.length === 0} size="lg">
                  {form.formState.isSubmitting ? "Processing..." : `Complete Sale (${currency}${grandTotal.toFixed(2)})`}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Separator className="my-8"/>

      <Card className="shadow-lg">
        <CardHeader>
            <div className="flex items-center gap-3">
                <ClipboardList className="h-6 w-6 text-primary" />
                <CardTitle className="font-headline text-2xl">Completed Direct Sales</CardTitle>
            </div>
            <CardDescription>A list of your recent direct part sales.</CardDescription>
        </CardHeader>
        <CardContent>
            {completedSales.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sale ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Total Amount</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {completedSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="font-medium">{`#${sale.id.substring(0,6)}`}</TableCell>
                    <TableCell>{sale.customerId ? customerMap.get(sale.customerId) || "N/A" : "Walk-in Customer"}</TableCell>
                    <TableCell>{format(new Date(sale.createdAt), "MMM dd, yyyy")}</TableCell>
                    <TableCell className="text-right">{currency}{(sale.grandTotal || 0).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild className="hover:text-primary">
                        <Link href={`/dashboard/job-orders/${sale.id}`}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View Sale Details</span>
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-10 text-muted-foreground">
                <ShoppingCart className="h-16 w-16" />
                <p className="text-lg">No completed direct sales found yet.</p>
                <p>Create a new sale using the form above.</p>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}
