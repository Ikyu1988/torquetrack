
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Users, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Customer } from "@/types"; // Assuming Customer type is defined

const dummyCustomers: Customer[] = [
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
    // email is optional
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export default function CustomersPage() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Users className="h-6 w-6 text-primary" />
              <CardTitle className="font-headline text-2xl">Customers</CardTitle>
            </div>
            <CardDescription>Manage your customer database.</CardDescription>
          </div>
          <Button asChild>
            <Link href="/dashboard/customers/new">
              <PlusCircle className="mr-2 h-4 w-4" /> Add New Customer
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {dummyCustomers.length > 0 ? (
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
                {dummyCustomers.map((customer) => (
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
                      <Button variant="ghost" size="icon" className="hover:text-destructive">
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
                <p className="text-lg">No customers found.</p>
                <p>Get started by adding a new customer.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
