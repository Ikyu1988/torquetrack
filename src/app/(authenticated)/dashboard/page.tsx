import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Package, Users, Wrench, ArrowRight, ClipboardList } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function DashboardPage() {
  const quickStats = [
    { title: "Active Job Orders", value: "12", icon: <ClipboardList className="h-6 w-6 text-primary" />, color: "text-blue-500" },
    { title: "Pending Payments", value: "3", icon: <FileText className="h-6 w-6 text-primary" />, color: "text-yellow-500" },
    { title: "Low Stock Items", value: "5", icon: <Package className="h-6 w-6 text-primary" />, color: "text-red-500" },
    { title: "Total Customers", value: "128", icon: <Users className="h-6 w-6 text-primary" />, color: "text-green-500" },
  ];

  const quickActions = [
    { label: "New Job Order", href: "/dashboard/job-orders/new", icon: <Wrench className="mr-2 h-4 w-4" /> },
    { label: "Add Customer", href: "/dashboard/customers/new", icon: <Users className="mr-2 h-4 w-4" /> },
    { label: "Add Part", href: "/dashboard/inventory/new", icon: <Package className="mr-2 h-4 w-4" /> },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card className="shadow-lg">
        <CardHeader className="pb-4">
          <CardTitle className="font-headline text-3xl">Welcome to TorqueTrack!</CardTitle>
          <CardDescription>Here's a quick overview of your workshop.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickStats.map((stat) => (
              <Card key={stat.title} className="hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  {stat.icon}
                </CardHeader>
                <CardContent>
                  <div className={`text-3xl font-bold ${stat.color}`}>{stat.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-2xl">Quick Actions</CardTitle>
          <CardDescription>Get started with common tasks.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {quickActions.map((action) => (
            <Button key={action.label} asChild variant="outline" size="lg" className="justify-start py-6 text-base group hover:bg-primary/5 hover:border-primary">
              <Link href={action.href}>
                {action.icon}
                {action.label}
                <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </Link>
            </Button>
          ))}
        </CardContent>
      </Card>
      
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Recent Activity</CardTitle>
            <CardDescription>Latest updates in your workshop.</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Placeholder for recent activity feed */}
            <ul className="space-y-3">
              <li className="flex items-center gap-3 p-3 bg-muted/30 rounded-md">
                <Image src="https://placehold.co/40x40.png" alt="User avatar" width={40} height={40} className="rounded-full" data-ai-hint="avatar person"/>
                <div>
                  <p className="text-sm font-medium">Job Order #JO-0012 status changed to "In Progress".</p>
                  <p className="text-xs text-muted-foreground">2 hours ago by Alex M.</p>
                </div>
              </li>
              <li className="flex items-center gap-3 p-3 bg-muted/30 rounded-md">
                <Image src="https://placehold.co/40x40.png" alt="User avatar" width={40} height={40} className="rounded-full" data-ai-hint="avatar person"/>
                <div>
                  <p className="text-sm font-medium">New Customer "Jane Doe" added.</p>
                  <p className="text-xs text-muted-foreground">5 hours ago by Sarah C.</p>
                </div>
              </li>
               <li className="flex items-center gap-3 p-3 bg-muted/30 rounded-md">
                <Image src="https://placehold.co/40x40.png" alt="User avatar" width={40} height={40} className="rounded-full" data-ai-hint="avatar person"/>
                <div>
                  <p className="text-sm font-medium">Part "Spark Plug NGK-CR8E" stock updated.</p>
                  <p className="text-xs text-muted-foreground">Yesterday by Mike L.</p>
                </div>
              </li>
            </ul>
             <Button variant="link" className="mt-4 text-primary px-0">View all activity</Button>
          </CardContent>
        </Card>
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Performance Snapshot</CardTitle>
            <CardDescription>Key metrics overview (placeholder).</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-center">
            {/* Placeholder for a small chart or key metrics */}
            <Image src="https://placehold.co/400x200.png" alt="Performance chart placeholder" width={400} height={200} data-ai-hint="chart graph" className="rounded-md"/>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
