
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
import { ArrowLeft, UserCog } from "lucide-react";
import { useToast } from "../../../../../hooks/use-toast";
import { useRouter } from "next/navigation";
import type { Mechanic } from "../../../../../types";
import { Switch } from "../../../../../components/ui/switch";

const mechanicFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }).max(100, { message: "Name must be 100 characters or less." }),
  specializations: z.string().max(500, { message: "Specializations must be 500 characters or less." }).optional().or(z.literal('')),
  isActive: z.boolean(),
});

type MechanicFormValues = z.infer<typeof mechanicFormSchema>;

export default function NewMechanicPage() {
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<MechanicFormValues>({
    resolver: zodResolver(mechanicFormSchema),
    defaultValues: {
      name: "",
      specializations: "",
      isActive: true,
    },
  });

  function onSubmit(data: MechanicFormValues) {
    let newMechanic: Mechanic | null = null;
    if (typeof window !== 'undefined' && (window as any).__mechanicStore) {
      newMechanic = (window as any).__mechanicStore.addMechanic(data);
    }

    if (newMechanic) {
      toast({
        title: "Mechanic Added",
        description: `${data.name} has been successfully added.`,
      });
      router.push("/dashboard/mechanics");
    } else {
       toast({
        title: "Error",
        description: "Failed to add mechanic. Please try again.",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="flex flex-col gap-6">
       <div className="mb-4">
        <Button variant="outline" asChild>
          <Link href="/dashboard/mechanics">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Mechanics
          </Link>
        </Button>
      </div>
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <UserCog className="h-6 w-6 text-primary" />
            <CardTitle className="font-headline text-2xl">Add New Mechanic</CardTitle>
          </div>
          <CardDescription>Fill in the details below for the new mechanic.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., John Smith" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="specializations"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specializations (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="e.g., Engine repair, Electrical diagnostics, Suspension tuning"
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
                        Inactive mechanics will not be assignable to new job orders.
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
                <Button type="button" variant="outline" onClick={() => router.push("/dashboard/mechanics")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? "Saving..." : "Save Mechanic"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
