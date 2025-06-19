

import type { UserRole, JobOrderStatus, PaymentStatus, CommissionType, PaymentMethod as ImportedPaymentMethod, PurchaseRequisitionStatus, PurchaseOrderStatus, GoodsReceiptStatus, SalesOrderStatus } from '@/lib/constants';

export type PaymentMethod = ImportedPaymentMethod; // Explicitly re-export the type

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
  supplier?: string; // Supplier name, or could be changed to supplierId if Supplier becomes a full entity
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
  orderId: string; // Links payment to a JobOrder OR SalesOrder
  orderType: 'JobOrder' | 'SalesOrder';
  amount: number;
  paymentDate: Date;
  method: PaymentMethod;
  notes?: string;
  processedByUserId: string; // Placeholder for user who processed payment
  createdAt: Date;
}

export interface JobOrder {
  id: string;
  customerId: string;
  motorcycleId: string;
  status: JobOrderStatus;

  servicesPerformed: JobOrderServiceItem[];
  partsUsed: JobOrderPartItem[];

  servicesDescription?: string;
  partsDescription?: string;

  diagnostics?: string;
  images?: string[];
  estimatedCompletionDate?: Date;
  actualCompletionDate?: Date;

  discountAmount?: number;
  taxAmount?: number;
  grandTotal: number;

  paymentStatus: PaymentStatus;
  amountPaid: number;
  paymentHistory: Payment[];

  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string;
}

export interface SalesOrderItem {
  id: string;
  partId: string;
  partName: string;
  quantity: number;
  pricePerUnit: number;
  totalPrice: number;
}

export interface SalesOrder {
  id: string;
  customerId?: string; // Optional for walk-in
  customerName?: string; // Denormalized if customerId is present
  status: SalesOrderStatus;
  items: SalesOrderItem[];
  discountAmount?: number;
  taxAmount?: number;
  grandTotal: number;
  paymentStatus: PaymentStatus;
  amountPaid: number;
  paymentHistory: Payment[];
  notes?: string;
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

export interface ModuleSettings {
  reportsEnabled?: boolean;
  directSalesEnabled?: boolean;
  purchaseOrdersEnabled?: boolean;
  // Add more modules as needed
}

export interface ShopSettings {
  shopName: string;
  shopAddress?: string;
  shopPhone?: string;
  shopEmail?: string;
  shopLogoUrl?: string; // URL to the logo, actual upload not handled
  currencySymbol: string;
  currencyCode?: string; // e.g. PHP, USD
  defaultTaxRate?: number; // as a percentage, e.g., 10 for 10%
  defaultLaborRate?: number; // Default hourly labor rate for the shop
  theme: 'light' | 'dark'; // Theme preference
  moduleSettings?: ModuleSettings;
  updatedAt?: Date;
}

// --- Purchase Order Management ---
export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  productCatalogNotes?: string; // Simplified: notes about products/pricing
  performanceNotes?: string; // Simplified: notes about performance
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseRequisitionItem {
  id: string; // Unique ID for this item in the requisition
  partId?: string; // If requesting an existing part
  partName?: string; // If partId is known, this can be auto-filled or a new description
  description: string; // Required: description of item needed
  quantity: number;
  estimatedPricePerUnit?: number; // Optional
  notes?: string;
}

export interface PurchaseRequisition {
  id: string;
  requestedByUserId: string; // User who submitted
  department?: string; // Optional
  status: PurchaseRequisitionStatus;
  items: PurchaseRequisitionItem[];
  totalEstimatedValue?: number; // Calculated from items
  notes?: string;
  submittedDate: Date;
  approvedDate?: Date;
  approvedByUserId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PurchaseOrderItem {
  id: string; // Unique ID for this item in the PO
  partId: string; // Reference to Part.id (assuming POs are for existing parts)
  partName: string; // Denormalized
  description: string; // From part or requisition
  quantity: number;
  unitPrice: number; // Agreed price with supplier
  totalPrice: number; // quantity * unitPrice
}

export interface PurchaseOrder {
  id: string;
  purchaseRequisitionId?: string; // Optional: if generated from a requisition
  supplierId: string;
  supplierName?: string; // Denormalized
  orderDate: Date;
  expectedDeliveryDate?: Date;
  items: PurchaseOrderItem[];
  subTotal: number;
  taxAmount?: number; // Can be applied based on supplier/region
  shippingCost?: number;
  grandTotal: number;
  paymentTerms?: string;
  shippingAddress?: string;
  billingAddress?: string;
  status: PurchaseOrderStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  createdByUserId: string;
}

// --- Receiving & Inventory Management ---
export interface GoodsReceiptItem {
  id: string;
  purchaseOrderItemId: string; // Link back to the PO item
  partId: string;
  partName: string;
  quantityOrdered: number;
  quantityReceived: number;
  condition?: string; // e.g., "Good", "Damaged"
  notes?: string;
}

export interface GoodsReceipt {
  id: string;
  purchaseOrderId: string;
  supplierId: string; // Denormalized for easier lookup
  receivedDate: Date;
  receivedByUserId: string;
  items: GoodsReceiptItem[];
  status: GoodsReceiptStatus;
  notes?: string; // e.g., "Partial delivery", "All items received in good condition"
  discrepancies?: string; // Notes on any issues
  createdAt: Date;
  updatedAt: Date;
}
