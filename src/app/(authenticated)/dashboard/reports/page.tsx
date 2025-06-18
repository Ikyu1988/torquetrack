
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, DollarSign, BarChart2, Package, Users, UserCog, CalendarDays, Download } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

// Placeholder data - in a real app, this would come from API calls based on selected dates
const placeholderSalesData = {
  totalRevenue: 12500.75,
  jobOrdersCount: 42,
  averageJobValue: 297.64,
};

const placeholderTopServices = [
  { id: "svc1", name: "Oil Change", count: 25, revenue: 1250 },
  { id: "svc2", name: "Tire Replacement", count: 10, revenue: 1500 },
  { id: "svc4", name: "Brake Inspection", count: 18, revenue: 900 },
];

const placeholderInventoryData = {
  lowStockItems: 5,
  totalValue: 18500.00,
  topMovingItems: [
    { id: "part2", name: "Oil Filter Hiflo HF204", sold: 30 },
    { id: "part1", name: "Spark Plug NGK-CR8E", sold: 22 },
  ],
};

const placeholderMechanicActivity = [
  { id: "mech1", name: "Alex Miller", jobsCompleted: 15, totalLabor: 1875 },
  { id: "mech2", name: "Bob Garcia", jobsCompleted: 12, totalLabor: 1500 },
];

export default function ReportsPage() {
  const { toast } = useToast();
  const [startDate, setStartDate] = useState<Date | undefined>(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [isMounted, setIsMounted] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleGenerateReport = () => {
    if (!startDate || !endDate) {
      toast({
        title: "Select Dates",
        description: "Please select both a start and end date.",
        variant: "destructive",
      });
      return;
    }
    if (endDate < startDate) {
      toast({
        title: "Invalid Date Range",
        description: "End date cannot be earlier than start date.",
        variant: "destructive",
      });
      return;
    }

    setLoadingReport(true);
    // Simulate API call
    setTimeout(() => {
      toast({
        title: "Report Generated (Simulated)",
        description: `Report for ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()} would be displayed.`,
      });
      setLoadingReport(false);
    }, 1500);
  };
  
  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><p>Loading reports...</p></div>;
  }

  return (
    <div className="flex flex-col gap-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="h-7 w-7 text-primary" />
            <CardTitle className="font-headline text-3xl">Reports Dashboard</CardTitle>
          </div>
          <CardDescription>Analyze your workshop's performance and gain valuable insights.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end p-4 border rounded-lg bg-muted/30">
            <div className="grid gap-2 flex-1">
              <label htmlFor="startDate" className="text-sm font-medium">Start Date</label>
              <DatePicker value={startDate} onChange={setStartDate} placeholder="Select start date" />
            </div>
            <div className="grid gap-2 flex-1">
              <label htmlFor="endDate" className="text-sm font-medium">End Date</label>
              <DatePicker value={endDate} onChange={setEndDate} placeholder="Select end date" />
            </div>
            <Button onClick={handleGenerateReport} disabled={loadingReport} className="w-full sm:w-auto">
              {loadingReport ? "Generating..." : "Generate Report"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Sales Overview Card */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <CardTitle className="text-xl">Sales Overview</CardTitle>
              </div>
              <Button variant="ghost" size="sm"><Download className="h-4 w-4 mr-2"/> Export</Button>
            </div>
            <CardDescription>Summary of financial performance for the selected period.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between p-3 bg-background rounded-md">
              <p>Total Revenue:</p>
              <p className="font-semibold text-green-500">${placeholderSalesData.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="flex justify-between p-3 bg-background rounded-md">
              <p>Job Orders Completed:</p>
              <p className="font-semibold">{placeholderSalesData.jobOrdersCount}</p>
            </div>
            <div className="flex justify-between p-3 bg-background rounded-md">
              <p>Average Job Value:</p>
              <p className="font-semibold">${placeholderSalesData.averageJobValue.toFixed(2)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Service Performance Card */}
        <Card className="shadow-md">
          <CardHeader>
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">Service Performance</CardTitle>
                </div>
                <Button variant="ghost" size="sm"><Download className="h-4 w-4 mr-2"/> Export</Button>
            </div>
            <CardDescription>Most frequently performed services and their revenue.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-center">Count</TableHead>
                  <TableHead className="text-right">Revenue</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {placeholderTopServices.map(service => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell className="text-center">{service.count}</TableCell>
                    <TableCell className="text-right text-green-500">${service.revenue.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                 {placeholderTopServices.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No service data for this period.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Inventory Status Card */}
        <Card className="shadow-md">
          <CardHeader>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">Inventory Insights</CardTitle>
                </div>
                <Button variant="ghost" size="sm"><Download className="h-4 w-4 mr-2"/> Export</Button>
            </div>
            <CardDescription>Overview of stock levels and part movement.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between p-3 bg-background rounded-md">
                <p>Low Stock Items:</p>
                <p className="font-semibold text-red-500">{placeholderInventoryData.lowStockItems}</p>
            </div>
            <div className="flex justify-between p-3 bg-background rounded-md">
                <p>Total Inventory Value:</p>
                <p className="font-semibold">${placeholderInventoryData.totalValue.toFixed(2)}</p>
            </div>
            <Separator className="my-2"/>
            <h4 className="font-medium text-sm">Top Moving Items:</h4>
            {placeholderInventoryData.topMovingItems.map(item => (
                 <div key={item.id} className="flex justify-between text-xs p-2 bg-background/50 rounded-md">
                    <p>{item.name}</p>
                    <p className="font-semibold">{item.sold} sold</p>
                </div>
            ))}
             {placeholderInventoryData.topMovingItems.length === 0 && (
                <p className="text-xs text-muted-foreground text-center">No top moving items data.</p>
            )}
          </CardContent>
        </Card>

        {/* Mechanic Activity Card */}
        <Card className="shadow-md">
          <CardHeader>
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <UserCog className="h-5 w-5 text-primary" />
                    <CardTitle className="text-xl">Mechanic Activity</CardTitle>
                </div>
                <Button variant="ghost" size="sm"><Download className="h-4 w-4 mr-2"/> Export</Button>
            </div>
            <CardDescription>Summary of job orders completed by mechanics.</CardDescription>
          </CardHeader>
          <CardContent>
             <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mechanic</TableHead>
                  <TableHead className="text-center">Jobs</TableHead>
                  <TableHead className="text-right">Total Labor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {placeholderMechanicActivity.map(mech => (
                  <TableRow key={mech.id}>
                    <TableCell className="font-medium">{mech.name}</TableCell>
                    <TableCell className="text-center">{mech.jobsCompleted}</TableCell>
                    <TableCell className="text-right">${mech.totalLabor.toFixed(2)}</TableCell>
                  </TableRow>
                ))}
                {placeholderMechanicActivity.length === 0 && (
                    <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No mechanic activity for this period.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

    