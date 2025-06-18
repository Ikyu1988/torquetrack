
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Bike, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { Motorcycle, Customer } from "@/types";

// Initial mock data for motorcycles
const initialMotorcycles: Motorcycle[] = [
  {
    id: "m1",
    customerId: "1", // Corresponds to John Doe
    make: "Honda",
    model: "CBR600RR",
    year: 2021,
    plateNumber: "XYZ 123",
    odometer: 1500,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "m2",
    customerId: "2", // Corresponds to Jane Smith
    make: "Yamaha",
    model: "MT-07",
    year: 2022,
    plateNumber: "ABC 789",
    odometer: 800,
    color: "Cyan Storm",
    vin: "YMHMT07CS12345",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

// In-memory store for motorcycles (similar to customers)
if (typeof window !== 'undefined') {
  if (!(window as any).__motorcycleStore) {
    (window as any).__motorcycleStore = {
      motorcycles: [...initialMotorcycles],
      addMotorcycle: (motorcycle: Omit<Motorcycle, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newMotorcycle: Motorcycle = {
          ...motorcycle,
          id: String(Date.now()), // Simple ID generation
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        (window as any).__motorcycleStore.motorcycles.push(newMotorcycle);
        return newMotorcycle;
      },
      updateMotorcycle: (updatedMotorcycle: Motorcycle) => {
        const index = (window as any).__motorcycleStore.motorcycles.findIndex((m: Motorcycle) => m.id === updatedMotorcycle.id);
        if (index !== -1) {
          (window as any).__motorcycleStore.motorcycles[index] = { ...updatedMotorcycle, updatedAt: new Date() };
          return true;
        }
        return false;
      },
      deleteMotorcycle: (motorcycleId: string) => {
        (window as any).__motorcycleStore.motorcycles = (window as any).__motorcycleStore.motorcycles.filter((m: Motorcycle) => m.id !== motorcycleId);
        return true;
      },
      getMotorcycleById: (motorcycleId: string) => {
        return (window as any).__motorcycleStore.motorcycles.find((m: Motorcycle) => m.id === motorcycleId);
      }
    };
  }
}


export default function MotorcyclesPage() {
  const { toast } = useToast();
  const [motorcycles, setMotorcycles] = useState<Motorcycle[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [motorcycleToDelete, setMotorcycleToDelete] = useState<Motorcycle | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      if ((window as any).__motorcycleStore) {
        setMotorcycles([...(window as any).__motorcycleStore.motorcycles]);
      }
      if ((window as any).__customerStore) { 
        setCustomers([...(window as any).__customerStore.customers]);
      }
    }
  }, []);

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? `${customer.firstName} ${customer.lastName}` : "Unknown Owner";
  };

  const refreshMotorcycles = () => {
    if (typeof window !== 'undefined' && (window as any).__motorcycleStore) {
      setMotorcycles([...(window as any).__motorcycleStore.motorcycles]);
    }
  };

  useEffect(() => {
    if (!isMounted) return; // Ensure this runs only after mount

    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).__motorcycleStore) {
        const storeMotorcycles = (window as any).__motorcycleStore.motorcycles;
        if (JSON.stringify(storeMotorcycles) !== JSON.stringify(motorcycles)) {
          refreshMotorcycles();
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [motorcycles, isMounted]); // Added isMounted to dependencies

  const handleDeleteMotorcycle = (motorcycle: Motorcycle) => {
    setMotorcycleToDelete(motorcycle);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (motorcycleToDelete) {
      if (typeof window !== 'undefined' && (window as any).__motorcycleStore) {
        (window as any).__motorcycleStore.deleteMotorcycle(motorcycleToDelete.id);
        refreshMotorcycles();
        toast({
          title: "Motorcycle Deleted",
          description: `${motorcycleToDelete.make} ${motorcycleToDelete.model} (${motorcycleToDelete.plateNumber}) has been successfully deleted.`,
        });
      }
    }
    setShowDeleteDialog(false);
    setMotorcycleToDelete(null);
  };
  
  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><p>Loading motorcycles...</p></div>;
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Bike className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-2xl">Motorcycles</CardTitle>
            </div>
            <CardDescription>Manage customer motorcycles and their details.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/dashboard/motorcycles/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Motorcycle
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {motorcycles.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Make & Model</TableHead>
                  <TableHead>Plate No.</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {motorcycles.map((motorcycle) => (
                  <TableRow key={motorcycle.id}>
                    <TableCell className="font-medium">{`${motorcycle.make} ${motorcycle.model}`}</TableCell>
                    <TableCell>{motorcycle.plateNumber}</TableCell>
                    <TableCell>{getCustomerName(motorcycle.customerId)}</TableCell>
                    <TableCell>{motorcycle.year || "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild className="hover:text-primary">
                        <Link href={`/dashboard/motorcycles/${motorcycle.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="hover:text-destructive"
                        onClick={() => handleDeleteMotorcycle(motorcycle)}
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
                <Bike className="h-16 w-16" />
                <p className="text-lg">No motorcycles found.</p>
                <p>Get started by adding a new motorcycle.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the motorcycle 
              "{motorcycleToDelete?.make} {motorcycleToDelete?.model} ({motorcycleToDelete?.plateNumber})" from your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMotorcycleToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
