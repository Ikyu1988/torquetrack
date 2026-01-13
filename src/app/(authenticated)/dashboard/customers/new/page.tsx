
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
import { ArrowLeft, Users } from "lucide-react";
import { useToast } from "../../../../../hooks/use-toast";
import { useRouter } from "next/navigation"; 
import type { Customer } from "../../../../../types"; // For type consistency

const customerFormSchema = z.object({
  firstName: z.string().min(1, { message: "First name is required." }).max(50, { message: "First name must be 50 characters or less." }),
  lastName: z.string().min(1, { message: "Last name is required." }).max(50, { message: "Last name must be 50 characters or less." }),
  email: z.string().email({ message: "Invalid email address." }).optional().or(z.literal('')),
  phone: z.string().min(1, { message: "Phone number is required." }).max(20, { message: "Phone number must be 20 characters or less." }),
  address: z.string().max(200, { message: "Address must be 200 characters or less." }).optional(),
  notes: z.string().max(500, { message: "Notes must be 500 characters or less." }).optional(),
});

type CustomerFormValues = z.infer<typeof customerFormSchema>;

export default function NewCustomerPage() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<CustomerFormValues>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      notes: "",
    },
  });

  function onSubmit(data: CustomerFormValues) {
    // Simulate API call to save customer
    let newCustomer: Customer | null = null;
    if (typeof window !== 'undefined' && (window as any).__customerStore) {
      newCustomer = (window as any).__customerStore.addCustomer(data);
    }

    if (newCustomer) {
      toast({
        title: "Customer Created",
        description: `${data.firstName} ${data.lastName} has been successfully added.`,
      });
      router.push("/dashboard/customers"); 
      // form.reset(); // Reset form after submission if not redirecting
    } else {
       toast({
        title: "Error",
        description: "Failed to create customer. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="mb-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard/customers">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Customers
          </Link>
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <CardTitle className="font-headline text-2xl">Create New Customer</CardTitle>
          </div>
          <CardDescription>Fill in the details below to add a new customer.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
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
                      <Input type="email" placeholder="john.doe@example.com" {...field} />
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
                    <FormLabel>Phone Number</FormLabel>
                    <FormControl>
                      <Input placeholder="555-123-4567" {...field} />
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
                        placeholder="123 Main St, Anytown, USA"
                        className="resize-none"
                        {...field}
                      />
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
                        placeholder="Any additional information about the customer."
                        className="resize-none"
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard/customers")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : "Save Customer"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
