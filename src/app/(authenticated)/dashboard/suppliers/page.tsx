
"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../../../../components/ui/card";
import { Button } from "../../../../components/ui/button";
import { PlusCircle, Truck, Pencil, Trash2, Search } from "lucide-react";
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
import type { Supplier } from "../../../../types";
import { Badge } from "../../../../components/ui/badge";
import { Input } from "../../../../components/ui/input";

const initialSuppliers: Supplier[] = [
  {
    id: "sup1",
    name: "MotoParts International",
    contactPerson: "John Supplier",
    email: "sales@motoparts.com",
    phone: "555-SUP-PLY1",
    address: "1 International Drive, Supplier City",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "sup2",
    name: "Speedy Spares Ltd.",
    contactPerson: "Jane Fast",
    email: "orders@speedyspares.co",
    phone: "555-SPD-SPAR",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

if (typeof window !== 'undefined') {
  if (!(window as any).__supplierStore) {
    (window as any).__supplierStore = {
      suppliers: [...initialSuppliers],
      addSupplier: (supplier: Omit<Supplier, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newSupplier: Supplier = {
          ...supplier,
          id: String(Date.now() + Math.random()),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        (window as any).__supplierStore.suppliers.push(newSupplier);
        return newSupplier;
      },
      updateSupplier: (updatedSupplier: Supplier) => {
        const index = (window as any).__supplierStore.suppliers.findIndex((s: Supplier) => s.id === updatedSupplier.id);
        if (index !== -1) {
          (window as any).__supplierStore.suppliers[index] = { ...updatedSupplier, updatedAt: new Date() };
          return true;
        }
        return false;
      },
      deleteSupplier: (supplierId: string) => {
        (window as any).__supplierStore.suppliers = (window as any).__supplierStore.suppliers.filter((s: Supplier) => s.id !== supplierId);
        return true;
      },
      getSupplierById: (supplierId: string) => {
        return (window as any).__supplierStore.suppliers.find((s: Supplier) => s.id === supplierId);
      }
    };
  } else {
     if ((window as any).__supplierStore && (!(window as any).__supplierStore.suppliers || (window as any).__supplierStore.suppliers.length === 0)) {
        (window as any).__supplierStore.suppliers = [...initialSuppliers];
    }
  }
}

export default function SuppliersPage() {
  const { toast } = useToast();
  const [allSuppliers, setAllSuppliers] = useState<Supplier[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  const refreshSuppliers = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).__supplierStore) {
      const storeSuppliers = (window as any).__supplierStore.suppliers;
      setAllSuppliers(prevSuppliers => {
        if (JSON.stringify(storeSuppliers) !== JSON.stringify(prevSuppliers)) {
          return [...storeSuppliers];
        }
        return prevSuppliers;
      });
    }
  }, []);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined' && (window as any).__supplierStore) {
       const storeSuppliers = (window as any).__supplierStore.suppliers;
        if (storeSuppliers && storeSuppliers.length > 0) {
            setAllSuppliers([...storeSuppliers]);
        } else if (initialSuppliers.length > 0 && (!storeSuppliers || storeSuppliers.length === 0)) {
            (window as any).__supplierStore.suppliers = [...initialSuppliers];
            setAllSuppliers([...initialSuppliers]);
        }
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const interval = setInterval(() => {
      refreshSuppliers();
    }, 1000);
    return () => clearInterval(interval);
  }, [isMounted, refreshSuppliers]);

  const handleDeleteSupplier = (supplier: Supplier) => {
    setSupplierToDelete(supplier);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (supplierToDelete) {
      if (typeof window !== 'undefined' && (window as any).__supplierStore) {
        (window as any).__supplierStore.deleteSupplier(supplierToDelete.id);
        refreshSuppliers();
        toast({
          title: "Supplier Deleted",
          description: `Supplier "${supplierToDelete.name}" has been successfully deleted.`,
        });
      }
    }
    setShowDeleteDialog(false);
    setSupplierToDelete(null);
  };
  
  const filteredSuppliers = useMemo(() => {
    if (!searchTerm) return allSuppliers;
    const lowercasedFilter = searchTerm.toLowerCase();
    return allSuppliers.filter(supplier =>
      supplier.name.toLowerCase().includes(lowercasedFilter) ||
      (supplier.contactPerson && supplier.contactPerson.toLowerCase().includes(lowercasedFilter)) ||
      (supplier.email && supplier.email.toLowerCase().includes(lowercasedFilter)) ||
      (supplier.phone && supplier.phone.toLowerCase().includes(lowercasedFilter))
    );
  }, [allSuppliers, searchTerm]);

  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><p>Loading suppliers...</p></div>; 
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Truck className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-2xl">Suppliers</CardTitle>
            </div>
            <CardDescription>Manage your parts and service suppliers.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search suppliers..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/dashboard/suppliers/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Supplier
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredSuppliers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Contact Person</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id}>
                    <TableCell className="font-medium">{supplier.name}</TableCell>
                    <TableCell>{supplier.contactPerson || "-"}</TableCell>
                    <TableCell>{supplier.email || "-"}</TableCell>
                    <TableCell>{supplier.phone || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={supplier.isActive ? "default" : "secondary"}>
                        {supplier.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild className="hover:text-primary">
                        <Link href={`/dashboard/suppliers/${supplier.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="hover:text-destructive"
                        onClick={() => handleDeleteSupplier(supplier)}
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
                <Truck className="h-16 w-16" />
                <p className="text-lg">{searchTerm ? "No suppliers match your search." : "No suppliers found."}</p>
                {!searchTerm && <p>Get started by adding a new supplier.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the supplier "{supplierToDelete?.name}". Make sure this supplier is not associated with any active Purchase Orders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSupplierToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
