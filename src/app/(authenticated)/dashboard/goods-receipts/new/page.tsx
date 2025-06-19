
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
  FormDescription, // Added FormDescription
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArrowLeft, ArchiveRestore, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useSearchParams } from "next/navigation";
import type { GoodsReceipt, GoodsReceiptItem, PurchaseOrder, Part, ShopSettings, Supplier, PurchaseOrderItem } from "@/types";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import { GOODS_RECEIPT_STATUSES, GOODS_RECEIPT_STATUS_OPTIONS, PURCHASE_ORDER_STATUSES } from "@/lib/constants";

const goodsReceiptItemSchema = z.object({
  id: z.string(), // Corresponds to PurchaseOrderItem.id
  purchaseOrderItemId: z.string(),
  partId: z.string(),
  partName: z.string(),
  quantityOrdered: z.coerce.number().int().min(0),
  quantityReceived: z.coerce.number().int().min(0, "Quantity received must be non-negative."),
  condition: z.string().max(100).optional().or(z.literal('')),
  notes: z.string().max(250).optional().or(z.literal('')),
}).refine(data => data.quantityReceived <= data.quantityOrdered, {
  message: "Quantity received cannot exceed quantity ordered for this item.",
  path: ["quantityReceived"],
});


const goodsReceiptFormSchema = z.object({
  purchaseOrderId: z.string().min(1, "A Purchase Order must be selected."),
  supplierId: z.string(), // Auto-filled from PO
  supplierName: z.string(), // Auto-filled
  receivedDate: z.date(),
  status: z.enum(GOODS_RECEIPT_STATUS_OPTIONS).default(GOODS_RECEIPT_STATUSES.PENDING),
  items: z.array(goodsReceiptItemSchema).min(1, "At least one item must be recorded."),
  notes: z.string().max(1000).optional().or(z.literal('')),
  discrepancies: z.string().max(1000).optional().or(z.literal('')),
});

type GoodsReceiptFormValues = z.infer<typeof goodsReceiptFormSchema>;

