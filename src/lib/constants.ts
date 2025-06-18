
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
