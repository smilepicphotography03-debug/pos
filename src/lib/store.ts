"use client";

// Data store management for products, invoices, settings, and users

import { Product, Invoice, ShopSettings, User } from './types';
import { Storage, STORAGE_KEYS } from './storage';

// Default settings
const DEFAULT_SETTINGS: ShopSettings = {
  shopName: 'Kumar Pooja Store',
  address: '',
  phone: '',
  email: '',
  gst: '',
  upiId: '',
  qrCodeUrl: '',
  invoicePrefix: 'INV',
  invoiceCounter: 1,
  paperSize: 'Thermal',
  theme: 'light',
  currency: '₹',
};

// Default admin user
const DEFAULT_ADMIN: User = {
  id: 'admin',
  name: 'Admin',
  role: 'Admin',
  pin: '1234',
  createdAt: new Date().toISOString(),
};

// Initialize default data if not exists
export function initializeStore() {
  // Initialize users with default admin
  const users = Storage.get<User[]>(STORAGE_KEYS.USERS, []);
  if (users.length === 0) {
    Storage.set(STORAGE_KEYS.USERS, [DEFAULT_ADMIN]);
  }

  // Initialize settings
  const settings = Storage.get<ShopSettings | null>(STORAGE_KEYS.SETTINGS, null);
  if (!settings) {
    Storage.set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
  }

  // Initialize products
  const products = Storage.get<Product[]>(STORAGE_KEYS.PRODUCTS, []);
  if (products.length === 0) {
    Storage.set(STORAGE_KEYS.PRODUCTS, []);
  }

  // Initialize invoices
  const invoices = Storage.get<Invoice[]>(STORAGE_KEYS.INVOICES, []);
  if (invoices.length === 0) {
    Storage.set(STORAGE_KEYS.INVOICES, []);
  }
}

// User management
export const UserStore = {
  getAll: (): User[] => Storage.get<User[]>(STORAGE_KEYS.USERS, [DEFAULT_ADMIN]),
  
  getById: (id: string): User | undefined => {
    const users = UserStore.getAll();
    return users.find(u => u.id === id);
  },
  
  authenticate: (pin: string): User | null => {
    const users = UserStore.getAll();
    return users.find(u => u.pin === pin) || null;
  },
  
  create: (user: Omit<User, 'id' | 'createdAt'>): User => {
    const users = UserStore.getAll();
    const newUser: User = {
      ...user,
      id: `user_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    Storage.set(STORAGE_KEYS.USERS, users);
    return newUser;
  },
  
  update: (id: string, updates: Partial<User>): User | null => {
    const users = UserStore.getAll();
    const index = users.findIndex(u => u.id === id);
    if (index === -1) return null;
    
    users[index] = { ...users[index], ...updates };
    Storage.set(STORAGE_KEYS.USERS, users);
    return users[index];
  },
  
  delete: (id: string): boolean => {
    const users = UserStore.getAll();
    const filtered = users.filter(u => u.id !== id);
    if (filtered.length === users.length) return false;
    
    Storage.set(STORAGE_KEYS.USERS, filtered);
    return true;
  },
};

// Product management
export const ProductStore = {
  getAll: (): Product[] => Storage.get<Product[]>(STORAGE_KEYS.PRODUCTS, []),
  
  getById: (id: string): Product | undefined => {
    const products = ProductStore.getAll();
    return products.find(p => p.id === id);
  },
  
  search: (query: string): Product[] => {
    const products = ProductStore.getAll();
    const lowerQuery = query.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) ||
      p.barcode?.toLowerCase().includes(lowerQuery) ||
      p.category?.toLowerCase().includes(lowerQuery)
    );
  },
  
  create: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const products = ProductStore.getAll();
    const newProduct: Product = {
      ...product,
      id: `prod_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    products.push(newProduct);
    Storage.set(STORAGE_KEYS.PRODUCTS, products);
    return newProduct;
  },
  
  update: (id: string, updates: Partial<Product>): Product | null => {
    const products = ProductStore.getAll();
    const index = products.findIndex(p => p.id === id);
    if (index === -1) return null;
    
    products[index] = { 
      ...products[index], 
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    Storage.set(STORAGE_KEYS.PRODUCTS, products);
    return products[index];
  },
  
  delete: (id: string): boolean => {
    const products = ProductStore.getAll();
    const filtered = products.filter(p => p.id !== id);
    if (filtered.length === products.length) return false;
    
    Storage.set(STORAGE_KEYS.PRODUCTS, filtered);
    return true;
  },
  
  updateStock: (id: string, quantity: number): boolean => {
    const product = ProductStore.getById(id);
    if (!product) return false;
    
    const newStock = product.stock + quantity;
    if (newStock < 0) return false;
    
    ProductStore.update(id, { stock: newStock });
    return true;
  },
  
  getLowStock: (): Product[] => {
    const products = ProductStore.getAll();
    return products.filter(p => {
      const minStock = p.minStock || 0;
      return p.stock <= minStock;
    });
  },
};

// Invoice management
export const InvoiceStore = {
  getAll: (): Invoice[] => Storage.get<Invoice[]>(STORAGE_KEYS.INVOICES, []),
  
  getById: (id: string): Invoice | undefined => {
    const invoices = InvoiceStore.getAll();
    return invoices.find(i => i.id === id);
  },
  
  create: (invoice: Omit<Invoice, 'id' | 'invoiceNumber' | 'createdAt'>): Invoice => {
    const invoices = InvoiceStore.getAll();
    const settings = SettingsStore.get();
    
    const newInvoice: Invoice = {
      ...invoice,
      id: `inv_${Date.now()}`,
      invoiceNumber: `${settings.invoicePrefix}${settings.invoiceCounter.toString().padStart(4, '0')}`,
      createdAt: new Date().toISOString(),
    };
    
    invoices.push(newInvoice);
    Storage.set(STORAGE_KEYS.INVOICES, invoices);
    
    // Increment invoice counter
    SettingsStore.update({ invoiceCounter: settings.invoiceCounter + 1 });
    
    // Update product stock
    newInvoice.items.forEach(item => {
      ProductStore.updateStock(item.product.id, -item.quantity);
    });
    
    return newInvoice;
  },
  
  getByDateRange: (startDate: Date, endDate: Date): Invoice[] => {
    const invoices = InvoiceStore.getAll();
    return invoices.filter(i => {
      const invoiceDate = new Date(i.createdAt);
      return invoiceDate >= startDate && invoiceDate <= endDate;
    });
  },
  
  getTodayInvoices: (): Invoice[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return InvoiceStore.getByDateRange(today, tomorrow);
  },
  
  getTotalSales: (invoices: Invoice[]): number => {
    return invoices.reduce((sum, inv) => sum + inv.total, 0);
  },
};

// Settings management
export const SettingsStore = {
  get: (): ShopSettings => Storage.get<ShopSettings>(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS),
  
  update: (updates: Partial<ShopSettings>): ShopSettings => {
    const settings = SettingsStore.get();
    const newSettings = { ...settings, ...updates };
    Storage.set(STORAGE_KEYS.SETTINGS, newSettings);
    return newSettings;
  },
  
  reset: (): ShopSettings => {
    Storage.set(STORAGE_KEYS.SETTINGS, DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  },
};

// Current user session
export const SessionStore = {
  get: (): User | null => Storage.get<User | null>(STORAGE_KEYS.CURRENT_USER, null),
  
  set: (user: User): void => {
    Storage.set(STORAGE_KEYS.CURRENT_USER, user);
  },
  
  clear: (): void => {
    Storage.remove(STORAGE_KEYS.CURRENT_USER);
  },
};
