
import type { UserRole, JobOrderStatus, PaymentStatus, CommissionType } from '@/lib/constants';

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
  customerId: string;
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

// Simplified for initial Job Order pass, can be expanded later
export interface JobOrderServiceItem {
  serviceIdRef?: string; // Optional link to a Service
  description: string;
  laborCost: number;
  assignedMechanicId?: string;
  notes?: string;
}

export interface JobOrderPartItem {
  partIdRef?: string; // Optional link to a Part
  description: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number; // quantity * pricePerUnit
}

export interface JobOrder {
  id: string; 
  customerId: string;
  motorcycleId: string;
  status: JobOrderStatus;
  
  // Simplified fields for initial implementation
  servicesDescription?: string; 
  partsDescription?: string;    

  // Detailed items - can be populated based on simplified fields or future UI
  // servicesPerformed: JobOrderServiceItem[]; 
  // partsUsed: JobOrderPartItem[];          

  diagnostics?: string;
  images?: string[]; 
  estimatedCompletionDate?: Date;
  actualCompletionDate?: Date;
  totalLaborCost: number;
  totalPartsCost: number;
  discountAmount?: number;
  taxAmount?: number;
  grandTotal: number;
  paymentStatus: PaymentStatus;
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

export interface Payment {
  id: string;
  jobOrderId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string; 
  notes?: string;
  processedByUserId: string;
}
