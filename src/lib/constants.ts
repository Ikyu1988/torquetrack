
export const USER_ROLES = {
  ADMIN: 'Admin',
  CASHIER: 'Cashier',
  MECHANIC: 'Mechanic',
  CUSTOMER: 'Customer',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
export const USER_ROLE_OPTIONS = Object.values(USER_ROLES);

export const JOB_ORDER_STATUSES = {
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  AWAITING_PARTS: 'Awaiting Parts',
  READY_FOR_PICKUP: 'Ready for Pickup',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  SALE_COMPLETED: 'Sale - Completed', // New status for direct sales
} as const;

export type JobOrderStatus = typeof JOB_ORDER_STATUSES[keyof typeof JOB_ORDER_STATUSES];
export const JOB_ORDER_STATUS_OPTIONS = Object.values(JOB_ORDER_STATUSES);


export const PAYMENT_STATUSES = {
  PAID: 'Paid',
  PARTIAL: 'Partial',
  UNPAID: 'Unpaid',
  REFUNDED: 'Refunded',
} as const;

export type PaymentStatus = typeof PAYMENT_STATUSES[keyof typeof PAYMENT_STATUSES];
export const PAYMENT_STATUS_OPTIONS = Object.values(PAYMENT_STATUSES);

export const COMMISSION_TYPES = {
  FIXED: 'Fixed',
  PERCENTAGE: 'Percentage',
} as const;

export type CommissionType = typeof COMMISSION_TYPES[keyof typeof COMMISSION_TYPES];
export const COMMISSION_TYPE_OPTIONS = Object.values(COMMISSION_TYPES);

export const PAYMENT_METHODS = {
  CASH: 'Cash',
  CREDIT_CARD: 'Credit Card',
  DEBIT_CARD: 'Debit Card',
  BANK_TRANSFER: 'Bank Transfer',
  OTHER: 'Other',
} as const;

export type PaymentMethod = typeof PAYMENT_METHODS[keyof typeof PAYMENT_METHODS];
export const PAYMENT_METHOD_OPTIONS = Object.values(PAYMENT_METHODS);


// --- Purchase Order Management ---
export const PURCHASE_REQUISITION_STATUSES = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  ORDERED: 'Ordered', // If PO generated from it
  CANCELLED: 'Cancelled',
} as const;
export type PurchaseRequisitionStatus = typeof PURCHASE_REQUISITION_STATUSES[keyof typeof PURCHASE_REQUISITION_STATUSES];
export const PURCHASE_REQUISITION_STATUS_OPTIONS = Object.values(PURCHASE_REQUISITION_STATUSES);


export const PURCHASE_ORDER_STATUSES = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval', // Optional, if POs also need approval
  APPROVED: 'Approved', // Or "Sent to Supplier"
  PARTIALLY_RECEIVED: 'Partially Received',
  FULLY_RECEIVED: 'Fully Received',
  CLOSED: 'Closed', // All items received and paid
  CANCELLED: 'Cancelled',
} as const;
export type PurchaseOrderStatus = typeof PURCHASE_ORDER_STATUSES[keyof typeof PURCHASE_ORDER_STATUSES];
export const PURCHASE_ORDER_STATUS_OPTIONS = Object.values(PURCHASE_ORDER_STATUSES);


// --- Receiving & Inventory Management ---
export const GOODS_RECEIPT_STATUSES = {
  PENDING: 'Pending', // Awaiting verification
  COMPLETED: 'Completed', // Goods verified and stock updated
  PARTIAL: 'Partial', // For partial receipts against a PO
  CANCELLED: 'Cancelled',
} as const;
export type GoodsReceiptStatus = typeof GOODS_RECEIPT_STATUSES[keyof typeof GOODS_RECEIPT_STATUSES];
export const GOODS_RECEIPT_STATUS_OPTIONS = Object.values(GOODS_RECEIPT_STATUSES);
