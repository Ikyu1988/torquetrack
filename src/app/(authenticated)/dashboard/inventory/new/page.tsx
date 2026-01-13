
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { ArrowLeft, Package } from "lucide-react";
import { useToast } from "../../../../../hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Part, ShopSettings } from "../../../../../types";
import { Switch } from "../../../../../components/ui/switch";
import { useEffect, useState, useMemo } from "react";

const partFormSchema = z.object({
  name: z.string().min(1, { message: "Part name is required." }).max(100),
  brand: z.string().max(50).optional().or(z.literal('')),
  category: z.string().max(50).optional().or(z.literal('')),
  sku: z.string().max(50).optional().or(z.literal('')),
  price: z.coerce.number().min(0, { message: "Price must be a positive number." }),
  cost: z.coerce.number().min(0, { message: "Cost must be a positive number." }).optional().or(z.literal('')),
  supplier: z.string().max(100).optional().or(z.literal('')),
  stockQuantity: z.coerce.number().int().min(0, { message: "Stock quantity must be a non-negative integer." }),
  minStockAlert: z.coerce.number().int().min(0, { message: "Min stock alert must be a non-negative integer." }).optional().or(z.literal('')),
  notes: z.string().max(500).optional().or(z.literal('')),
  isActive: z.boolean(),
});

type PartFormValues = z.infer<typeof partFormSchema>;

export default function NewPartPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const currency = useMemo(() => shopSettings?.currencySymbol || '₱', [shopSettings]);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined' && (window as any).__settingsStore) {
      setShopSettings((window as any).__settingsStore.getSettings());
    }
  }, []);

  const form = useForm<PartFormValues>({
    resolver: zodResolver(partFormSchema),
    defaultValues: {
      name: "",
      brand: "",
      category: "",
      sku: "",
      price: 0,
      cost: undefined,
      supplier: "",
      stockQuantity: 0,
      minStockAlert: undefined,
      notes: "",
      isActive: true,
    },
  });

  function onSubmit(data: PartFormValues) {
    let newPart: Part | null = null;
    const partData: Omit<Part, 'id' | 'createdAt' | 'updatedAt'> = {
      ...data,
      cost: data.cost === '' ? undefined : Number(data.cost),
      minStockAlert: data.minStockAlert === '' ? undefined : Number(data.minStockAlert),
    };

    if (typeof window !== 'undefined' && (window as any).__inventoryStore) {
      newPart = (window as any).__inventoryStore.addPart(partData);
    }

    if (newPart) {
      toast({
        title: "Part Added",
        description: `Part "${data.name}" has been successfully added to inventory.`,
      });
      router.push("/dashboard/inventory");
    } else {
       toast({
        title: "Error",
        description: "Failed to add part. Please try again.",
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
          <Link href="/dashboard/inventory">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Inventory
          </Link>
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Package className="h-6 w-6 text-primary" />
            <CardTitle className="font-headline text-2xl">Add New Part</CardTitle>
          </div>
          <CardDescription>Fill in the details below for the new inventory part.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Spark Plug, Oil Filter" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="brand"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., NGK, K&N" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Engine, Electrical, Brakes" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Stock Keeping Unit" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Selling Price ({currency})</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g., 750.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Purchase Cost ({currency}) (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" step="0.01" placeholder="e.g., 400.00" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

               <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Main Parts Co." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="stockQuantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Stock Quantity</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 100" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="minStockAlert"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Min. Stock Alert (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 10" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional details about the part..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Active Status
                      </FormLabel>
                      <CardDescription>
                        Inactive parts will not be available for selection in job orders.
                      </CardDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard/inventory")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : "Save Part"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
