import { create } from 'zustand';
import { Invoice } from '@/types';

// Load invoices from localStorage on initial load
const loadInvoicesFromLocalStorage = (): Invoice[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('invoices');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        return parsed.map((invoice: any) => ({
          ...invoice,
          date: new Date(invoice.date),
          createdAt: new Date(invoice.createdAt),
          updatedAt: new Date(invoice.updatedAt)
        }));
      } catch (e) {
        console.error('Failed to parse invoices from localStorage', e);
        return [];
      }
    }
  }
  return [];
};

// Save invoices to localStorage
const saveInvoicesToLocalStorage = (invoices: Invoice[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('invoices', JSON.stringify(invoices));
  }
};

// Clear all invoices from localStorage
const clearInvoicesFromLocalStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('invoices');
  }
};

interface InvoiceState {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
  
  // Invoice actions
  fetchInvoices: () => Promise<void>;
  addInvoice: (invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Invoice>;
  updateInvoice: (id: string, invoice: Partial<Invoice>) => Promise<void>;
  deleteInvoice: (id: string) => Promise<void>;
  getInvoiceById: (id: string) => Invoice | undefined;
  clearAllInvoices: () => Promise<void>; // Yeni eklenen fonksiyon
}

export const useInvoiceStore = create<InvoiceState>((set, get) => ({
  invoices: loadInvoicesFromLocalStorage(),
  loading: false,
  error: null,

  // Invoice actions
  fetchInvoices: async () => {
    set({ loading: true, error: null });
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/invoices');
      // const invoices = await response.json();
      
      // Mock data for now - but preserve any existing invoices
      const existingInvoices = get().invoices;
      const mockInvoices: Invoice[] = [
        {
          id: '1',
          invoiceNumber: 'INV-2023-001',
          invoiceType: 'SALES',
          date: new Date('2023-10-15'),
          accountId: '1',
          subtotal: 7500.0,
          discount: 0,
          vatAmount: 0, // KDV kaldırıldı
          totalAmount: 7500.0, // KDV'siz toplam
          currency: 'USD', // Varsayılan olarak USD
          description: 'Laptop purchase',
          isDraft: false,
          tenantId: 'tenant-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          invoiceNumber: 'INV-2023-002',
          invoiceType: 'PURCHASE',
          date: new Date('2023-10-10'),
          accountId: '12',
          subtotal: 15000.0,
          discount: 0,
          vatAmount: 0, // KDV kaldırıldı
          totalAmount: 15000.0, // KDV'siz toplam
          currency: 'USD', // Varsayılan olarak USD
          description: 'Fabric materials',
          isDraft: false,
          tenantId: 'tenant-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          invoiceNumber: 'INV-2023-003',
          invoiceType: 'SALES',
          date: new Date('2023-10-05'),
          accountId: '3',
          subtotal: 3200.0,
          discount: 0,
          vatAmount: 0, // KDV kaldırıldı
          totalAmount: 3200.0, // KDV'siz toplam
          currency: 'USD', // Varsayılan olarak USD
          description: 'Textile products',
          isDraft: false,
          tenantId: 'tenant-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      // Merge existing invoices with mock data to avoid duplicates
      const mergedInvoices = [...existingInvoices];
      mockInvoices.forEach(mockInvoice => {
        if (!mergedInvoices.some(inv => inv.id === mockInvoice.id)) {
          mergedInvoices.push(mockInvoice);
        }
      });
      
      set({ invoices: mergedInvoices, loading: false });
      saveInvoicesToLocalStorage(mergedInvoices);
    } catch (error) {
      set({ error: 'Failed to fetch invoices', loading: false });
    }
  },

  addInvoice: async (invoiceData) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/invoices', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(invoiceData),
      // });
      // const newInvoice = await response.json();
      
      // Mock implementation
      const newInvoice: Invoice = {
        ...invoiceData,
        id: Math.random().toString(36).substr(2, 9),
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      set((state) => {
        const updatedInvoices = [...state.invoices, newInvoice];
        saveInvoicesToLocalStorage(updatedInvoices);
        return { invoices: updatedInvoices };
      });
      
      return newInvoice;
    } catch (error) {
      set({ error: 'Failed to add invoice' });
      throw error;
    }
  },

  updateInvoice: async (id, invoiceData) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch(`/api/invoices/${id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(invoiceData),
      // });
      // const updatedInvoice = await response.json();
      
      // Mock implementation
      set((state) => {
        const updatedInvoices = state.invoices.map((invoice) =>
          invoice.id === id ? { ...invoice, ...invoiceData, updatedAt: new Date() } : invoice
        );
        saveInvoicesToLocalStorage(updatedInvoices);
        return { invoices: updatedInvoices };
      });
    } catch (error) {
      set({ error: 'Failed to update invoice' });
    }
  },

  deleteInvoice: async (id) => {
    try {
      // In a real app, this would be an API call
      // await fetch(`/api/invoices/${id}`, { method: 'DELETE' });
      
      // Mock implementation
      set((state) => {
        const updatedInvoices = state.invoices.filter((invoice) => invoice.id !== id);
        saveInvoicesToLocalStorage(updatedInvoices);
        return { invoices: updatedInvoices };
      });
    } catch (error) {
      set({ error: 'Failed to delete invoice' });
    }
  },

  getInvoiceById: (id) => {
    return get().invoices.find(invoice => invoice.id === id);
  },

  clearAllInvoices: async () => {
    try {
      set({ invoices: [] });
      clearInvoicesFromLocalStorage();
    } catch (error) {
      set({ error: 'Failed to clear invoices' });
    }
  },
}));