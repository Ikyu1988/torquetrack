
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

export default function JobOrdersPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline text-2xl">Job Orders</CardTitle>
            <CardDescription>Manage all your workshop job orders.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/dashboard/job-orders/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Create New Job Order
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Job orders listing will be displayed here. (Coming Soon)</p>
        </CardContent>
      </Card>
    </div>
  );
}
