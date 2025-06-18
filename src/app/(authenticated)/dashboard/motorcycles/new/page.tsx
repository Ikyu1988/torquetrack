
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
import { ArrowLeft, Bike } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Motorcycle, Customer } from "@/types";
import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const motorcycleFormSchema = z.object({
  customerId: z.string().min(1, { message: "Customer is required." }),
  make: z.string().min(1, { message: "Make is required." }).max(50),
  model: z.string().min(1, { message: "Model is required." }).max(50),
  year: z.preprocess(
    (val) => (val === "" || val === undefined || val === null) ? undefined : parseInt(String(val), 10),
    z.number().int().min(1900, { message: "Year must be 1900 or later."}).max(new Date().getFullYear() + 1, { message: `Year cannot be in the future beyond ${new Date().getFullYear() + 1}.` }).optional()
  ),
  color: z.string().max(30).optional().or(z.literal('')),
  plateNumber: z.string().min(1, { message: "Plate number is required." }).max(20),
  vin: z.string().max(50).optional().or(z.literal('')),
  odometer: z.coerce.number().min(0, { message: "Odometer reading must be positive." }),
  notes: z.string().max(500).optional().or(z.literal('')),
});

type MotorcycleFormValues = z.infer<typeof motorcycleFormSchema>;

export default function NewMotorcyclePage() {
  const { toast } = useToast();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined' && (window as any).__customerStore) {
      setCustomers((window as any).__customerStore.customers);
    }
  }, []);

  const form = useForm<MotorcycleFormValues>({
    resolver: zodResolver(motorcycleFormSchema),
    defaultValues: {
      customerId: "",
      make: "",
      model: "",
      year: undefined,
      color: "",
      plateNumber: "",
      vin: "",
      odometer: 0,
      notes: "",
    },
  });

  function onSubmit(data: MotorcycleFormValues) {
    let newMotorcycle: Motorcycle | null = null;
    const motorcycleData = {
        ...data,
        year: data.year === undefined || isNaN(Number(data.year)) ? undefined : Number(data.year),
    };

    if (typeof window !== 'undefined' && (window as any).__motorcycleStore) {
      newMotorcycle = (window as any).__motorcycleStore.addMotorcycle(motorcycleData);
    }

    if (newMotorcycle) {
      toast({
        title: "Motorcycle Added",
        description: `${data.make} ${data.model} (${data.plateNumber}) has been successfully added.`,
      });
      router.push("/dashboard/motorcycles");
    } else {
       toast({
        title: "Error",
        description: "Failed to add motorcycle. Please try again.",
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
          <Link href="/dashboard/motorcycles">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Motorcycles
          </Link>
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bike className="h-6 w-6 text-primary" />
            <CardTitle className="font-headline text-2xl">Add New Motorcycle</CardTitle>
          </div>
          <CardDescription>Fill in the details below for the new motorcycle.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer / Owner</FormLabel>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="make"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Make</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Honda, Yamaha" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="model"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., CBR600RR, MT-07" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="year"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Year (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 2022" {...field} onChange={e => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value,10))} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Color (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Red, Matte Black" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="plateNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plate Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., ABC 123" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="vin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>VIN (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Vehicle Identification Number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="odometer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Odometer Reading (km/miles)</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g., 15000" {...field} onChange={e => field.onChange(parseInt(e.target.value,10) || 0)} />
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
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Any additional details about the motorcycle."
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
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard/motorcycles")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : "Save Motorcycle"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

