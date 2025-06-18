
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, UserCog, Pencil, Trash2 } from "lucide-react";
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
import type { Mechanic } from "@/types";
import { Badge } from "@/components/ui/badge";

const initialMechanics: Mechanic[] = [
  {
    id: "mech1",
    name: "Alex Miller",
    specializations: "Engine Overhauls, Electrical Systems",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "mech2",
    name: "Bob Garcia",
    specializations: "Suspension, Brakes, Tires",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "mech3",
    name: "Charlie Brown",
    specializations: "General Maintenance, Diagnostics",
    isActive: false, 
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

if (typeof window !== 'undefined') {
  if (!(window as any).__mechanicStore) {
    (window as any).__mechanicStore = {
      mechanics: [...initialMechanics],
      addMechanic: (mechanic: Omit<Mechanic, 'id' | 'createdAt' | 'updatedAt'>) => {
        const newMechanic: Mechanic = {
          ...mechanic,
          id: String(Date.now()),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        (window as any).__mechanicStore.mechanics.push(newMechanic);
        return newMechanic;
      },
      updateMechanic: (updatedMechanic: Mechanic) => {
        const index = (window as any).__mechanicStore.mechanics.findIndex((m: Mechanic) => m.id === updatedMechanic.id);
        if (index !== -1) {
          (window as any).__mechanicStore.mechanics[index] = { ...updatedMechanic, updatedAt: new Date() };
          return true;
        }
        return false;
      },
      deleteMechanic: (mechanicId: string) => {
        (window as any).__mechanicStore.mechanics = (window as any).__mechanicStore.mechanics.filter((m: Mechanic) => m.id !== mechanicId);
        return true;
      },
      getMechanicById: (mechanicId: string) => {
        return (window as any).__mechanicStore.mechanics.find((m: Mechanic) => m.id === mechanicId);
      }
    };
  }
}

export default function MechanicsPage() {
  const { toast } = useToast();
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [mechanicToDelete, setMechanicToDelete] = useState<Mechanic | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined' && (window as any).__mechanicStore) {
      setMechanics([...(window as any).__mechanicStore.mechanics]);
    }
  }, []);

  const refreshMechanics = () => {
    if (typeof window !== 'undefined' && (window as any).__mechanicStore) {
      setMechanics([...(window as any).__mechanicStore.mechanics]);
    }
  };

  useEffect(() => {
    if (!isMounted) return;

    const interval = setInterval(() => {
      if (typeof window !== 'undefined' && (window as any).__mechanicStore) {
        const storeMechanics = (window as any).__mechanicStore.mechanics;
        if (JSON.stringify(storeMechanics) !== JSON.stringify(mechanics)) {
          refreshMechanics();
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [mechanics, isMounted]);

  const handleDeleteMechanic = (mechanic: Mechanic) => {
    setMechanicToDelete(mechanic);
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (mechanicToDelete) {
      if (typeof window !== 'undefined' && (window as any).__mechanicStore) {
        (window as any).__mechanicStore.deleteMechanic(mechanicToDelete.id);
        refreshMechanics();
        toast({
          title: "Mechanic Deleted",
          description: `${mechanicToDelete.name} has been successfully deleted.`,
        });
      }
    }
    setShowDeleteDialog(false);
    setMechanicToDelete(null);
  };
  
  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><p>Loading mechanics...</p></div>; 
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <UserCog className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-2xl">Mechanics</CardTitle>
            </div>
            <CardDescription>Manage your team of mechanics.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/dashboard/mechanics/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Mechanic
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {mechanics.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Specializations</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mechanics.map((mechanic) => (
                  <TableRow key={mechanic.id}>
                    <TableCell className="font-medium">{mechanic.name}</TableCell>
                    <TableCell className="max-w-xs truncate">{mechanic.specializations || "-"}</TableCell>
                    <TableCell>
                      <Badge variant={mechanic.isActive ? "default" : "secondary"}>
                        {mechanic.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" asChild className="hover:text-primary">
                        <Link href={`/dashboard/mechanics/${mechanic.id}/edit`}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="hover:text-destructive"
                        onClick={() => handleDeleteMechanic(mechanic)}
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
                <UserCog className="h-16 w-16" />
                <p className="text-lg">No mechanics found.</p>
                <p>Get started by adding a new mechanic.</p>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the mechanic "{mechanicToDelete?.name}" from your records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setMechanicToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
