
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
import { ArrowLeft, Wrench } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Service, ShopSettings } from "@/types";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { COMMISSION_TYPES, COMMISSION_TYPE_OPTIONS } from "@/lib/constants";
import { useEffect, useState, useMemo } from "react";

const serviceFormSchema = z.object({
  name: z.string().min(1, { message: "Service name is required." }).max(100),
  description: z.string().max(500).optional().or(z.literal('')),
  category: z.string().max(50).optional().or(z.literal('')),
  defaultLaborCost: z.coerce.number().min(0, { message: "Labor cost must be a positive number." }),
  estimatedHours: z.coerce.number().min(0, { message: "Estimated hours must be positive." }).optional().or(z.literal('')),
  commissionType: z.enum(COMMISSION_TYPE_OPTIONS).optional(),
  commissionValue: z.coerce.number().min(0).optional().or(z.literal('')),
  isActive: z.boolean(),
}).refine(data => {
  if (data.commissionType && (data.commissionValue === undefined || data.commissionValue === '')) {
    return false;
  }
  if (!data.commissionType && (data.commissionValue !== undefined && data.commissionValue !== '')) {
    return false;
  }
  return true;
}, {
  message: "Commission value is required if commission type is selected, and vice-versa.",
  path: ["commissionValue"], 
});

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

export default function NewServicePage() {
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

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "",
      defaultLaborCost: 0,
      estimatedHours: undefined,
      commissionType: undefined,
      commissionValue: undefined,
      isActive: true,
    },
  });

  const commissionType = form.watch("commissionType");

  function onSubmit(data: ServiceFormValues) {
    let newService: Service | null = null;
    const serviceData: Omit<Service, 'id' | 'createdAt' | 'updatedAt'> = {
      ...data,
      estimatedHours: data.estimatedHours === '' ? undefined : Number(data.estimatedHours),
      commissionValue: data.commissionValue === '' ? undefined : Number(data.commissionValue),
    };
    
    if (!data.commissionType) {
      delete serviceData.commissionType;
      delete serviceData.commissionValue;
    }


    if (typeof window !== 'undefined' && (window as any).__serviceStore) {
      newService = (window as any).__serviceStore.addService(serviceData);
    }

    if (newService) {
      toast({
        title: "Service Added",
        description: `Service "${data.name}" has been successfully added.`,
      });
      router.push("/dashboard/services");
    } else {
       toast({
        title: "Error",
        description: "Failed to add service. Please try again.",
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
          <Link href="/dashboard/services">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Services
          </Link>
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Wrench className="h-6 w-6 text-primary" />
            <CardTitle className="font-headline text-2xl">Add New Service</CardTitle>
          </div>
          <CardDescription>Fill in the details below for the new service.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Standard Oil Change" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Briefly describe the service..."
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
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Maintenance, Engine, Electrical" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="defaultLaborCost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Default Labor Cost ({currency})</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 2500.00" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="estimatedHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Hours (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 1.5" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="commissionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission Type (Optional)</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value === "none" ? undefined : value)} value={field.value || "none"}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select commission type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {COMMISSION_TYPE_OPTIONS.map(type => (
                            <SelectItem key={type} value={type}>{type}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {commissionType && (
                  <FormField
                    control={form.control}
                    name="commissionValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Commission Value {commissionType === COMMISSION_TYPES.PERCENTAGE ? "(%)" : `(${currency})`}
                        </FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder={commissionType === COMMISSION_TYPES.PERCENTAGE ? "e.g., 10" : "e.g., 250.00"}
                            {...field} 
                            onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </div>
              

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
                        Inactive services will not be available for new job orders.
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
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard/services")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : "Save Service"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
