
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";
import { PAYMENT_METHOD_OPTIONS, PAYMENT_STATUSES } from "@/lib/constants";
import type { JobOrder, Payment, PaymentMethod } from "@/types";
import { DollarSign } from "lucide-react";

interface AddPaymentDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  jobOrder: JobOrder;
  onPaymentAdded: () => void;
}

const paymentFormSchema = z.object({
  amount: z.coerce.number().min(0.01, "Amount must be greater than 0."),
  paymentDate: z.date(),
  method: z.enum(PAYMENT_METHOD_OPTIONS),
  notes: z.string().max(250).optional().or(z.literal('')),
});

type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export function AddPaymentDialog({ isOpen, onOpenChange, jobOrder, onPaymentAdded }: AddPaymentDialogProps) {
  const balanceDue = jobOrder.grandTotal - jobOrder.amountPaid;

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: {
      amount: Math.max(0, balanceDue), // Default to remaining balance, but not less than 0
      paymentDate: new Date(),
      method: "Cash",
      notes: "",
    },
  });
  
  function onSubmit(data: PaymentFormValues) {
    if (typeof window !== 'undefined' && (window as any).__jobOrderStore && (window as any).__paymentStore) {
        const newPaymentData: Omit<Payment, 'id' | 'createdAt'> = {
            jobOrderId: jobOrder.id,
            amount: data.amount,
            paymentDate: data.paymentDate,
            method: data.method,
            notes: data.notes,
            processedByUserId: "current_user_placeholder", // Replace with actual user ID
        };
        
        // Add to payment store (if you have a separate one)
        const savedPayment = (window as any).__paymentStore.addPayment(newPaymentData);

        // Update job order in its store
        (window as any).__jobOrderStore.addPaymentToJobOrder(jobOrder.id, savedPayment);
        
        onPaymentAdded();
        onOpenChange(false);
        form.reset({ amount: 0, paymentDate: new Date(), method: "Cash", notes: "" });
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
        onOpenChange(open);
        if (!open) {
            form.reset({ amount: Math.max(0, balanceDue), paymentDate: new Date(), method: "Cash", notes: "" });
        }
    }}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Add Payment for Job Order #{jobOrder.id.substring(0,6)}</DialogTitle>
          <DialogDescription>
            Record a payment made towards this job order. Balance Due: ${balanceDue.toFixed(2)}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Amount</FormLabel>
                  <FormControl>
                    <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input type="number" step="0.01" placeholder="0.00" {...field} className="pl-8" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="paymentDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Payment Date</FormLabel>
                  <DatePicker
                    value={field.value}
                    onChange={field.onChange}
                    disabled={(date) => date > new Date()}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="method"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Payment Method</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select payment method" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {PAYMENT_METHOD_OPTIONS.map(method => (
                        <SelectItem key={method} value={method}>{method}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="e.g., Paid by customer's brother" {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                  onOpenChange(false);
                  form.reset({ amount: Math.max(0, balanceDue), paymentDate: new Date(), method: "Cash", notes: "" });
                }}>
                Cancel
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? "Saving..." : "Record Payment"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
