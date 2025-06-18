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
  commissionType?: CommissionType;
  commissionValue?: number; // Amount for fixed, percentage for percentage
  isActive: boolean;
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
}

export interface JobOrderService {
  serviceId: string;
  serviceName: string; // Denormalized for display
  assignedMechanicId?: string;
  laborCost: number; // Can be overridden from service default
  estimatedHours?: number;
  commission?: number; // Calculated commission for this service
  notes?: string;
}

export interface JobOrderPart {
  partId: string;
  partName: string; // Denormalized for display
  quantity: number;
  pricePerUnit: number; // Can be overridden from part default
  totalPrice: number;
}

export interface JobOrder {
  id: string; // Unique Job Order ID
  customerId: string;
  motorcycleId: string;
  status: JobOrderStatus;
  services: JobOrderService[];
  partsUsed: JobOrderPart[];
  notes?: string;
  diagnostics?: string;
  images?: string[]; // URLs of attached images
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
  createdByUserId: string; // User who created the job order
}

export interface Mechanic {
  id: string; // Could be userId if mechanics are also users
  name: string;
  specializations?: string[]; // e.g., ['Engine', 'Electrical']
  isActive: boolean;
  // other mechanic-specific fields
}

export interface Payment {
  id: string;
  jobOrderId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: string; // e.g., Cash, Card, Online
  notes?: string;
  processedByUserId: string;
}
