
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
import Link from "next/link";
import { ArrowLeft, Receipt, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import type { PurchaseOrder, PurchaseOrderItem, Supplier, ShopSettings, PurchaseRequisition, Part } from "@/types";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Combobox, type ComboboxOption } from "@/components/ui/combobox";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import { PURCHASE_ORDER_STATUSES, PURCHASE_REQUISITION_STATUSES } from "@/lib/constants";

const purchaseOrderItemSchema = z.object({
  id: z.string(),
  partId: z.string().optional(),
  partName: z.string().optional(),
  description: z.string().min(1, "Item description is required.").max(255),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1."),
  unitPrice: z.coerce.number().min(0, "Unit price must be non-negative."),
  totalPrice: z.coerce.number().min(0),
});

const purchaseOrderFormSchema = z.object({
  purchaseRequisitionId: z.string().optional(),
  supplierId: z.string().min(1, "A supplier must be selected.").optional(), // Allow undefined initially
  supplierName: z.string().optional(),
  orderDate: z.date(),
  expectedDeliveryDate: z.date().optional(),
  items: z.array(purchaseOrderItemSchema).min(1, "At least one item is required."),
  taxAmount: z.coerce.number().min(0).optional().or(z.literal('')),
  shippingCost: z.coerce.number().min(0).optional().or(z.literal('')),
  paymentTerms: z.string().max(200).optional().or(z.literal('')),
  shippingAddress: z.string().max(200).optional().or(z.literal('')),
  billingAddress: z.string().max(200).optional().or(z.literal('')),
  status: z.nativeEnum(PURCHASE_ORDER_STATUSES).default(PURCHASE_ORDER_STATUSES.DRAFT),
  notes: z.string().max(1000).optional().or(z.literal('')),
}).refine(data => {
  return data.items.every(item => {
      const calculatedTotalPrice = item.quantity * item.unitPrice;
      return Math.abs(calculatedTotalPrice - item.totalPrice) < 0.001;
  });
}, {
  message: "Total price must match quantity * unit price for each item.",
  path: ["items"],
});

type PurchaseOrderFormValues = z.infer<typeof purchaseOrderFormSchema>;

