
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { PlusCircle, Wrench, Pencil, Trash2, Search } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../../../components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../../../components/ui/alert-dialog";
import { useToast } from "../../../../hooks/use-toast";
import type { Service, ShopSettings } from "../../../../types";
import { Badge } from "../../../../components/ui/badge";
import { COMMISSION_TYPES } from "../../../../lib/constants";
import { Input } from "../../../../components/ui/input";

const initialServices: Service[] = [
  {
    id: "svc1",
    name: "Oil Change",
    category: "Maintenance",
    defaultLaborCost: 2500, 
    estimatedHours: 1,
    isActive: true,
    commissionType: COMMISSION_TYPES.FIXED,
    commissionValue: 250, 
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "svc2",
    name: "Tire Replacement",
    category: "Wheels",
    defaultLaborCost: 3750, 
    estimatedHours: 1.5,
    isActive: true,
    commissionType: COMMISSION_TYPES.PERCENTAGE,
    commissionValue: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "svc3",
    name: "Engine Tune-up",
    category: "Engine",
    defaultLaborCost: 7500, 
    estimatedHours: 3,
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

if (typeof window !== 'undefined') {
  if (!(window as any).__serviceStore) {
    (window as any).__serviceStore = {
      services: [...initialServices],
      addService: (service: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newService: Service = {
          ...service,
          id: String(Date.now()),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        (window as any).__serviceStore.services.push(newService);
        return newService;
      },
      updateService: (updatedService: Service) => {
        const index = (window as any).__serviceStore.services.findIndex((s: Service) => s.id === updatedService.id);
        if (index !== -1) {
          (window as any).__serviceStore.services[index] = { ...updatedService, updatedAt: new Date() };
          return true;
        }
        return false;
      },
      deleteService: (serviceId: string) => {
        (window as any).__serviceStore.services = (window as any).__serviceStore.services.filter((s: Service) => s.id !== serviceId);
        return true;
      },
      getServiceById: (serviceId: string) => {
        return (window as any).__serviceStore.services.find((s: Service) => s.id === serviceId);
      }
    };
  } else {
     if ((window as any).__serviceStore && (!(window as any).__serviceStore.services || (window as any).__serviceStore.services.length === 0)) {
        (window as any).__serviceStore.services = [...initialServices];
    }
  }
}

export default function ServicesPage() {
  const { toast } = useToast();
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState<Service | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);

  const currency = useMemo(() => shopSettings?.currencySymbol || '₱', [shopSettings]);

  const refreshServices = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).__serviceStore) {
      const storeServices = (window as any).__serviceStore.services;
       setAllServices(prevServices => {
        if (JSON.stringify(storeServices) !== JSON.stringify(prevServices)) {
          return [...storeServices];
        }
        return prevServices;
      });
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      if ((window as any).__serviceStore) {
        const storeServices = (window as any).__serviceStore.services;
        if (storeServices && storeServices.length > 0) {
            setAllServices([...storeServices]);
        } else if (initialServices.length > 0 && (!storeServices || storeServices.length === 0)) {
            (window as any).__serviceStore.services = [...initialServices];
            setAllServices([...initialServices]);
        }
      }
      if ((window as any).__settingsStore) {
        setShopSettings((window as any).__settingsStore.getSettings());
      }
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;

    const interval = setInterval(() => {
      refreshServices();
    }, 1000);
    return () => clearInterval(interval);
  }, [isMounted, refreshServices]);

  const handleDeleteService = (service: Service) => {
    setServiceToDelete(service);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (serviceToDelete) {
      if (typeof window !== 'undefined' && (window as any).__serviceStore) {
        (window as any).__serviceStore.deleteService(serviceToDelete.id);
        refreshServices();
        toast({
          title: "Service Deleted",
          description: `Service "${serviceToDelete.name}" has been successfully deleted.`,
        });
      }
    }
    setShowDeleteDialog(false);
    setServiceToDelete(null);
  };
  
  const filteredServices = useMemo(() => {
    if (!searchTerm) return allServices;
    const lowercasedFilter = searchTerm.toLowerCase();
    return allServices.filter(service =>
      service.name.toLowerCase().includes(lowercasedFilter) ||
      (service.category && service.category.toLowerCase().includes(lowercasedFilter))
    );
  }, [allServices, searchTerm]);

  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><p>Loading services...</p></div>; 
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Wrench className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-2xl">Services</CardTitle>
            </div>
            <CardDescription>Manage the services offered by your workshop.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search services..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/dashboard/services/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Service
              </Link>
            </Button>
           </div>
        </CardHeader>
        <CardContent>
          {filteredServices.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Labor Cost</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredServices.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>{service.category || "-"}</TableCell>
                    <TableCell>{currency}{service.defaultLaborCost.toFixed(2)}</TableCell>
                    <TableCell>
                      {service.commissionType && service.commissionValue !== undefined 
                        ? `${service.commissionType === COMMISSION_TYPES.FIXED ? currency : ''}${service.commissionValue}${service.commissionType === COMMISSION_TYPES.PERCENTAGE ? '%' : ''} (${service.commissionType})`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={service.isActive ? "default" : "secondary"}>
                        {service.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild className="hover:text-primary">
                        <Link href={`/dashboard/services/${service.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="hover:text-destructive"
                        onClick={() => handleDeleteService(service)}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-10 text-muted-foreground">
                <Wrench className="h-16 w-16" />
                <p className="text-lg">{searchTerm ? "No services match your search." : "No services found."}</p>
                {!searchTerm && <p>Get started by adding a new service.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the service "{serviceToDelete?.name}" from your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setServiceToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
