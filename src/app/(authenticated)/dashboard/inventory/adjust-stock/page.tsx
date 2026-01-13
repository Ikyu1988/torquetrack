
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
import { ArrowLeft, Edit } from "lucide-react";
import { useToast } from "../../../../../hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Part } from "../../../../../types";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../../components/ui/select";

const adjustmentTypeSchema = z.enum(["ADD", "REMOVE"]);

const stockAdjustmentFormSchema = z.object({
  partId: z.string().min(1, { message: "Part selection is required." }),
  adjustmentType: adjustmentTypeSchema,
  quantity: z.coerce.number().int().min(1, { message: "Quantity must be a positive integer greater than 0." }),
  notes: z.string().max(250, "Notes must be 250 characters or less.").optional().or(z.literal('')),
});

type StockAdjustmentFormValues = z.infer<typeof stockAdjustmentFormSchema>;

export default function AdjustStockPage() {
  const { toast } = useToast();
  const router = useRouter();
  const [availableParts, setAvailableParts] = useState<Part[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  const form = useForm<StockAdjustmentFormValues>({
    resolver: zodResolver(stockAdjustmentFormSchema),
    defaultValues: {
      partId: "",
      adjustmentType: "ADD",
      quantity: 1,
      notes: "",
    },
  });

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined' && (window as any).__inventoryStore) {
      // Only include active parts that can have their stock adjusted
      setAvailableParts((window as any).__inventoryStore.parts.filter((p: Part) => p.isActive));
    }
  }, []);

  function onSubmit(data: StockAdjustmentFormValues) {
    if (typeof window !== 'undefined' && (window as any).__inventoryStore) {
      const partToAdjust = (window as any).__inventoryStore.getPartById(data.partId);

      if (!partToAdjust) {
        toast({
          title: "Error",
          description: "Selected part not found.",
          variant: "destructive",
        });
        return;
      }

      let newStockQuantity = partToAdjust.stockQuantity;
      if (data.adjustmentType === "ADD") {
        newStockQuantity += data.quantity;
      } else { // REMOVE
        if (data.quantity > partToAdjust.stockQuantity) {
          toast({
            title: "Error",
            description: `Cannot remove ${data.quantity} items. Only ${partToAdjust.stockQuantity} in stock.`,
            variant: "destructive",
          });
          return;
        }
        newStockQuantity -= data.quantity;
      }

      const updatedPartData: Part = {
        ...partToAdjust,
        stockQuantity: newStockQuantity,
        updatedAt: new Date(),
      };

      const success = (window as any).__inventoryStore.updatePart(updatedPartData);

      if (success) {
        toast({
          title: "Stock Adjusted",
          description: `Stock for "${partToAdjust.name}" has been updated to ${newStockQuantity}. Notes: ${data.notes || 'N/A'}`,
        });
        form.reset(); 
        // Optionally, refresh available parts if needed, though not critical here
        if ((window as any).__inventoryStore) {
            setAvailableParts((window as any).__inventoryStore.parts.filter((p: Part) => p.isActive));
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to adjust stock. Please try again.",
          variant: "destructive",
        });
      }
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
            <Edit className="h-6 w-6 text-primary" />
            <CardTitle className="font-headline text-2xl">Adjust Part Stock</CardTitle>
          </div>
          <CardDescription>Manually add or remove stock for an inventory part.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="partId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Part to Adjust</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a part" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableParts.length === 0 && <SelectItem value="loading" disabled>No active parts available.</SelectItem>}
                        {availableParts.map(part => (
                          <SelectItem key={part.id} value={part.id}>
                            {part.name} (Current Stock: {part.stockQuantity})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="adjustmentType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Adjustment Type</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select adjustment type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ADD">Add to Stock</SelectItem>
                          <SelectItem value="REMOVE">Remove from Stock</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="quantity"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity to Adjust</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" placeholder="e.g., 10" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
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
                    <FormLabel>Reason / Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Received new shipment, Stock count correction, Damaged goods"
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard/inventory")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Adjusting..." : "Confirm Adjustment"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
