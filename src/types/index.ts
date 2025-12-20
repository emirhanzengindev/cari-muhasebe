export interface CurrentAccount {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  taxOffice?: string;
  taxNumber?: string;
  isActive: boolean;
  accountType: 'CUSTOMER' | 'SUPPLIER';
  balance: number;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: string;
  name: string;
  sku?: string;
  barcode?: string;
  buyPrice: number;
  sellPrice: number;
  vatRate: number;
  stockQuantity: number;
  criticalLevel: number;
  tenantId: string;
  categoryId?: string;
  warehouseId?: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Fabric-specific fields
  color?: string;         // Fabric color (e.g., "Blue", "Red")
  unit?: string;          // Measurement unit (e.g., "meter", "kilogram", "piece")
  minStockLevel?: number; // Minimum stock level alert
  pattern?: string;       // Fabric pattern/design
  composition?: string;   // Fabric composition (e.g., "100% Cotton", "Polyester Blend")
  width?: number;         // Fabric width in centimeters
  weight?: number;        // Fabric weight in grams per square meter (GSM)
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  value: string;
  priceAdjustment: number;
  stockQuantity: number;
  sku?: string;
  barcode?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Warehouse {
  id: string;
  name: string;
  location?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface StockMovement {
  id: string;
  productId?: string;
  variantId?: string;
  movementType: 'IN' | 'OUT';
  quantity: number;
  price: number;
  description?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  invoiceType: 'SALES' | 'PURCHASE';
  date: Date;
  accountId: string;
  subtotal: number;
  discount: number;
  vatAmount: number;
  totalAmount: number;
  currency: 'TRY' | 'USD'; // Para birimi desteği eklendi
  description?: string;
  isDraft: boolean;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  total: number;
  currency: 'TRY' | 'USD'; // Para birimi desteği eklendi
  createdAt: Date;
  updatedAt: Date;
}

export interface Transaction {
  id: string;
  transactionType: 'COLLECTION' | 'PAYMENT';
  amount: number;
  accountId?: string;
  safeId?: string;
  bankId?: string;
  description?: string;
  date: Date;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Safe {
  id: string;
  name: string;
  balance: number;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Bank {
  id: string;
  name: string;
  iban?: string;
  balance: number;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Cheque {
  id: string;
  chequeType: 'CHEQUE' | 'PROMISSORY_NOTE';
  amount: number;
  issueDate: Date;
  maturityDate: Date;
  issuerName: string;
  accountId?: string;
  status: 'PENDING' | 'COLLECTED' | 'BOUNCED';
  description?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}