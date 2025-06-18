
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Building, DollarSign, Palette, ToggleLeft, Image as ImageIcon, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { ShopSettings, ModuleSettings } from "@/types";
import { useEffect, useState, useCallback } from "react";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const moduleSettingsSchema = z.object({
  reportsEnabled: z.boolean().default(true),
  directSalesEnabled: z.boolean().default(true),
  // Add other module toggles here with default values
}).default({ reportsEnabled: true, directSalesEnabled: true });


const settingsFormSchema = z.object({
  shopName: z.string().min(1, "Shop name is required.").max(100),
  shopAddress: z.string().max(200).optional().or(z.literal('')),
  shopPhone: z.string().max(30).optional().or(z.literal('')),
  shopEmail: z.string().email("Invalid email address.").max(100).optional().or(z.literal('')),
  shopLogoUrl: z.string().url("Invalid URL format for logo.").max(255).optional().or(z.literal('')),
  
  currencySymbol: z.string().min(1, "Currency symbol is required.").max(5),
  defaultTaxRate: z.coerce.number().min(0, "Tax rate must be non-negative.").max(100, "Tax rate cannot exceed 100%.").optional().or(z.literal('')),
  defaultLaborRate: z.coerce.number().min(0, "Labor rate must be non-negative.").optional().or(z.literal('')),

  theme: z.enum(['light', 'dark']),
  moduleSettings: moduleSettingsSchema,
});

type SettingsFormValues = z.infer<typeof settingsFormSchema>;

const initialSettings: ShopSettings = {
  shopName: "TorqueTrack Workshop",
  shopAddress: "123 Main Street, Anytown, Philippines 12345",
  shopPhone: "0917-123-4567",
  shopEmail: "contact@torquetrack.ph",
  shopLogoUrl: "",
  currencySymbol: "₱", // Changed to Peso
  defaultTaxRate: 12, // Example VAT
  defaultLaborRate: 500, // Example labor rate in Peso
  theme: 'dark', 
  moduleSettings: {
    reportsEnabled: true,
    directSalesEnabled: true,
  },
  updatedAt: new Date(),
};

