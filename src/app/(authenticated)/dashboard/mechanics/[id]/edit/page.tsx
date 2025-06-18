
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
import { ArrowLeft, UserCog } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter, useParams } from "next/navigation";
import type { Mechanic } from "@/types";
import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

const mechanicFormSchema = z.object({
  name: z.string().min(1, { message: "Name is required." }).max(100),
  specializations: z.string().max(500).optional().or(z.literal('')),
  isActive: z.boolean(),
});

type MechanicFormValues = z.infer<typeof mechanicFormSchema>;

export default function EditMechanicPage() {
  const { toast } = useToast();
  const router = useRouter();
  const params = useParams();
  const mechanicId = params.id as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const form = useForm<MechanicFormValues>({
    resolver: zodResolver(mechanicFormSchema),
    defaultValues: {
      name: "",
      specializations: "",
      isActive: true,
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (mechanicId && isMounted) {
      setIsLoading(true);
      let mechanicData: Mechanic | undefined;
      if (typeof window !== 'undefined' && (window as any).__mechanicStore) {
        mechanicData = (window as any).__mechanicStore.getMechanicById(mechanicId);
      }

      if (mechanicData) {
        form.reset({
          name: mechanicData.name,
          specializations: mechanicData.specializations || "",
          isActive: mechanicData.isActive,
        });
      } else {
        toast({
          title: "Error",
          description: "Mechanic not found.",
          variant: "destructive",
        });
        router.push("/dashboard/mechanics");
      }
      setIsLoading(false);
    }
  }, [mechanicId, form, router, toast, isMounted]);

  function onSubmit(data: MechanicFormValues) {
    let success = false;
    if (typeof window !== 'undefined' && (window as any).__mechanicStore) {
      const existingMechanic = (window as any).__mechanicStore.getMechanicById(mechanicId);
      if (existingMechanic) {
        const updatedMechanicData: Mechanic = {
          ...existingMechanic,
          ...data,
          updatedAt: new Date(),
        };
        success = (window as any).__mechanicStore.updateMechanic(updatedMechanicData);
      }
    }

    if (success) {
      toast({
        title: "Mechanic Updated",
        description: `${data.name} has been successfully updated.`,
      });
      router.push("/dashboard/mechanics");
    } else {
       toast({
        title: "Error",
        description: "Failed to update mechanic. Please try again.",
        variant: "destructive",
      });
    }
  }
  
  if (!isMounted || isLoading) {
    const message = !isMounted ? "Loading form..." : "Loading mechanic data...";
    return <div className="flex justify-center items-center h-screen"><p>{message}</p></div>;
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
            <CardTitle className="font-headline text-2xl">Edit Mechanic</CardTitle>
          </div>
          <CardDescription>Update the details for this mechanic.</CardDescription>
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
                        aria-readonly
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
