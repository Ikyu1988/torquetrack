
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, Pencil, Trash2, Search } from "lucide-react";
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
import type { Customer } from "@/types";
import { Input } from "@/components/ui/input";

const initialCustomers: Customer[] = [
  {
    id: "1",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "555-1234",
    address: "123 Main St, Anytown, USA",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@example.com",
    phone: "555-5678",
    address: "456 Oak Ave, Anytown, USA",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    firstName: "Alice",
    lastName: "Johnson",
    phone: "555-8765",
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

if (typeof window !== 'undefined') {
  if (!(window as any).__customerStore) {
    (window as any).__customerStore = {
      customers: [...initialCustomers],
      addCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newCustomer: Customer = {
          ...customer,
          id: String(Date.now()),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        (window as any).__customerStore.customers.push(newCustomer);
        return newCustomer;
      },
      updateCustomer: (updatedCustomer: Customer) => {
        const index = (window as any).__customerStore.customers.findIndex((c: Customer) => c.id === updatedCustomer.id);
        if (index !== -1) {
          (window as any).__customerStore.customers[index] = { ...updatedCustomer, updatedAt: new Date() };
          return true;
        }
        return false;
      },
      deleteCustomer: (customerId: string) => {
        (window as any).__customerStore.customers = (window as any).__customerStore.customers.filter((c: Customer) => c.id !== customerId);
        return true;
      },
      getCustomerById: (customerId: string) => {
        return (window as any).__customerStore.customers.find((c: Customer) => c.id === customerId);
      }
    };
  } else {
    // Ensure initialCustomers are loaded if the store was somehow created but empty
    if ((window as any).__customerStore && (!(window as any).__customerStore.customers || (window as any).__customerStore.customers.length === 0)) {
        (window as any).__customerStore.customers = [...initialCustomers];
    }
  }
}


export default function CustomersPage() {
  const { toast } = useToast();
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined' && (window as any).__customerStore) {
      // Ensure the local state is initialized from the store, which might have already been populated
      const storeCustomers = (window as any).__customerStore.customers;
      if (storeCustomers && storeCustomers.length > 0) {
        setAllCustomers([...storeCustomers]);
      } else if (initialCustomers.length > 0 && (!storeCustomers || storeCustomers.length === 0)) {
        // Fallback to initialCustomers if store is empty but should have data
        (window as any).__customerStore.customers = [...initialCustomers];
        setAllCustomers([...initialCustomers]);
      }
    }
  }, []);

  const refreshCustomers = () => {
    if (typeof window !== 'undefined' && (window as any).__customerStore) {
      setAllCustomers([...(window as any).__customerStore.customers]);
    }
  };

  useEffect(() => {
    if (!isMounted) return; 

    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).__customerStore) {
        const storeCustomers = (window as any).__customerStore.customers;
        if (JSON.stringify(storeCustomers) !== JSON.stringify(allCustomers)) {
          refreshCustomers();
        }
      }
    }, 1000); 
    return () => clearInterval(interval);
  }, [allCustomers, isMounted]);


  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (customerToDelete) {
      if (typeof window !== 'undefined' && (window as any).__customerStore) {
        (window as any).__customerStore.deleteCustomer(customerToDelete.id);
        refreshCustomers();
        toast({
          title: "Customer Deleted",
          description: `${customerToDelete.firstName} ${customerToDelete.lastName} has been successfully deleted.`,
        });
      }
    }
    setShowDeleteDialog(false);
    setCustomerToDelete(null);
  };
  
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return allCustomers;
    const lowercasedFilter = searchTerm.toLowerCase();
    return allCustomers.filter(customer =>
      customer.firstName.toLowerCase().includes(lowercasedFilter) ||
      customer.lastName.toLowerCase().includes(lowercasedFilter) ||
      (customer.email && customer.email.toLowerCase().includes(lowercasedFilter)) ||
      customer.phone.toLowerCase().includes(lowercasedFilter)
    );
  }, [allCustomers, searchTerm]);

  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><p>Loading customers...</p></div>; 
  }


  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-2xl">Customers</CardTitle>
            </div>
            <CardDescription>Manage your customer database.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search customers..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/dashboard/customers/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Customer
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredCustomers.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{`${customer.firstName} ${customer.lastName}`}</TableCell>
                    <TableCell>{customer.email || "-"}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild className="hover:text-primary">
                        <Link href={`/dashboard/customers/${customer.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="hover:text-destructive"
                        onClick={() => handleDeleteCustomer(customer)}
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
                <Users className="h-16 w-16" />
                <p className="text-lg">{searchTerm ? "No customers match your search." : "No customers found."}</p>
                {!searchTerm && <p>Get started by adding a new customer.</p>}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the customer 
              "{customerToDelete?.firstName} {customerToDelete?.lastName}" from your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setCustomerToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
