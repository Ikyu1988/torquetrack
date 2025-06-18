
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Package, Pencil, Trash2 } from "lucide-react";
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
import type { Part } from "@/types";
import { Badge } from "@/components/ui/badge";

const initialParts: Part[] = [
  {
    id: "part1",
    name: "Spark Plug NGK-CR8E",
    brand: "NGK",
    category: "Engine",
    sku: "SPK-NGK-CR8E",
    price: 15.99,
    cost: 8.50,
    supplier: "MotoSupplies Inc.",
    stockQuantity: 50,
    minStockAlert: 10,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "part2",
    name: "Oil Filter Hiflo HF204",
    brand: "Hiflofiltro",
    category: "Engine",
    sku: "OIL-HF-HF204",
    price: 12.50,
    cost: 6.00,
    supplier: "BikeParts Direct",
    stockQuantity: 30,
    minStockAlert: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "part3",
    name: "Brake Pads EBC FA192HH",
    brand: "EBC",
    category: "Brakes",
    sku: "BRK-EBC-FA192HH",
    price: 45.00,
    cost: 25.00,
    supplier: "MotoSupplies Inc.",
    stockQuantity: 20,
    minStockAlert: 5,
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

if (typeof window !== 'undefined') {
  if (!(window as any).__inventoryStore) {
    (window as any).__inventoryStore = {
      parts: [...initialParts],
      addPart: (part: Omit<Part, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newPart: Part = {
          ...part,
          id: String(Date.now()),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        (window as any).__inventoryStore.parts.push(newPart);
        return newPart;
      },
      updatePart: (updatedPart: Part) => {
        const index = (window as any).__inventoryStore.parts.findIndex((p: Part) => p.id === updatedPart.id);
        if (index !== -1) {
          (window as any).__inventoryStore.parts[index] = { ...updatedPart, updatedAt: new Date() };
          return true;
        }
        return false;
      },
      deletePart: (partId: string) => {
        (window as any).__inventoryStore.parts = (window as any).__inventoryStore.parts.filter((p: Part) => p.id !== partId);
        return true;
      },
      getPartById: (partId: string) => {
        return (window as any).__inventoryStore.parts.find((p: Part) => p.id === partId);
      }
    };
  }
}

export default function InventoryPage() {
  const { toast } = useToast();
  const [parts, setParts] = useState<Part[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [partToDelete, setPartToDelete] = useState<Part | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined' && (window as any).__inventoryStore) {
      setParts([...(window as any).__inventoryStore.parts]);
    }
  }, []);

  const refreshParts = () => {
    if (typeof window !== 'undefined' && (window as any).__inventoryStore) {
      setParts([...(window as any).__inventoryStore.parts]);
    }
  };

  useEffect(() => {
    if (!isMounted) return;

    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).__inventoryStore) {
        const storeParts = (window as any).__inventoryStore.parts;
        if (JSON.stringify(storeParts) !== JSON.stringify(parts)) {
          refreshParts();
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [parts, isMounted]);

  const handleDeletePart = (part: Part) => {
    setPartToDelete(part);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (partToDelete) {
      if (typeof window !== 'undefined' && (window as any).__inventoryStore) {
        (window as any).__inventoryStore.deletePart(partToDelete.id);
        refreshParts();
        toast({
          title: "Part Deleted",
          description: `Part "${partToDelete.name}" has been successfully deleted.`,
        });
      }
    }
    setShowDeleteDialog(false);
    setPartToDelete(null);
  };
  
  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><p>Loading inventory...</p></div>; 
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-2xl">Inventory</CardTitle>
            </div>
            <CardDescription>Manage parts, stock levels, and suppliers.</CardDescription>
          </div>
           <Button asChild>
            <Link href="/dashboard/inventory/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Part
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {parts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Brand</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Stock</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {parts.map((part) => (
                  <TableRow key={part.id}>
                    <TableCell className="font-medium">{part.name}</TableCell>
                    <TableCell>{part.sku || "-"}</TableCell>
                    <TableCell>{part.brand || "-"}</TableCell>
                    <TableCell>{part.category || "-"}</TableCell>
                    <TableCell className="text-right">${part.price.toFixed(2)}</TableCell>
                    <TableCell className="text-right">{part.stockQuantity}</TableCell>
                    <TableCell>
                      <Badge variant={part.isActive ? "default" : "secondary"}>
                        {part.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild className="hover:text-primary">
                        <Link href={`/dashboard/inventory/${part.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="hover:text-destructive"
                        onClick={() => handleDeletePart(part)}
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
                <Package className="h-16 w-16" />
                <p className="text-lg">No parts found in inventory.</p>
                <p>Get started by adding a new part.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the part "{partToDelete?.name}" from your inventory.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPartToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
