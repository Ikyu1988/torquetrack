
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Wrench } from "lucide-react";
import Link from "next/link";

export default function ServicesPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-headline text-2xl">Services</CardTitle>
            <CardDescription>Manage the services offered by your workshop.</CardDescription>
          </div>
           <Button asChild>
             {/* TODO: Link to /dashboard/services/new when that page is created */}
            <Link href="#">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Service
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Services listing will be displayed here. (Coming Soon)</p>
        </CardContent>
      </Card>
    </div>
  );
}
