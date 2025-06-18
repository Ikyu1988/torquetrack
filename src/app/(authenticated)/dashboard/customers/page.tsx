
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users } from "lucide-react";
import Link from "next/link";

export default function CustomersPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline text-2xl">Customers</CardTitle>
            <CardDescription>Manage your customer database.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/dashboard/customers/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Customer
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Customer listing will be displayed here. (Coming Soon)</p>
        </CardContent>
      </Card>
    </div>
  );
}
