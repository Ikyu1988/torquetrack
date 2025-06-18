
import type { UserRole, JobOrderStatus, PaymentStatus, CommissionType, PaymentMethod } from '@/lib/constants';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  // other user-specific fields
}

export interface Customer {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  address?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Motorcycle {
  id: string;
  customerId: string; // A motorcycle must belong to a customer
  make: string;
  model: string;
  year?: number;
  color?: string;
  plateNumber: string;
  vin?: string;
  odometer: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Service {
  id: string;
  name: string;
  description?: string;
  category?: string; // e.g., Electrical, Mechanical, Maintenance
  defaultLaborCost: number;
  estimatedHours?: number;
  commissionType?: CommissionType; // Optional: Can be undefined if no commission
  commissionValue?: number; // Amount for fixed, percentage for percentage
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Part {
  id: string;
  name: string;
  brand?: string;
  category?: string;
  sku?: string; // Stock Keeping Unit
  price: number; // Selling price
  cost?: number; // Purchase cost
  supplier?: string;
  stockQuantity: number;
  minStockAlert?: number;
  notes?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobOrderServiceItem {
  id: string; // Unique ID for the line item itself
  serviceId: string; // Reference to Service.id
  serviceName: string; // Denormalized for display
  laborCost: number;
  assignedMechanicId?: string; // Optional
  notes?: string;
}

export interface JobOrderPartItem {
  id: string; // Unique ID for the line item itself
  partId: string; // Reference to Part.id
  partName: string; // Denormalized for display
  quantity: number;
  pricePerUnit: number;
  totalPrice: number; // quantity * pricePerUnit
}

export interface Payment {
  id: string;
  jobOrderId: string; // Links payment to a JobOrder or a Direct Sale (which might be stored as a JobOrder)
  amount: number;
  paymentDate: Date;
  method: PaymentMethod;
  notes?: string;
  processedByUserId: string; // Placeholder for user who processed payment
  createdAt: Date;
}

export interface JobOrder {
  id: string;
  customerId?: string; // Optional for direct/walk-in sales
  motorcycleId?: string; // Optional for direct/walk-in sales
  status: JobOrderStatus;
  
  servicesPerformed: JobOrderServiceItem[]; 
  partsUsed: JobOrderPartItem[];          

  servicesDescription?: string; // Overall notes for services, can be empty if using line items
  partsDescription?: string;    // Overall notes for parts, can be empty if using line items

  diagnostics?: string; // Relevant for service jobs
  images?: string[]; 
  estimatedCompletionDate?: Date; // Relevant for service jobs
  actualCompletionDate?: Date;
  
  discountAmount?: number;
  taxAmount?: number; // This could be calculated based on shop settings
  grandTotal: number;
  
  paymentStatus: PaymentStatus;
  amountPaid: number; // Total amount paid for this job order/sale
  paymentHistory: Payment[]; // Array of payment transactions

  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string; 
}

export interface Mechanic {
  id: string;
  name: string;
  specializations?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ShopSettings {
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
  shopEmail?: string;
  currencySymbol: string; 
  defaultTaxRate?: number; // as a percentage, e.g., 10 for 10%
  updatedAt?: Date;
}
