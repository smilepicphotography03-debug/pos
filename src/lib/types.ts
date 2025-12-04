// Core type definitions for POS system

export type Unit = 
  | 'Kg' 
  | 'Gram' 
  | 'Litre' 
  | 'Millilitre' 
  | 'Piece' 
  | 'Pack' 
  | 'Set' 
  | 'Dozen' 
  | 'Meter';

export type UserRole = 'Admin' | 'Cashier';

export type PaymentMode = 'Cash' | 'UPI' | 'Card' | 'Other';

export type PaperSize = 'Thermal' | 'A4';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  pin: string;
  createdAt: string;
}

export interface Product {
  id: string;
  name: string;
  baseUnit: Unit;
  price: number; // Price per base unit
  stock: number; // Stock in base unit
  barcode?: string;
  category?: string;
  minStock?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number; // In base unit
  unit: Unit; // Display unit
  displayQuantity: number; // Quantity in display unit
  discount: number; // Percentage
  subtotal: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  items: CartItem[];
  subtotal: number;
  discount: number; // Percentage or fixed amount
  discountType: 'percentage' | 'fixed';
  total: number;
  paymentMode: PaymentMode;
  cashierId: string;
  cashierName: string;
  customerName?: string;
  customerPhone?: string;
  createdAt: string;
  notes?: string;
}

export interface ShopSettings {
  shopName: string;
  address: string;
  phone: string;
  email?: string;
  gst?: string;
  upiId?: string;
  qrCodeUrl?: string;
  invoicePrefix: string;
  invoiceCounter: number;
  paperSize: PaperSize;
  theme: 'light' | 'dark';
  currency: string;
}

export interface DashboardStats {
  todaySales: number;
  todayInvoices: number;
  thisWeekSales: number;
  thisMonthSales: number;
  lowStockProducts: Product[];
  recentInvoices: Invoice[];
}
