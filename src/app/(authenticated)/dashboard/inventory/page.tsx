
"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Package, Pencil, Trash2, Download, Upload, AlertTriangle, Edit, Search } from "lucide-react";
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
import type { Part, ShopSettings } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

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
    notes: "Standard spark plug"
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
    notes: "Sintered brake pads"
  },
   {
    id: "part4",
    name: "Chain Lube Maxima",
    brand: "Maxima",
    category: "Maintenance",
    sku: "CHN-MAX-LUBE",
    price: 18.00,
    cost: 9.00,
    supplier: "BikeParts Direct",
    stockQuantity: 3, 
    minStockAlert: 5,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "part5",
    name: "Air Filter OEM",
    brand: "OEM Replacement",
    category: "Engine",
    sku: "AIR-OEM-STD",
    price: 22.00,
    cost: 11.00,
    supplier: "MotoSupplies Inc.",
    stockQuantity: 0, 
    minStockAlert: 3,
    isActive: true,
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
          id: String(Date.now() + Math.random()), 
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
  } else {
    if ((window as any).__inventoryStore && (!(window as any).__inventoryStore.parts || (window as any).__inventoryStore.parts.length === 0)) {
        (window as any).__inventoryStore.parts = [...initialParts];
    }
  }
}

export default function InventoryPage() {
  const { toast } = useToast();
  const [allParts, setAllParts] = useState<Part[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [partToDelete, setPartToDelete] = useState<Part | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);
  const shopSettingsRef = useRef<ShopSettings | null>(null);

  const currency = useMemo(() => shopSettings?.currencySymbol || '₱', [shopSettings]);

  const refreshParts = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).__inventoryStore) {
      const storeParts = (window as any).__inventoryStore.parts;
      setAllParts(prevParts => {
        if (JSON.stringify(storeParts) !== JSON.stringify(prevParts)) {
          return [...storeParts];
        }
        return prevParts;
      });
    }
  }, []);

  const refreshShopSettings = useCallback(() => {
    if (typeof window !== 'undefined' && (window as any).__settingsStore) {
        const newSettings = (window as any).__settingsStore.getSettings();
        if (JSON.stringify(newSettings) !== JSON.stringify(shopSettingsRef.current)) {
            setShopSettings(newSettings);
            shopSettingsRef.current = newSettings;
        }
    }
  }, []);


  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      if ((window as any).__inventoryStore) {
        const storeParts = (window as any).__inventoryStore.parts;
        if (storeParts && storeParts.length > 0) {
            setAllParts([...storeParts]);
        } else if (initialParts.length > 0 && (!storeParts || storeParts.length === 0)) {
            (window as any).__inventoryStore.parts = [...initialParts];
            setAllParts([...initialParts]);
        }
      }
      if ((window as any).__settingsStore) {
        const currentSettings = (window as any).__settingsStore.getSettings();
        setShopSettings(currentSettings);
        shopSettingsRef.current = currentSettings;
      }
    }
  }, []);


  useEffect(() => {
    if (!isMounted) return;

    const interval = setInterval(() => {
      refreshParts();
      refreshShopSettings();
    }, 1000); 
    return () => clearInterval(interval);
  }, [isMounted, refreshParts, refreshShopSettings]); 

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

  const handleExportCSV = () => {
    if (filteredParts.length === 0) {
      toast({ title: "No Data", description: "There are no parts to export.", variant: "destructive" });
      return;
    }
    const headers = [
      "id", "name", "brand", "category", "sku", "price", "cost", 
      "supplier", "stockQuantity", "minStockAlert", "notes", "isActive", 
      "createdAt", "updatedAt"
    ];
    const csvRows = [
      headers.join(','),
      ...filteredParts.map(part => headers.map(header => {
        let value = part[header as keyof Part];
        if (value instanceof Date) {
          value = value.toISOString();
        } else if (typeof value === 'string' && value.includes(',')) {
          value = `"${value}"`; 
        } else if (value === undefined || value === null) {
          value = "";
        }
        return value;
      }).join(','))
    ];
    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "inventory_export.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast({ title: "Export Successful", description: "Inventory data exported to CSV." });
  };

  const handleImportCSV = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (!text) {
        toast({ title: "Import Error", description: "Could not read file content.", variant: "destructive" });
        return;
      }
      const lines = text.split(/\r\n|\n/);
      if (lines.length < 2) {
        toast({ title: "Import Error", description: "CSV file must have a header row and at least one data row.", variant: "destructive" });
        return;
      }

      const headerLine = lines[0].split(',').map(h => h.trim().toLowerCase());
      const expectedPartHeaders: Record<string, { key: keyof Omit<Part, 'id' | 'createdAt' | 'updatedAt'>, type: 'string' | 'number' | 'integer' | 'boolean', optional?: boolean }> = {
        'name': { key: 'name', type: 'string' },
        'brand': { key: 'brand', type: 'string', optional: true },
        'category': { key: 'category', type: 'string', optional: true },
        'sku': { key: 'sku', type: 'string', optional: true },
        'price': { key: 'price', type: 'number' },
        'cost': { key: 'cost', type: 'number', optional: true },
        'supplier': { key: 'supplier', type: 'string', optional: true },
        'stockquantity': { key: 'stockQuantity', type: 'integer' },
        'minstockalert': { key: 'minStockAlert', type: 'integer', optional: true },
        'notes': { key: 'notes', type: 'string', optional: true },
        'isactive': { key: 'isActive', type: 'boolean' },
      };
      
      const headerMap: { index: number, targetKey: keyof Omit<Part, 'id' | 'createdAt' | 'updatedAt'>, type: 'string' | 'number' | 'integer' | 'boolean', optional?: boolean }[] = [];
      headerLine.forEach((header, index) => {
        const mapping = expectedPartHeaders[header];
        if (mapping) {
          headerMap.push({ index, targetKey: mapping.key, type: mapping.type, optional: mapping.optional });
        }
      });

      if (!headerMap.find(h => h.targetKey === 'name') || !headerMap.find(h => h.targetKey === 'price') || !headerMap.find(h => h.targetKey === 'stockQuantity') || !headerMap.find(h => h.targetKey === 'isActive') ) {
         toast({ title: "Import Error", description: "CSV must contain at least 'name', 'price', 'stockQuantity', and 'isActive' headers.", variant: "destructive" });
        return;
      }

      let importedCount = 0;
      let errorCount = 0;

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue; 

        const values = line.split(','); 
        
        const partData: Partial<Omit<Part, 'id' | 'createdAt' | 'updatedAt'>> = {};
        let rowIsValid = true;

        headerMap.forEach(mapping => {
            const valueStr = values[mapping.index]?.trim();
             if (valueStr === undefined || valueStr === "") {
                if (!mapping.optional && (mapping.type === 'number' || mapping.type === 'integer' || mapping.type === 'boolean')) {
                    if (mapping.targetKey === 'price' || mapping.targetKey === 'stockQuantity' || mapping.targetKey === 'isActive') {
                        rowIsValid = false;
                    }
                }
                (partData as any)[mapping.targetKey] = undefined; 
                return;
            }

            try {
                switch (mapping.type) {
                    case 'string':
                        (partData as any)[mapping.targetKey] = valueStr.startsWith('"') && valueStr.endsWith('"') ? valueStr.slice(1, -1) : valueStr;
                        break;
                    case 'number':
                        const numVal = parseFloat(valueStr);
                        if (isNaN(numVal)) {
                            if (!mapping.optional) rowIsValid = false; else (partData as any)[mapping.targetKey] = undefined;
                        } else {
                            (partData as any)[mapping.targetKey] = numVal;
                        }
                        break;
                    case 'integer':
                        const intVal = parseInt(valueStr, 10);
                         if (isNaN(intVal)) {
                            if (!mapping.optional) rowIsValid = false; else (partData as any)[mapping.targetKey] = undefined;
                        } else {
                            (partData as any)[mapping.targetKey] = intVal;
                        }
                        break;
                    case 'boolean':
                        const lowerVal = valueStr.toLowerCase();
                        if (lowerVal === 'true' || lowerVal === '1') {
                            partData[mapping.targetKey] = true;
                        } else if (lowerVal === 'false' || lowerVal === '0') {
                            partData[mapping.targetKey] = false;
                        } else {
                             if (!mapping.optional) rowIsValid = false; else (partData as any)[mapping.targetKey] = undefined;
                        }
                        break;
                }
            } catch (err: any) {
                rowIsValid = false;
            }
        });

        if (partData.name === undefined || partData.price === undefined || partData.stockQuantity === undefined || partData.isActive === undefined) {
            rowIsValid = false; 
        }

        if (rowIsValid && (window as any).__inventoryStore) {
          (window as any).__inventoryStore.addPart(partData as Omit<Part, 'id' | 'createdAt' | 'updatedAt'>);
          importedCount++;
        } else {
          errorCount++;
        }
      }

      refreshParts();
      toast({
        title: "Import Complete",
        description: `${importedCount} parts imported successfully. ${errorCount > 0 ? `${errorCount} rows had errors and were skipped.` : ''}`,
      });
    };
    reader.onerror = () => {
      toast({ title: "Import Error", description: "Failed to read the file.", variant: "destructive" });
    };
    reader.readAsText(file);
    if(fileInputRef.current) {
        fileInputRef.current.value = ""; 
    }
  };

  const filteredParts = useMemo(() => {
    if (!searchTerm) return allParts;
    const lowercasedFilter = searchTerm.toLowerCase();
    return allParts.filter(part =>
      part.name.toLowerCase().includes(lowercasedFilter) ||
      (part.sku && part.sku.toLowerCase().includes(lowercasedFilter)) ||
      (part.brand && part.brand.toLowerCase().includes(lowercasedFilter)) ||
      (part.category && part.category.toLowerCase().includes(lowercasedFilter))
    );
  }, [allParts, searchTerm]);
  
  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><p>Loading inventory...</p></div>; 
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <Package className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-2xl">Inventory</CardTitle>
            </div>
            <CardDescription>Manage parts, stock levels, and suppliers.</CardDescription>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
            <div className="relative w-full md:w-auto flex-grow md:flex-grow-0">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search parts..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/dashboard/inventory/adjust-stock">
                    <Edit className="mr-2 h-4 w-4" /> Adjust Stock
                </Link>
            </Button>
            <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full sm:w-auto">
              <Upload className="mr-2 h-4 w-4" /> Import CSV
            </Button>
            <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleImportCSV} 
                accept=".csv" 
                className="hidden" 
            />
            <Button onClick={handleExportCSV} variant="outline" className="w-full sm:w-auto">
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button asChild className="w-full sm:w-auto">
              <Link href="/dashboard/inventory/new">
                <PlusCircle className="mr-2 h-4 w-4" /> Add New Part
              </Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredParts.length > 0 ? (
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
                {filteredParts.map((part) => {
                  const isLowStock = part.isActive && part.minStockAlert !== undefined && part.stockQuantity <= part.minStockAlert && part.stockQuantity > 0;
                  const isOutOfStock = part.isActive && part.stockQuantity === 0;
                  return (
                    <TableRow key={part.id} className={cn(isOutOfStock ? "bg-destructive/10" : isLowStock ? "bg-yellow-500/10" : "")}>
                      <TableCell className="font-medium">{part.name}</TableCell>
                      <TableCell>{part.sku || "-"}</TableCell>
                      <TableCell>{part.brand || "-"}</TableCell>
                      <TableCell>{part.category || "-"}</TableCell>
                      <TableCell className="text-right">{currency}{part.price.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {part.stockQuantity}
                          {isOutOfStock && <Badge variant="destructive" className="text-xs">Out of Stock</Badge>}
                          {isLowStock && <Badge variant="outline" className="border-yellow-500 text-yellow-600 text-xs">Low Stock</Badge>}
                        </div>
                      </TableCell>
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
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-10 text-muted-foreground">
                <Package className="h-16 w-16" />
                <p className="text-lg">{searchTerm ? "No parts match your search." : "No parts found in inventory."}</p>
                {!searchTerm && <p>Get started by adding a new part or importing from CSV.</p>}
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

