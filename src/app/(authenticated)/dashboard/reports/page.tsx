
"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, BarChart2, DollarSign, Download, Filter, Search, AlertTriangle } from "lucide-react";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import type { JobOrder, Customer, Mechanic, Part, Service, Payment, ShopSettings, JobOrderServiceItem, CommissionType, JobOrderStatus } from "@/types";
import { JOB_ORDER_STATUS_OPTIONS, JOB_ORDER_STATUSES, COMMISSION_TYPES } from "@/lib/constants";
import { format, startOfMonth } from "date-fns";

const convertToCSV = (data: any[], headers?: string[]): string => {
  if (data.length === 0) return "";
  const array = [Object.keys(data[0]), ...data.map(item => Object.values(item))];
  if (headers && headers.length === array[0].length) { 
    array[0] = headers;
  } else if (headers) {
    console.warn("CSV export header length mismatch. Using default keys.");
  }
  return array.map(row => 
    row.map((value: any) => {
      if (value === null || value === undefined) return '';
      let str = String(value);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        str = `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    }).join(',')
  ).join('\n');
};

const downloadCSV = (csvString: string, filename: string) => {
  const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};


export default function ReportsPage() {
  const { toast } = useToast();
  const [isMounted, setIsMounted] = useState(false);

  const [startDate, setStartDate] = useState<Date | undefined>(startOfMonth(new Date()));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date());
  const [selectedStatus, setSelectedStatus] = useState<JobOrderStatus | "ALL">("ALL");
  const [selectedMechanicId, setSelectedMechanicId] = useState<string | "ALL">("ALL");
  
  const [allJobOrders, setAllJobOrders] = useState<JobOrder[]>([]);
  const [allMechanics, setAllMechanics] = useState<Mechanic[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [allParts, setAllParts] = useState<Part[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [shopSettings, setShopSettings] = useState<ShopSettings | null>(null);

  const [jobOrderSummary, setJobOrderSummary] = useState<any[]>([]);
  const [commissionReport, setCommissionReport] = useState<any[]>([]);
  const [partsUsageReport, setPartsUsageReport] = useState<any[]>([]);
  const [serviceSalesReport, setServiceSalesReport] = useState<any[]>([]);
  const [inventoryValuation, setInventoryValuation] = useState<{ totalValue: number, valuationDetails: any[] }>({ totalValue: 0, valuationDetails: [] });
  const [incomeSummary, setIncomeSummary] = useState<{ totalIncome: number }>({ totalIncome: 0 });
  const [customerServiceHistory, setCustomerServiceHistory] = useState<any[]>([]);
  const [selectedCustomerIdForHistory, setSelectedCustomerIdForHistory] = useState<string | "ALL">("ALL");
  const [lowStockItemsReport, setLowStockItemsReport] = useState<any[]>([]);


  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const currencySymbol = useMemo(() => shopSettings?.currencySymbol || '₱', [shopSettings]);

  useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      if ((window as any).__jobOrderStore) setAllJobOrders((window as any).__jobOrderStore.jobOrders || []);
      if ((window as any).__mechanicStore) setAllMechanics((window as any).__mechanicStore.mechanics || []);
      if ((window as any).__customerStore) setAllCustomers((window as any).__customerStore.customers || []);
      if ((window as any).__serviceStore) setAllServices((window as any).__serviceStore.services || []);
      if ((window as any).__inventoryStore) setAllParts((window as any).__inventoryStore.parts || []);
      if ((window as any).__paymentStore) setAllPayments((window as any).__paymentStore.payments || []);
      if ((window as any).__settingsStore) setShopSettings((window as any).__settingsStore.getSettings() || null);
    }
  }, []);
  
  const customerMap = useMemo(() => {
    const map = new Map<string, string>();
    allCustomers.forEach(c => map.set(c.id, `${c.firstName} ${c.lastName}`));
    return map;
  }, [allCustomers]);

  const mechanicMap = useMemo(() => {
    const map = new Map<string, string>();
    allMechanics.forEach(m => map.set(m.id, m.name));
    return map;
  }, [allMechanics]);

  const handleGenerateReport = (reportType: string) => {
    if ((reportType !== "inventoryValuation" && reportType !== "lowStockItems") && (!startDate || !endDate)) {
      toast({ title: "Select Dates", description: "Please select both start and end dates for this report.", variant: "destructive" });
      return;
    }
    if (startDate && endDate && endDate < startDate) {
      toast({ title: "Invalid Date Range", description: "End date cannot be earlier than start date.", variant: "destructive" });
      return;
    }

    setLoading(prev => ({ ...prev, [reportType]: true }));

    setTimeout(() => { 
      try {
        const filteredJobOrders = allJobOrders.filter(jo => {
          if (!startDate || !endDate) return true; 
          const joDate = new Date(jo.createdAt);
          const inDateRange = joDate >= startDate && joDate <= endDate;
          const statusMatch = selectedStatus === "ALL" || jo.status === selectedStatus;
          
          let mechanicMatch = selectedMechanicId === "ALL";
          if (selectedMechanicId !== "ALL") {
            mechanicMatch = jo.servicesPerformed && jo.servicesPerformed.some(s => s.assignedMechanicId === selectedMechanicId);
          }
          
          return inDateRange && statusMatch && mechanicMatch;
        });

        switch (reportType) {
          case "jobOrderSummary":
            const summary = filteredJobOrders.map(jo => ({
              ID: jo.id.substring(0,6),
              Customer: jo.customerId ? customerMap.get(jo.customerId) || "N/A" : "Walk-in",
              Motorcycle: jo.motorcycleId && (window as any).__motorcycleStore?.getMotorcycleById(jo.motorcycleId)?.model || (jo.status === JOB_ORDER_STATUSES.SALE_COMPLETED ? "Direct Sale Item" : "N/A"),
              Mechanic: jo.servicesPerformed?.map(s => s.assignedMechanicId ? mechanicMap.get(s.assignedMechanicId) : '').filter(Boolean).join(', ') || 'N/A',
              Status: jo.status,
              Date: format(new Date(jo.createdAt), "yyyy-MM-dd"),
              Total: `${currencySymbol}${jo.grandTotal.toFixed(2)}`,
            }));
            setJobOrderSummary(summary);
            break;
          
          case "commissionReport":
            let commissions: any[] = [];
            allJobOrders.filter(jo => { 
                if (!startDate || !endDate) return false;
                const joDate = new Date(jo.createdAt);
                const mechanicFilterMatch = selectedMechanicId === "ALL" || jo.servicesPerformed?.some(s => s.assignedMechanicId === selectedMechanicId);
                return joDate >= startDate && joDate <= endDate && mechanicFilterMatch;
            }).forEach(jo => {
              jo.servicesPerformed?.forEach(serviceItem => {
                if (selectedMechanicId !== "ALL" && serviceItem.assignedMechanicId !== selectedMechanicId) return;

                const serviceDetails = allServices.find(s => s.id === serviceItem.serviceId);
                const mechanicName = serviceItem.assignedMechanicId ? mechanicMap.get(serviceItem.assignedMechanicId) : "N/A";
                
                if (serviceDetails && serviceDetails.commissionType && serviceDetails.commissionValue !== undefined) {
                  let commissionAmount = 0;
                  if (serviceDetails.commissionType === COMMISSION_TYPES.FIXED) {
                    commissionAmount = serviceDetails.commissionValue;
                  } else if (serviceDetails.commissionType === COMMISSION_TYPES.PERCENTAGE) {
                    commissionAmount = (serviceItem.laborCost * serviceDetails.commissionValue) / 100;
                  }
                  commissions.push({
                    Mechanic: mechanicName,
                    JobOrderID: jo.id.substring(0,6),
                    Service: serviceItem.serviceName,
                    LaborCost: `${currencySymbol}${serviceItem.laborCost.toFixed(2)}`,
                    CommissionRate: `${serviceDetails.commissionType === COMMISSION_TYPES.FIXED ? currencySymbol : ''}${serviceDetails.commissionValue}${serviceDetails.commissionType === COMMISSION_TYPES.PERCENTAGE ? '%' : ''}`,
                    CommissionEarned: `${currencySymbol}${commissionAmount.toFixed(2)}`,
                  });
                }
              });
            });
            setCommissionReport(commissions);
            break;

          case "partsUsage":
            const partsUsage: Record<string, { name: string, sku?: string, quantity: number, totalValue: number }> = {};
             allJobOrders.filter(jo => { 
                if (!startDate || !endDate) return false;
                const joDate = new Date(jo.createdAt);
                return joDate >= startDate && joDate <= endDate;
            }).forEach(jo => {
                jo.partsUsed?.forEach(partItem => {
                    const partDetails = allParts.find(p => p.id === partItem.partId);
                    if (!partsUsage[partItem.partId]) {
                        partsUsage[partItem.partId] = { name: partItem.partName, sku: partDetails?.sku || '-', quantity: 0, totalValue: 0 };
                    }
                    partsUsage[partItem.partId].quantity += partItem.quantity;
                    partsUsage[partItem.partId].totalValue += partItem.totalPrice;
                });
            });
            setPartsUsageReport(Object.values(partsUsage).map(p => ({ Name: p.name, SKU: p.sku, QuantityUsed: p.quantity, TotalValue: `${currencySymbol}${p.totalValue.toFixed(2)}` })));
            break;

          case "serviceSales":
            const serviceSales: Record<string, { name: string, count: number, totalRevenue: number }> = {};
             allJobOrders.filter(jo => { 
                if (!startDate || !endDate) return false;
                const joDate = new Date(jo.createdAt);
                return joDate >= startDate && joDate <= endDate;
            }).forEach(jo => {
                jo.servicesPerformed?.forEach(serviceItem => {
                    if (!serviceSales[serviceItem.serviceId]) {
                        serviceSales[serviceItem.serviceId] = { name: serviceItem.serviceName, count: 0, totalRevenue: 0 };
                    }
                    serviceSales[serviceItem.serviceId].count++;
                    serviceSales[serviceItem.serviceId].totalRevenue += serviceItem.laborCost;
                });
            });
            setServiceSalesReport(Object.values(serviceSales).map(s => ({ ServiceName: s.name, TimesPerformed: s.count, TotalRevenue: `${currencySymbol}${s.totalRevenue.toFixed(2)}` })));
            break;
          
          case "inventoryValuation": 
            let totalVal = 0;
            const valuationDetails = allParts.map(part => {
                const value = part.stockQuantity * (part.cost ?? part.price); 
                totalVal += value;
                return {
                    PartName: part.name,
                    SKU: part.sku || '-',
                    Stock: part.stockQuantity,
                    UnitValue: `${currencySymbol}${(part.cost ?? part.price).toFixed(2)}`,
                    LineValue: `${currencySymbol}${value.toFixed(2)}`,
                };
            });
            setInventoryValuation({ totalValue: totalVal, valuationDetails });
            break;

          case "incomeSummary":
            if (!startDate || !endDate) return;
            const currentIncome = allPayments
              .filter(p => {
                const paymentDate = new Date(p.paymentDate);
                return paymentDate >= startDate && paymentDate <= endDate;
              })
              .reduce((sum, p) => sum + p.amount, 0);
            setIncomeSummary({ totalIncome: currentIncome });
            break;
            
          case "customerServiceHistory":
            if (selectedCustomerIdForHistory === "ALL") {
                 toast({ title: "Select Customer", description: "Please select a customer to view history.", variant: "destructive" });
                 setCustomerServiceHistory([]);
                 break;
            }
            const history = allJobOrders
                .filter(jo => jo.customerId === selectedCustomerIdForHistory) 
                .map(jo => ({
                    JobOrderID: jo.id.substring(0,6),
                    Date: format(new Date(jo.createdAt), "yyyy-MM-dd"),
                    Motorcycle: jo.motorcycleId && (window as any).__motorcycleStore?.getMotorcycleById(jo.motorcycleId)?.model || (jo.status === JOB_ORDER_STATUSES.SALE_COMPLETED ? "Direct Sale Item" : "N/A"),
                    Services: jo.servicesPerformed?.map(s => s.serviceName).join(', ') || jo.diagnostics || "Parts Sale",
                    Total: `${currencySymbol}${jo.grandTotal.toFixed(2)}`,
                }));
            setCustomerServiceHistory(history);
            break;

          case "lowStockItems":
            const lowItems = allParts
                .filter(part => part.isActive && part.minStockAlert !== undefined && part.stockQuantity <= part.minStockAlert)
                .map(part => ({
                    PartName: part.name,
                    SKU: part.sku || '-',
                    CurrentStock: part.stockQuantity,
                    MinStockLevel: part.minStockAlert,
                    Difference: (part.minStockAlert || 0) - part.stockQuantity,
                }));
            setLowStockItemsReport(lowItems);
            break;
        }
        toast({ title: "Report Generated", description: `Data for ${reportType.replace(/([A-Z])/g, ' $1')} has been updated.` });
      } catch (error) {
        console.error("Error generating report:", error);
        toast({ title: "Error", description: `Failed to generate ${reportType} report.`, variant: "destructive" });
      } finally {
        setLoading(prev => ({ ...prev, [reportType]: false }));
      }
    }, 1000);
  };

  const handleExportCSV = (reportData: any[], reportName: string, headers?: string[]) => {
    if (reportData.length === 0) {
      toast({ title: "No Data", description: `There is no data to export for ${reportName}.`, variant: "destructive" });
      return;
    }
    const csvString = convertToCSV(reportData, headers);
    downloadCSV(csvString, `${reportName.toLowerCase().replace(/\s+/g, '_')}_export.csv`);
    toast({ title: "Export Successful", description: `${reportName} data exported to CSV.` });
  };
  
  if (!isMounted) {
    return <div className="flex justify-center items-center h-screen"><p>Loading reports...</p></div>;
  }

  const ReportCard: React.FC<{ title: string; description: string; reportKey: string; data: any[]; columns: { key: string; label: string }[]; children?: React.ReactNode; customFilters?: React.ReactNode; onExport?: () => void; icon?: React.ReactNode }> = 
    ({ title, description, reportKey, data, columns, children, customFilters, onExport, icon }) => (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon || <BarChart2 className="h-5 w-5 text-primary" />}
            <CardTitle className="text-xl">{title}</CardTitle>
          </div>
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport} disabled={data.length === 0}>
                <Download className="h-4 w-4 mr-2"/> Export CSV
            </Button>
          )}
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {customFilters}
        <Button onClick={() => handleGenerateReport(reportKey)} disabled={loading[reportKey]} className="w-full sm:w-auto">
          {loading[reportKey] ? "Generating..." : "Generate / Refresh Report"}
        </Button>
        {children}
        {data.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map(col => <TableHead key={col.key}>{col.label}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {columns.map(col => <TableCell key={`${rowIndex}-${col.key}`}>{row[col.key]}</TableCell>)}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-muted-foreground text-center py-4">No data to display for this report. Generate the report or adjust filters.</p>
        )}
      </CardContent>
    </Card>
  );


  return (
    <div className="flex flex-col gap-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="h-7 w-7 text-primary" />
            <CardTitle className="font-headline text-3xl">Reports Dashboard</CardTitle>
          </div>
          <CardDescription>Analyze your workshop's performance and gain valuable insights. Use global filters below for applicable reports.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/30 items-end">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Start Date</label>
              <DatePicker value={startDate} onChange={setStartDate} placeholder="Select start date" />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">End Date</label>
              <DatePicker value={endDate} onChange={setEndDate} placeholder="Select end date" />
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Job Order Status</label>
              <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as JobOrderStatus | "ALL")}>
                <SelectTrigger><SelectValue placeholder="Filter by status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  {JOB_ORDER_STATUS_OPTIONS.map(status => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <label className="text-sm font-medium">Mechanic</label>
              <Select value={selectedMechanicId} onValueChange={setSelectedMechanicId}>
                <SelectTrigger><SelectValue placeholder="Filter by mechanic" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Mechanics</SelectItem>
                  {allMechanics.map(mech => <SelectItem key={mech.id} value={mech.id}>{mech.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6">
        <ReportCard 
            title="Job Order Summary" 
            description="Overview of job orders based on selected global filters (date, status, mechanic)."
            reportKey="jobOrderSummary"
            data={jobOrderSummary}
            columns={[
                { key: 'ID', label: 'ID' }, { key: 'Customer', label: 'Customer' }, { key: 'Motorcycle', label: 'Motorcycle/Type' },
                { key: 'Mechanic', label: 'Mechanic(s)' }, { key: 'Status', label: 'Status' }, { key: 'Date', label: 'Date' }, { key: 'Total', label: 'Total' }
            ]}
            onExport={() => handleExportCSV(jobOrderSummary, "Job Order Summary", ["ID", "Customer", "Motorcycle/Type", "Mechanic(s)", "Status", "Date", "Total"])}
        />

        <ReportCard
            title="Commission Report per Mechanic"
            description="Tracks commissions earned by mechanics based on global filters (date, mechanic)."
            reportKey="commissionReport"
            data={commissionReport}
            columns={[
                { key: 'Mechanic', label: 'Mechanic' }, { key: 'JobOrderID', label: 'Job ID' }, { key: 'Service', label: 'Service' },
                { key: 'LaborCost', label: 'Labor' }, { key: 'CommissionRate', label: 'Rate' }, { key: 'CommissionEarned', label: 'Earned' }
            ]}
            onExport={() => handleExportCSV(commissionReport, "Commission Report", ["Mechanic", "Job ID", "Service", "Labor Cost", "Commission Rate/Amount", "Commission Earned"])}
        />

        <ReportCard
            title="Parts Usage Report"
            description="Details parts consumed in job orders within the selected date range."
            reportKey="partsUsage"
            data={partsUsageReport}
            columns={[{ key: 'Name', label: 'Part Name' }, { key: 'SKU', label: 'SKU' }, { key: 'QuantityUsed', label: 'Qty Used' }, { key: 'TotalValue', label: 'Total Value' }]}
            onExport={() => handleExportCSV(partsUsageReport, "Parts Usage Report", ["Part Name", "SKU", "Quantity Used", "Total Value Used"])}
        />
        
        <ReportCard
            title="Service Sales Report"
            description="Summary of services performed and revenue generated within the date range."
            reportKey="serviceSales"
            data={serviceSalesReport}
            columns={[{ key: 'ServiceName', label: 'Service Name' }, { key: 'TimesPerformed', label: 'Times Performed' }, { key: 'TotalRevenue', label: 'Total Labor Revenue' }]}
            onExport={() => handleExportCSV(serviceSalesReport, "Service Sales Report", ["Service Name", "Times Performed", "Total Labor Revenue"])}
        />

        <ReportCard
            title="Inventory Valuation Report"
            description="Current valuation of your entire inventory (based on cost or price if cost is unavailable). Not date dependent."
            reportKey="inventoryValuation"
            data={inventoryValuation.valuationDetails}
            columns={[{ key: 'PartName', label: 'Part Name'}, { key: 'SKU', label: 'SKU' }, { key: 'Stock', label: 'Stock' }, { key: 'UnitValue', label: 'Unit Value' }, { key: 'LineValue', label: 'Line Value' }]}
            onExport={() => handleExportCSV(inventoryValuation.valuationDetails, "Inventory Valuation", ["Part Name", "SKU", "Stock Quantity", "Unit Value (Cost/Price)", "Total Line Value"])}
        >
            <p className="font-semibold text-lg mt-2">Total Inventory Value: {currencySymbol}{inventoryValuation.totalValue.toFixed(2)}</p>
        </ReportCard>

        <ReportCard
            title="Low Stock Items Report"
            description="Lists all parts that are at or below their minimum stock alert level. Not date dependent."
            reportKey="lowStockItems"
            icon={<AlertTriangle className="h-5 w-5 text-primary" />}
            data={lowStockItemsReport}
            columns={[
                { key: 'PartName', label: 'Part Name'}, 
                { key: 'SKU', label: 'SKU' }, 
                { key: 'CurrentStock', label: 'Current Stock' }, 
                { key: 'MinStockLevel', label: 'Min. Stock' },
                { key: 'Difference', label: 'Needed' }
            ]}
            onExport={() => handleExportCSV(lowStockItemsReport, "Low Stock Items", ["Part Name", "SKU", "Current Stock", "Min. Stock Level", "Difference"])}
        />

        <ReportCard
            title="Income Summary"
            description="Total income from payments received within the selected date range."
            reportKey="incomeSummary"
            data={incomeSummary.totalIncome > 0 ? [{ "DateRange": `${format(startDate || new Date(), "yyyy-MM-dd")} to ${format(endDate || new Date(), "yyyy-MM-dd")}`, "TotalIncome": `${currencySymbol}${incomeSummary.totalIncome.toFixed(2)}` }] : []} 
            columns={[{ key: 'DateRange', label: 'Period'}, { key: 'TotalIncome', label: 'Total Income'}]}
            onExport={() => handleExportCSV([{ "Date Range": `${format(startDate || new Date(), "yyyy-MM-dd")} to ${format(endDate || new Date(), "yyyy-MM-dd")}`, "Total Income": `${currencySymbol}${incomeSummary.totalIncome.toFixed(2)}` }], "Income Summary", ["Period", "Total Income"])}
        >
             {incomeSummary.totalIncome === 0 && !loading["incomeSummary"] && <p className="text-muted-foreground text-center py-4">No income recorded for the selected period.</p>}
             {incomeSummary.totalIncome > 0 && <p className="font-semibold text-lg mt-2">Total Income for Period: {currencySymbol}{incomeSummary.totalIncome.toFixed(2)}</p>}
        </ReportCard>
        
        <ReportCard
            title="Customer Service History"
            description="View all job orders for a specific customer."
            reportKey="customerServiceHistory"
            data={customerServiceHistory}
            columns={[{ key: 'JobOrderID', label: 'Job ID' }, { key: 'Date', label: 'Date' }, { key: 'Motorcycle', label: 'Motorcycle/Type' }, { key: 'Services', label: 'Services/Type' }, { key: 'Total', label: 'Total' }]}
            customFilters={
                <div className="grid gap-1.5 mb-4">
                    <label className="text-sm font-medium">Select Customer</label>
                    <Select value={selectedCustomerIdForHistory} onValueChange={setSelectedCustomerIdForHistory}>
                        <SelectTrigger><SelectValue placeholder="Select a customer" /></SelectTrigger>
                        <SelectContent>
                        <SelectItem value="ALL" disabled>Select a customer</SelectItem>
                        {allCustomers.map(cust => <SelectItem key={cust.id} value={cust.id}>{cust.firstName} {cust.lastName}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
            }
            onExport={() => handleExportCSV(customerServiceHistory, `Customer Service History ${selectedCustomerIdForHistory !== "ALL" ? customerMap.get(selectedCustomerIdForHistory) : ""}`, ["Job ID", "Date", "Motorcycle/Type", "Services/Type", "Total"])}
        />
      </div>
      <CardDescription className="text-center text-xs mt-4">
        Note: More advanced export formats (Excel, PDF) typically require server-side processing or larger client-side libraries.
      </CardDescription>
    </div>
  );
}