export default function NewPurchaseOrderPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [availableSuppliers, setAvailableSuppliers] = useState<Supplier[]>([]);
  const [availableParts, setAvailableParts] = useState<Part[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const currency = useMemo(() => shopSettings?.currencySymbol || '₱', [shopSettings]);

  const partOptions = useMemo((): ComboboxOption[] => {
    return availableParts.map(part => ({
      value: part.id,
      label: `${part.name} (SKU: ${part.sku || 'N/A'}, Cost: ${currency}${part.cost?.toFixed(2) || part.price.toFixed(2)})`,
      ...part,
    }));
  }, [availableParts, currency]);

  const form = useForm<PurchaseOrderFormValues>({
    resolver: zodResolver(purchaseOrderFormSchema),
    defaultValues: {
      purchaseRequisitionId: undefined,
      supplierId: undefined, // Changed from "" to undefined
      supplierName: "",
      orderDate: new Date(),
      expectedDeliveryDate: undefined,
      items: [],
      taxAmount: undefined,
      shippingCost: undefined,
      paymentTerms: "",
      shippingAddress: "",
      billingAddress: "",
      status: PURCHASE_ORDER_STATUSES.DRAFT,
      notes: "",
    },
  });

  const { fields: itemFields, append: appendItem, remove: removeItem, replace: replaceItems } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const selectedSupplierId = form.watch("supplierId");

  const loadPRItems = useCallback((prId: string) => {
    if (typeof window !== 'undefined' && (window as any).__purchaseRequisitionStore && availableParts.length > 0) {
      const pr = (window as any).__purchaseRequisitionStore.getRequisitionById(prId);
      if (pr) {
        const poItems: z.infer<typeof purchaseOrderItemSchema>[] = pr.items.map(prItem => {
          const selectedPart = availableParts.find(p => p.id === prItem.partId);
          const unitPrice = selectedPart?.cost || selectedPart?.price || prItem.estimatedPricePerUnit || 0;
          const totalPrice = prItem.quantity * unitPrice;
          return {
            id: prItem.id,
            partId: prItem.partId || undefined,
            partName: prItem.partName || selectedPart?.name || "New Item",
            description: prItem.description || selectedPart?.name || "New Item Description",
            quantity: prItem.quantity,
            unitPrice: unitPrice,
            totalPrice: totalPrice,
          };
        });
        replaceItems(poItems);
      } else {
        replaceItems([]);
      }
    }
  }, [availableParts, replaceItems]);


  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      if ((window as any).__supplierStore) setAvailableSuppliers((window as any).__supplierStore.suppliers.filter((s: Supplier) => s.isActive));
      if ((window as any).__inventoryStore) setAvailableParts((window as any).__inventoryStore.parts.filter((p: Part) => p.isActive));
      if ((window as any).__settingsStore) setShopSettings((window as any).__settingsStore.getSettings());
    }
  }, []);

  const purchaseRequisitionIdFromQuery = searchParams.get("requisitionId");
  useEffect(() => {
    if (isMounted && purchaseRequisitionIdFromQuery && availableParts.length > 0) {
        if (!form.getValues("purchaseRequisitionId")) {
            form.setValue("purchaseRequisitionId", purchaseRequisitionIdFromQuery);
        }
        loadPRItems(purchaseRequisitionIdFromQuery);
    }
  }, [isMounted, purchaseRequisitionIdFromQuery, availableParts, loadPRItems, form]);


  useEffect(() => {
    if (selectedSupplierId) {
      const supplier = availableSuppliers.find(s => s.id === selectedSupplierId);
      form.setValue("supplierName", supplier?.name || "");
    } else {
      form.setValue("supplierName", "");
    }
  }, [selectedSupplierId, availableSuppliers, form]);

  const itemsWatch = form.watch("items");
  const subTotal = useMemo(() => {
    return itemsWatch.reduce((sum, item) => sum + (item.totalPrice || 0) , 0);
  }, [itemsWatch]);

  const taxAmount = form.watch("taxAmount");
  const shippingCost = form.watch("shippingCost");
  const grandTotal = useMemo(() => {
    const tax = Number(taxAmount) || 0;
    const ship = Number(shippingCost) || 0;
    return subTotal + tax + ship;
  }, [subTotal, taxAmount, shippingCost]);

  function onSubmit(data: PurchaseOrderFormValues) {
    if (!data.supplierId) {
        toast({
            title: "Supplier Required",
            description: "Please select a supplier for the purchase order.",
            variant: "destructive",
        });
        return;
    }
    let newPurchaseOrder: PurchaseOrder | null = null;
    if (typeof window !== 'undefined' && (window as any).__purchaseOrderStore) {
      const poData: Omit<PurchaseOrder, 'id' | 'createdAt' | 'updatedAt' | 'subTotal' | 'grandTotal'> = {
        ...data,
        supplierId: data.supplierId, // Ensure supplierId is passed
        supplierName: data.supplierName || availableSuppliers.find(s => s.id === data.supplierId)?.name || "",
        items: data.items.map(item => ({
          ...item,
          partId: item.partId || "", 
          totalPrice: item.quantity * item.unitPrice, 
        })),
        taxAmount: data.taxAmount === '' ? undefined : Number(data.taxAmount),
        shippingCost: data.shippingCost === '' ? undefined : Number(data.shippingCost),
        createdByUserId: "currentUserPlaceholder", 
      };
      newPurchaseOrder = (window as any).__purchaseOrderStore.addPurchaseOrder(poData);
    }

    if (newPurchaseOrder) {
      toast({
        title: "Purchase Order Created",
        description: `PO #${newPurchaseOrder.id.substring(0,6)} to ${newPurchaseOrder.supplierName || data.supplierName} has been created.`,
      });
      router.push("/dashboard/purchase-orders");
    } else {
       toast({
        title: "Error",
        description: "Failed to create purchase order. Please try again.",
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
          <Link href="/dashboard/purchase-orders">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Purchase Orders
          </Link>
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Receipt className="h-6 w-6 text-primary" />
            <CardTitle className="font-headline text-2xl">Create New Purchase Order</CardTitle>
          </div>
          <CardDescription>Place an order with one of your suppliers.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="supplierId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Supplier</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value || ""}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a Supplier" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {availableSuppliers.length === 0 && <SelectItem value="loading" disabled>No active suppliers available.</SelectItem>}
                          {availableSuppliers.map(supplier => (
                            <SelectItem key={supplier.id} value={supplier.id}>{supplier.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="orderDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Order Date</FormLabel>
                      <DatePicker value={field.value} onChange={field.onChange} placeholder="Select date" />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="expectedDeliveryDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Expected Delivery Date (Optional)</FormLabel>
                      <DatePicker value={field.value} onChange={field.onChange} placeholder="Select date" />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                      <SelectContent>
                          {Object.values(PURCHASE_ORDER_STATUSES).map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
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
                name="supplierName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Selected Supplier</FormLabel>
                    <FormControl><Input {...field} readOnly className="bg-muted/50" /></FormControl>
                  </FormItem>
                )}
              />

              <Separator />
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Order Items</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendItem({ id: Date.now().toString(), partId: undefined, partName: "", description: "", quantity: 1, unitPrice: 0, totalPrice: 0 })}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Item
                  </Button>
                </div>
                {itemFields.map((item, index) => (
                  <Card key={item.id} className="p-4 space-y-4 bg-muted/30">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                        <FormField
                            control={form.control}
                            name={`items.${index}.partId`}
                            render={({ field }) => (
                            <FormItem className="md:col-span-1">
                                <FormLabel>Select Part (Optional)</FormLabel>
                                <Combobox
                                  options={partOptions}
                                  value={field.value}
                                  onChange={(selectedValue, selectedOption) => {
                                    field.onChange(selectedValue);
                                    if (selectedOption) {
                                      form.setValue(`items.${index}.partName`, selectedOption.name);
                                      form.setValue(`items.${index}.description`, selectedOption.label);
                                      form.setValue(`items.${index}.unitPrice`, selectedOption.cost || selectedOption.price || 0);
                                      const qty = form.getValues(`items.${index}.quantity`) || 1;
                                      form.setValue(`items.${index}.totalPrice`, qty * (selectedOption.cost || selectedOption.price || 0));
                                    } else {
                                       form.setValue(`items.${index}.partName`, "");
                                    }
                                  }}
                                  placeholder="Search for a part..."
                                  searchPlaceholder="Type to search parts..."
                                  emptyPlaceholder="No part found."
                                />
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name={`items.${index}.description`}
                            render={({ field }) => (
                            <FormItem className="md:col-span-2">
                                <FormLabel>Item Description</FormLabel>
                                <FormControl><Input placeholder="Detailed description of item" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                      </div>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                        <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl><Input type="number" min="1" {...field} onChange={e => {
                                    const newQuantity = parseInt(e.target.value, 10) || 1;
                                    field.onChange(newQuantity);
                                    const unitPrice = form.getValues(`items.${index}.unitPrice`);
                                    form.setValue(`items.${index}.totalPrice`, newQuantity * unitPrice);
                                }}  /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.unitPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Unit Price ({currency})</FormLabel>
                            <FormControl>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">{currency}</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    {...field}
                                    className="pl-7"
                                    onChange={e => {
                                        const newUnitPrice = parseFloat(e.target.value) || 0;
                                        field.onChange(newUnitPrice);
                                        const quantity = form.getValues(`items.${index}.quantity`);
                                        form.setValue(`items.${index}.totalPrice`, quantity * newUnitPrice);
                                    }}
                                />
                            </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.totalPrice`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Price ({currency})</FormLabel>
                            <FormControl>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">{currency}</span>
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={field.value?.toFixed(2) || "0.00"}
                                    className="pl-7 bg-muted/50"
                                    readOnly
                                />
                            </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)} className="text-destructive hover:text-destructive/90">
                       <Trash2 className="mr-2 h-4 w-4" /> Remove Item
                    </Button>
                  </Card>
                ))}
                {form.formState.errors.items && !form.formState.errors.items.root && itemFields.length > 0 && (
                    <p className="text-sm font-medium text-destructive">{form.formState.errors.items.message}</p>
                )}
                {itemFields.length === 0 && ( <p className="text-sm text-muted-foreground p-4 text-center">No items added yet.</p>)}
                 {form.formState.errors.items?.root && (
                    <p className="text-sm font-medium text-destructive text-center">{form.formState.errors.items.root.message}</p>
                )}
              </div>
              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField
                    control={form.control}
                    name="taxAmount"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Tax Amount ({currency}) (Optional)</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">{currency}</span>
                                <Input type="number" step="0.01" placeholder="0.00" {...field} className="pl-7" onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} />
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="shippingCost"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Shipping Cost ({currency}) (Optional)</FormLabel>
                        <FormControl>
                            <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground">{currency}</span>
                                <Input type="number" step="0.01" placeholder="0.00" {...field} className="pl-7" onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} />
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                    control={form.control}
                    name="shippingAddress"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Shipping Address (Optional)</FormLabel>
                        <FormControl><Textarea placeholder="Enter shipping address" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="billingAddress"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Billing Address (Optional)</FormLabel>
                        <FormControl><Textarea placeholder="Enter billing address" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
              </div>

              <FormField
                control={form.control}
                name="paymentTerms"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Terms (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Net 30, Upon Receipt" {...field} rows={2} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overall Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Special instructions, contact person" {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Card className="bg-muted/20 p-4">
                <div className="flex justify-between items-center flex-wrap gap-4">
                    <div>
                        <div className="text-sm text-muted-foreground">Subtotal:</div>
                        <div className="text-xl font-bold">{currency}{subTotal.toFixed(2)}</div>
                    </div>
                    <div>
                        <div className="text-sm text-muted-foreground">Shipping:</div>
                        <div className="text-xl font-bold">{currency}{(Number(shippingCost) || 0).toFixed(2)}</div>
                    </div>
                     <div>
                        <div className="text-sm text-muted-foreground">Tax:</div>
                        <div className="text-xl font-bold">{currency}{(Number(taxAmount) || 0).toFixed(2)}</div>
                    </div>
                    <div className="text-right">
                        <div className="text-sm text-muted-foreground">Grand Total:</div>
                        <div className="text-2xl font-bold text-primary">{currency}{grandTotal.toFixed(2)}</div>
                    </div>
                </div>
              </Card>

              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard/purchase-orders")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting} size="lg">
                  {form.formState.isSubmitting ? "Saving..." : "Create Purchase Order"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

    