if (typeof window !== 'undefined') {
  if (!(window as any).__settingsStore) {
    (window as any).__settingsStore = {
      settings: { ...initialSettings },
      getSettings: (): ShopSettings => (window as any).__settingsStore.settings,
      updateSettings: (newSettings: Partial<ShopSettings>) => {
        (window as any).__settingsStore.settings = {
          ...(window as any).__settingsStore.settings,
          ...newSettings,
          moduleSettings: { 
            ...(window as any).__settingsStore.settings.moduleSettings,
            ...newSettings.moduleSettings,
          },
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
      shopLogoUrl: "",
      currencySymbol: "₱", // Default to Peso in form
      defaultTaxRate: undefined,
      defaultLaborRate: undefined,
      theme: 'dark',
      moduleSettings: {
        reportsEnabled: true,
        directSalesEnabled: true,
      },
    },
  });

  const applyTheme = useCallback((themeValue: 'light' | 'dark') => {
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement;
      root.classList.remove('light', 'dark');
      root.classList.add(themeValue);
      localStorage.setItem('theme', themeValue);
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (storedTheme) {
      applyTheme(storedTheme);
    } else {
      applyTheme(initialSettings.theme);
    }
  }, [applyTheme]);

  useEffect(() => {
    if (isMounted) {
      setIsLoading(true);
      let currentSettings: ShopSettings | undefined;
      if (typeof window !== 'undefined' && (window as any).__settingsStore) {
        currentSettings = (window as any).__settingsStore.getSettings();
      }
      
      const storedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
      const themeToUse = storedTheme || currentSettings?.theme || initialSettings.theme;

      if (currentSettings) {
        form.reset({
          shopName: currentSettings.shopName,
          shopAddress: currentSettings.shopAddress || "",
          shopPhone: currentSettings.shopPhone || "",
          shopEmail: currentSettings.shopEmail || "",
          shopLogoUrl: currentSettings.shopLogoUrl || "",
          currencySymbol: currentSettings.currencySymbol,
          defaultTaxRate: currentSettings.defaultTaxRate === undefined ? '' : currentSettings.defaultTaxRate,
          defaultLaborRate: currentSettings.defaultLaborRate === undefined ? '' : currentSettings.defaultLaborRate,
          theme: themeToUse,
          moduleSettings: {
            reportsEnabled: currentSettings.moduleSettings?.reportsEnabled ?? true,
            directSalesEnabled: currentSettings.moduleSettings?.directSalesEnabled ?? true,
          },
        });
      } else { 
         form.reset({
          ...initialSettings,
          defaultTaxRate: initialSettings.defaultTaxRate === undefined ? '' : initialSettings.defaultTaxRate,
          defaultLaborRate: initialSettings.defaultLaborRate === undefined ? '' : initialSettings.defaultLaborRate,
          theme: themeToUse,
         });
      }
      setIsLoading(false);
    }
  }, [form, isMounted]);

  const themeWatch = form.watch("theme");
  useEffect(() => {
    if (isMounted && themeWatch) {
      applyTheme(themeWatch);
    }
  }, [themeWatch, isMounted, applyTheme]);


  function onSubmit(data: SettingsFormValues) {
    let updatedSettings: ShopSettings | null = null;
    if (typeof window !== 'undefined' && (window as any).__settingsStore) {
      updatedSettings = (window as any).__settingsStore.updateSettings({
        ...data,
        defaultTaxRate: data.defaultTaxRate === '' ? undefined : Number(data.defaultTaxRate),
        defaultLaborRate: data.defaultLaborRate === '' ? undefined : Number(data.defaultLaborRate),
        moduleSettings: data.moduleSettings,
      });
    }

    if (updatedSettings) {
      applyTheme(updatedSettings.theme); 
      toast({
        title: "Settings Saved",
        description: "Your shop settings have been successfully updated.",
      });
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
              <CardDescription>Manage your workshop's information, appearance, and module preferences.</CardDescription>
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
                  <CardDescription>Update your workshop's public details and branding.</CardDescription>
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
                    name="shopLogoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Shop Logo URL (Optional)</FormLabel>
                        <FormControl>
                          <Input type="url" placeholder="https://example.com/logo.png" {...field} />
                        </FormControl>
                         <FormDescription className="flex items-center gap-1 text-xs">
                            <ImageIcon className="h-3 w-3"/> Link to an externally hosted image. Actual upload functionality is not implemented.
                        </FormDescription>
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
                  <CardDescription>Configure currency, default tax, and labor rates.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="currencySymbol"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Currency Symbol</FormLabel>
                          <FormControl>
                            <Input placeholder="₱" {...field} />
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
                            <Input type="number" step="0.01" placeholder="e.g., 12" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                      control={form.control}
                      name="defaultLaborRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Labor Rate (₱/hr) (Optional)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="e.g., 500" {...field} onChange={e => field.onChange(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                   <FormDescription className="text-xs">
                      Commission for services is configured per-service on the Services page.
                  </FormDescription>
                </CardContent>
              </Card>

              <Separator />

              <Card className="shadow-md">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <Palette className="h-5 w-5 text-muted-foreground"/>
                        <CardTitle className="text-xl">Appearance Settings</CardTitle>
                    </div>
                  <CardDescription>Customize the look and feel of the application.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                      control={form.control}
                      name="theme"
                      render={({ field }) => (
                        <FormItem className="max-w-xs">
                          <FormLabel>Application Theme</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select theme" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="light">Light Mode</SelectItem>
                              <SelectItem value="dark">Dark Mode</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                </CardContent>
              </Card>

               <Separator />

              <Card className="shadow-md">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <ToggleLeft className="h-5 w-5 text-muted-foreground"/>
                        <CardTitle className="text-xl">Module Management</CardTitle>
                    </div>
                  <CardDescription>Enable or disable specific application modules.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <FormField
                        control={form.control}
                        name="moduleSettings.reportsEnabled"
                        render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                            <div className="space-y-0.5">
                            <FormLabel className="text-base">Reports Module</FormLabel>
                            <FormDescription>Enable or disable the reporting section.</FormDescription>
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
                    <FormField
                        control={form.control}
                        name="moduleSettings.directSalesEnabled"
                        render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 shadow-sm">
                            <div className="space-y-0.5">
                            <FormLabel className="text-base">Direct Sales Module</FormLabel>
                            <FormDescription>Enable or disable the direct parts sales page.</FormDescription>
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
                     <div className="flex items-start gap-2 p-3 bg-muted/50 rounded-md border border-dashed">
                        <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0"/>
                        <p className="text-xs text-muted-foreground">
                            Note: Toggling modules here saves the preference. Actual hiding/showing of these modules in the sidebar navigation requires further development in the layout components.
                        </p>
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