export default function NewGoodsReceiptPage() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  const form = useForm<GoodsReceiptFormValues>({
    resolver: zodResolver(goodsReceiptFormSchema),
    defaultValues: {
      purchaseOrderId: "",
      supplierId: "",
      supplierName: "",
      receivedDate: new Date(),
      status: GOODS_RECEIPT_STATUSES.PENDING,
      items: [],
      notes: "",
      discrepancies: "",
    },
  });

  const { fields: itemFields, replace: replaceItems } = useFieldArray({
    control: form.control,
    name: "items",
  });
  
  const selectedPOId = form.watch("purchaseOrderId");

  const loadPOItems = useCallback((poId: string) => {
    if (typeof window !== 'undefined' && (window as any).__purchaseOrderStore) {
      const po = (window as any).__purchaseOrderStore.getPurchaseOrderById(poId);
      if (po) {
        form.setValue("supplierId", po.supplierId);
        const supplier = (window as any).__supplierStore?.getSupplierById(po.supplierId);
        form.setValue("supplierName", supplier?.name || "Unknown Supplier");

        const grItems: GoodsReceiptItem[] = po.items.map((poItem: PurchaseOrderItem) => ({
          id: poItem.id, // Use PO item ID as base
          purchaseOrderItemId: poItem.id,
          partId: poItem.partId,
          partName: poItem.partName,
          quantityOrdered: poItem.quantity,
          quantityReceived: poItem.quantity, // Default to full receipt
          condition: "Good",
          notes: "",
        }));
        replaceItems(grItems);
      } else {
        replaceItems([]);
        form.setValue("supplierId", "");
        form.setValue("supplierName", "");
      }
    }
  }, [form, replaceItems]);


  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      if ((window as any).__purchaseOrderStore) {
        // Filter for POs that are not fully received or cancelled
        setPurchaseOrders((window as any).__purchaseOrderStore.purchaseOrders.filter(
            (po: PurchaseOrder) => po.status === PURCHASE_ORDER_STATUSES.APPROVED || po.status === PURCHASE_ORDER_STATUSES.PARTIALLY_RECEIVED
        ));
      }
      if ((window as any).__supplierStore) setSuppliers((window as any).__supplierStore.suppliers);

      const poIdFromQuery = searchParams.get("purchaseOrderId");
      if (poIdFromQuery) {
        form.setValue("purchaseOrderId", poIdFromQuery);
        loadPOItems(poIdFromQuery);
      }
    }
  }, [searchParams, form, loadPOItems]);

  useEffect(() => {
    if (selectedPOId) {
      loadPOItems(selectedPOId);
    } else {
      replaceItems([]);
      form.setValue("supplierId", "");
      form.setValue("supplierName", "");
    }
  }, [selectedPOId, loadPOItems, replaceItems, form]);


  function onSubmit(data: GoodsReceiptFormValues) {
    let newReceipt: GoodsReceipt | null = null;
    if (typeof window !== 'undefined' && (window as any).__goodsReceiptStore) {
      const receiptData: Omit<GoodsReceipt, 'id' | 'createdAt' | 'updatedAt'> = {
        ...data,
        receivedByUserId: "currentUserPlaceholder", // Replace with actual user ID
      };
      newReceipt = (window as any).__goodsReceiptStore.addGoodsReceipt(receiptData);
      
      // Update PO status if fully received
      if (newReceipt && data.status === GOODS_RECEIPT_STATUSES.COMPLETED && (window as any).__purchaseOrderStore) {
          const po = (window as any).__purchaseOrderStore.getPurchaseOrderById(data.purchaseOrderId);
          if(po) {
              const allItemsReceived = data.items.every(item => item.quantityReceived >= item.quantityOrdered);
              if(allItemsReceived) {
                  po.status = PURCHASE_ORDER_STATUSES.FULLY_RECEIVED;
                  (window as any).__purchaseOrderStore.updatePurchaseOrder(po);
              } else {
                  // If not all items fully received but receipt is 'completed', PO becomes 'partially received'
                  po.status = PURCHASE_ORDER_STATUSES.PARTIALLY_RECEIVED;
                   (window as any).__purchaseOrderStore.updatePurchaseOrder(po);
              }
          }
      }
    }

    if (newReceipt) {
      toast({
        title: "Goods Receipt Created",
        description: `Receipt #${newReceipt.id.substring(0,6)} for PO #${data.purchaseOrderId.substring(0,6)} has been created.`,
      });
      router.push("/dashboard/goods-receipts");
    } else {
       toast({
        title: "Error",
        description: "Failed to create goods receipt. Please try again.",
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
          <Link href="/dashboard/goods-receipts">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Goods Receipts
          </Link>
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <ArchiveRestore className="h-6 w-6 text-primary" />
            <CardTitle className="font-headline text-2xl">Create New Goods Receipt</CardTitle>
          </div>
          <CardDescription>Record items received from a supplier against a Purchase Order.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="purchaseOrderId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Order</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="Select a Purchase Order" /></SelectTrigger></FormControl>
                        <SelectContent>
                          {purchaseOrders.length === 0 && <SelectItem value="loading" disabled>No open POs available.</SelectItem>}
                          {purchaseOrders.map(po => (
                            <SelectItem key={po.id} value={po.id}>PO #{po.id.substring(0,6)} - {suppliers.find(s=>s.id === po.supplierId)?.name || 'N/A'}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="receivedDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Received Date</FormLabel>
                      <DatePicker value={field.value} onChange={field.onChange} placeholder="Select date" />
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
                    <FormLabel>Supplier</FormLabel>
                    <FormControl><Input {...field} readOnly className="bg-muted/50" /></FormControl>
                  </FormItem>
                )}
              />


              <Separator />
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Received Items</h3>
                {itemFields.map((item, index) => (
                  <Card key={item.id} className="p-4 space-y-4 bg-muted/30">
                    <FormField
                        control={form.control}
                        name={`items.${index}.partName`}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Part</FormLabel>
                            <FormControl><Input {...field} readOnly className="bg-muted/70"/></FormControl>
                        </FormItem>
                        )}
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                       <FormField
                            control={form.control}
                            name={`items.${index}.quantityOrdered`}
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Qty Ordered</FormLabel>
                                <FormControl><Input type="number" {...field} readOnly className="bg-muted/70" /></FormControl>
                            </FormItem>
                            )}
                        />
                        <FormField
                        control={form.control}
                        name={`items.${index}.quantityReceived`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Qty Received</FormLabel>
                            <FormControl><Input type="number" min="0" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                        control={form.control}
                        name={`items.${index}.condition`}
                        render={({ field }) => (
                        <FormItem>
                            <FormLabel>Condition (Optional)</FormLabel>
                            <FormControl><Input placeholder="e.g., Good, Damaged Box" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                        )}
                    />
                     <FormField
                        control={form.control}
                        name={`items.${index}.notes`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Notes (Optional)</FormLabel>
                            <FormControl><Textarea placeholder="e.g., Serial numbers, batch codes" {...field} rows={2} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                  </Card>
                ))}
                {itemFields.length === 0 && ( <p className="text-sm text-muted-foreground p-4 text-center">Select a Purchase Order to load items.</p>)}
              </div>
              <Separator />
               <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overall Receipt Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Shipment arrived on time, Driver details" {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="discrepancies"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Discrepancies (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="e.g., Item X short by 2 units, Item Y damaged" {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                  <FormItem>
                      <FormLabel>Receipt Status</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger></FormControl>
                      <SelectContent>
                          {GOODS_RECEIPT_STATUS_OPTIONS.map(option => (
                            <SelectItem key={option} value={option}>{option}</SelectItem>
                          ))}
                      </SelectContent>
                      </Select>
                      <FormDescription>Set to "Completed" to update inventory stock levels.</FormDescription>
                      <FormMessage />
                  </FormItem>
                  )}
              />

              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard/goods-receipts")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting || itemFields.length === 0} size="lg">
                  {form.formState.isSubmitting ? "Saving..." : "Save Goods Receipt"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

