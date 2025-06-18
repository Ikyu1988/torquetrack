
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
import { Settings as SettingsIcon, Building, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ShopSettings } from "@/types";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";

const settingsFormSchema = z.object({
  shopName: z.string().min(1, "Shop name is required.").max(100),
  shopAddress: z.string().max(200).optional().or(z.literal('')),
  shopPhone: z.string().max(30).optional().or(z.literal('')),
  shopEmail: z.string().email("Invalid email address.").max(100).optional().or(z.literal('')),
  currencySymbol: z.string().min(1, "Currency symbol is required.").max(5),
  defaultTaxRate: z.coerce.number().min(0, "Tax rate must be non-negative.").max(100, "Tax rate cannot exceed 100%.").optional().or(z.literal('')),
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

const initialSettings: ShopSettings = {
  shopName: "TorqueTrack Workshop",
  shopAddress: "123 Main Street, Anytown, USA 12345",
  shopPhone: "555-123-4567",
  shopEmail: "contact@torquetrack.com",
  currencySymbol: "$",
  defaultTaxRate: 7.5,
  updatedAt: new Date(),
};

if (typeof window !== 'undefined') {
  if (!(window as any).__settingsStore) {
    (window as any).__settingsStore = {
      settings: { ...initialSettings },
      getSettings: () => (window as any).__settingsStore.settings,
      updateSettings: (newSettings: Partial<ShopSettings>) => {
        (window as any).__settingsStore.settings = {
          ...(window as any).__settingsStore.settings,
          ...newSettings,
          updatedAt: new Date(),
        };
        return (window as any).__settingsStore.settings;
      },
    };
  }
}

export default function SettingsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsFormSchema),
    defaultValues: {
      shopName: "",
      shopAddress: "",
      shopPhone: "",
      shopEmail: "",
      currencySymbol: "$",
      defaultTaxRate: undefined,
    },
  });

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted) {
      setIsLoading(true);
      let currentSettings: ShopSettings | undefined;
      if (typeof window !== 'undefined' && (window as any).__settingsStore) {
        currentSettings = (window as any).__settingsStore.getSettings();
      }

      if (currentSettings) {
        form.reset({
          shopName: currentSettings.shopName,
          shopAddress: currentSettings.shopAddress || "",
          shopPhone: currentSettings.shopPhone || "",
          shopEmail: currentSettings.shopEmail || "",
          currencySymbol: currentSettings.currencySymbol,
          defaultTaxRate: currentSettings.defaultTaxRate === undefined ? '' : currentSettings.defaultTaxRate,
        });
      }
      setIsLoading(false);
    }
  }, [form, isMounted]);

  function onSubmit(data: SettingsFormValues) {
    let updatedSettings: ShopSettings | null = null;
    if (typeof window !== 'undefined' && (window as any).__settingsStore) {
      updatedSettings = (window as any).__settingsStore.updateSettings({
        ...data,
        defaultTaxRate: data.defaultTaxRate === '' ? undefined : Number(data.defaultTaxRate),
      });
    }

    if (updatedSettings) {
      toast({
        title: "Settings Saved",
        description: "Your shop settings have been successfully updated.",
      });
      // Optionally re-fetch or update form if needed, though reset might not be desired here
      // form.reset(updatedSettings); 
    } else {
      toast({
        title: "Error",
        description: "Failed to save settings. Please try again.",
        variant: "destructive",
      });
    }
  }

  if (!isMounted || isLoading) {
    return <div className="flex justify-center items-center h-screen"><p>Loading settings...</p></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <SettingsIcon className="h-7 w-7 text-primary" />
            <div>
              <CardTitle className="font-headline text-3xl">Application Settings</CardTitle>
              <CardDescription>Manage your workshop's information and preferences.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-10">
              
              <Card className="shadow-md">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Building className="h-5 w-5 text-muted-foreground"/>
                        <CardTitle className="text-xl">Shop Information</CardTitle>
                    </div>
                  <CardDescription>Update your workshop's public details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="shopName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Your Workshop Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="shopAddress"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop Address (Optional)</FormLabel>
                        <FormControl>
                          <Textarea placeholder="123 Main St, Anytown, USA" className="resize-none" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="shopPhone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shop Phone (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="555-123-4567" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="shopEmail"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Shop Email (Optional)</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="contact@yourshop.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>

              <Separator />

              <Card className="shadow-md">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <DollarSign className="h-5 w-5 text-muted-foreground"/>
                        <CardTitle className="text-xl">Financial Settings</CardTitle>
                    </div>
                  <CardDescription>Configure currency and default tax rate for calculations.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="currencySymbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency Symbol</FormLabel>
                          <FormControl>
                            <Input placeholder="$" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="defaultTaxRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Tax Rate (%) (Optional)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="e.g., 7.5" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
              
              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={form.formState.isSubmitting} size="lg">
                  {form.formState.isSubmitting ? "Saving..." : "Save Settings"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
