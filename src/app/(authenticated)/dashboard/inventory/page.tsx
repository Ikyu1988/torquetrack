
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Package } from "lucide-react";
import Link from "next/link";

export default function InventoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline text-2xl">Inventory</CardTitle>
            <CardDescription>Manage parts, stock levels, and suppliers.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/dashboard/inventory/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Part
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Inventory items listing will be displayed here. (Coming Soon)</p>
        </CardContent>
      </Card>
    </div>
  );
}
