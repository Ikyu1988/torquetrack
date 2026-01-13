
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useFieldArray } from "react-hook-form";
import * as z from "zod";
import { Button } from "../../../../../components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../../../components/ui/form";
import { Input } from "../../../../../components/ui/input";
import { Textarea } from "../../../../../components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../../components/ui/card";
import Link from "next/link";
import { ArrowLeft, FilePlus, PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "../../../../../hooks/use-toast";
import { useRouter } from "next/navigation";
import type { PurchaseRequisition, Part, PurchaseRequisitionItem, ShopSettings } from "../../../../../types";
import { useEffect, useState, useMemo } from "react";
import { Combobox, type ComboboxOption } from "../../../../../components/ui/combobox"; // Updated import
import { Separator } from "../../../../../components/ui/separator";
import { PURCHASE_REQUISITION_STATUSES } from "../../../../../lib/constants";

const requisitionItemSchema = z.object({
  id: z.string(),
  partId: z.string().optional(), 
  partName: z.string().optional(), 
  description: z.string().min(1, "Item description is required.").max(255),
  quantity: z.coerce.number().int().min(1, "Quantity must be at least 1."),
  estimatedPricePerUnit: z.coerce.number().min(0).optional().or(z.literal('')),
  notes: z.string().max(250).optional().or(z.literal('')),
});

const requisitionFormSchema = z.object({
  department: z.string().max(100).optional().or(z.literal('')),
  status: z.nativeEnum(PURCHASE_REQUISITION_STATUSES).default(PURCHASE_REQUISITION_STATUSES.DRAFT),
  items: z.array(requisitionItemSchema).min(1, "At least one item is required."),
  notes: z.string().max(1000).optional().or(z.literal('')),
});

type RequisitionFormValues = z.infer<typeof requisitionFormSchema>;

export default function NewPurchaseRequisitionPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [availableParts, setAvailableParts] = useState<Part[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const currency = useMemo(() => shopSettings?.currencySymbol || '₱', [shopSettings]);

  const partOptions = useMemo((): ComboboxOption[] => {
    return availableParts.map(part => ({
      value: part.id,
      label: `${part.name} (SKU: ${part.sku || 'N/A'})`,
      ...part, // include all part details for easy access on select
    }));
  }, [availableParts]);

  const form = useForm<RequisitionFormValues>({
    resolver: zodResolver(requisitionFormSchema),
    defaultValues: {
      department: "",
      status: PURCHASE_REQUISITION_STATUSES.DRAFT,
      items: [{ id: Date.now().toString(), description: "", quantity: 1, estimatedPricePerUnit: undefined, notes: "" }],
      notes: "",
    },
  });

  const { fields: itemFields, append: appendItem, remove: removeItem } = useFieldArray({
    control: form.control,
    name: "items",
  });

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      if ((window as any).__inventoryStore) setAvailableParts((window as any).__inventoryStore.parts.filter((p: Part) => p.isActive));
      if ((window as any).__settingsStore) setShopSettings((window as any).__settingsStore.getSettings());
    }
  }, []);

  const itemsWatch = form.watch("items");
  const totalEstimatedValue = useMemo(() => {
    return itemsWatch.reduce((sum, item) => {
        const price = Number(item.estimatedPricePerUnit) || 0;
        return sum + (item.quantity * price);
    }, 0);
  }, [itemsWatch]);


  function onSubmit(data: RequisitionFormValues) {
    let newRequisition: PurchaseRequisition | null = null;
    if (typeof window !== 'undefined' && (window as any).__purchaseRequisitionStore) {
      const requisitionData: Omit<PurchaseRequisition, 'id' | 'createdAt' | 'updatedAt' | 'totalEstimatedValue' | 'submittedDate'> = {
        ...data,
        requestedByUserId: "currentUserPlaceholder", 
        items: data.items.map(item => ({
            ...item,
            estimatedPricePerUnit: item.estimatedPricePerUnit === '' ? undefined : Number(item.estimatedPricePerUnit),
        })),
      };
      newRequisition = (window as any).__purchaseRequisitionStore.addRequisition(requisitionData);
    }

    if (newRequisition) {
      toast({
        title: "Requisition Created",
        description: `Purchase Requisition #${newRequisition.id.substring(0,6)} has been successfully created.`,
      });
      router.push("/dashboard/purchase-requisitions");
    } else {
       toast({
        title: "Error",
        description: "Failed to create requisition. Please try again.",
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
          <Link href="/dashboard/purchase-requisitions">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Requisitions
          </Link>
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <FilePlus className="h-6 w-6 text-primary" />
            <CardTitle className="font-headline text-2xl">Create New Purchase Requisition</CardTitle>
          </div>
          <CardDescription>Fill in the details for the items you need to purchase.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="department"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Department (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Service Bay, Parts Department" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Separator />
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Requested Items</h3>
                  <Button type="button" variant="outline" size="sm" onClick={() => appendItem({ id: Date.now().toString(), description: "", quantity: 1, estimatedPricePerUnit: undefined, notes: "" })}>
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
                                <FormLabel>Select Existing Part (Optional)</FormLabel>
                                <Combobox
                                  options={partOptions}
                                  value={field.value}
                                  onChange={(selectedValue, selectedOption) => {
                                    field.onChange(selectedValue);
                                    if (selectedOption) {
                                      form.setValue(`items.${index}.partName`, selectedOption.name);
                                      form.setValue(`items.${index}.description`, selectedOption.name + (selectedOption.brand ? ` (${selectedOption.brand})` : ''));
                                      form.setValue(`items.${index}.estimatedPricePerUnit`, selectedOption.cost || selectedOption.price || 0);
                                    } else {
                                      form.setValue(`items.${index}.partName`, "");
                                      // Optionally clear description and price if part is de-selected
                                      // form.setValue(`items.${index}.description`, "");
                                      // form.setValue(`items.${index}.estimatedPricePerUnit`, undefined);
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
                                <FormControl><Input placeholder="Detailed description of item needed" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                        <FormField
                        control={form.control}
                        name={`items.${index}.quantity`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity</FormLabel>
                            <FormControl><Input type="number" min="1" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`items.${index}.estimatedPricePerUnit`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Est. Price/Unit ({currency}) (Optional)</FormLabel>
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
                     <FormField
                        control={form.control}
                        name={`items.${index}.notes`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Item Notes (Optional)</FormLabel>
                            <FormControl><Textarea placeholder="Specific brand, supplier preference, etc." {...field} rows={2} /></FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
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
               <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Overall Requisition Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Reason for request, urgency, suggested suppliers, etc." {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Card className="bg-muted/20 p-4">
                <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold">Total Estimated Value:</span>
                    <span className="text-xl font-bold text-primary">{currency}{totalEstimatedValue.toFixed(2)}</span>
                </div>
              </Card>
              <div className="flex justify-end gap-4 pt-4">
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard/purchase-requisitions")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting} size="lg">
                  {form.formState.isSubmitting ? "Saving..." : "Submit Requisition"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
