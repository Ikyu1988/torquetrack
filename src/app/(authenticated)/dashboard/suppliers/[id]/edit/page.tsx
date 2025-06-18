
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
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
import { ArrowLeft, Truck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useParams } from "next/navigation";
import type { Supplier } from "@/types";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

const supplierFormSchema = z.object({
  name: z.string().min(1, { message: "Supplier name is required." }).max(100),
  contactPerson: z.string().max(100).optional().or(z.literal('')),
  email: z.string().email({ message: "Invalid email address." }).max(100).optional().or(z.literal('')),
  phone: z.string().max(30).optional().or(z.literal('')),
  address: z.string().max(200).optional().or(z.literal('')),
  productCatalogNotes: z.string().max(500).optional().or(z.literal('')),
  performanceNotes: z.string().max(500).optional().or(z.literal('')),
  isActive: z.boolean(),
});

type SupplierFormValues = z.infer<typeof supplierFormSchema>;

export default function EditSupplierPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const supplierId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const form = useForm<SupplierFormValues>({
    resolver: zodResolver(supplierFormSchema),
    defaultValues: {
      name: "",
      contactPerson: "",
      email: "",
      phone: "",
      address: "",
      productCatalogNotes: "",
      performanceNotes: "",
      isActive: true,
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (supplierId && isMounted) {
      setIsLoading(true);
      let supplierData: Supplier | undefined;
      if (typeof window !== 'undefined' && (window as any).__supplierStore) {
        supplierData = (window as any).__supplierStore.getSupplierById(supplierId);
      }

      if (supplierData) {
        form.reset({
          name: supplierData.name,
          contactPerson: supplierData.contactPerson || "",
          email: supplierData.email || "",
          phone: supplierData.phone || "",
          address: supplierData.address || "",
          productCatalogNotes: supplierData.productCatalogNotes || "",
          performanceNotes: supplierData.performanceNotes || "",
          isActive: supplierData.isActive,
        });
      } else {
        toast({
          title: "Error",
          description: "Supplier not found.",
          variant: "destructive",
        });
        router.push("/dashboard/suppliers");
      }
      setIsLoading(false);
    }
  }, [supplierId, form, router, toast, isMounted]);

  function onSubmit(data: SupplierFormValues) {
    let success = false;
    if (typeof window !== 'undefined' && (window as any).__supplierStore) {
      const existingSupplier = (window as any).__supplierStore.getSupplierById(supplierId);
      if (existingSupplier) {
        const updatedSupplierData: Supplier = {
          ...existingSupplier,
          ...data,
          updatedAt: new Date(),
        };
        success = (window as any).__supplierStore.updateSupplier(updatedSupplierData);
      }
    }

    if (success) {
      toast({
        title: "Supplier Updated",
        description: `Supplier "${data.name}" has been successfully updated.`,
      });
      router.push("/dashboard/suppliers");
    } else {
       toast({
        title: "Error",
        description: "Failed to update supplier. Please try again.",
        variant: "destructive",
      });
    }
  }
  
  if (!isMounted || isLoading) {
    const message = !isMounted ? "Loading form..." : "Loading supplier data...";
    return <div className="flex justify-center items-center h-screen"><p>{message}</p></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="mb-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard/suppliers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Suppliers
          </Link>
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Truck className="h-6 w-6 text-primary" />
            <CardTitle className="font-headline text-2xl">Edit Supplier</CardTitle>
          </div>
          <CardDescription>Update the details for this supplier.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Global Moto Parts Inc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="contactPerson"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Person (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 555-123-4567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (Optional)</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="e.g., sales@supplier.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="123 Supplier Lane, Business City, Country"
                        className="resize-none"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
               <FormField
                control={form.control}
                name="productCatalogNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Catalog / Pricing Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notes on products they supply, pricing tiers, etc."
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
                name="performanceNotes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Performance Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Notes on supplier reliability, delivery times, quality, etc."
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
                        Inactive suppliers cannot be selected for new purchase orders.
                      </CardDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        aria-readonly
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard/suppliers")}>
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
