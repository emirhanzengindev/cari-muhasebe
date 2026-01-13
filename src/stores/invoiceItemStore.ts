import { create } from 'zustand';
import { InvoiceItem } from '@/types';
import { useTenantStore } from '@/lib/tenantStore';

// Load invoice items from localStorage on initial load
const loadInvoiceItemsFromLocalStorage = (): InvoiceItem[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('invoiceItems');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        return parsed.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt),
          updatedAt: new Date(item.updatedAt)
        }));
      } catch (e) {
        console.error('Failed to parse invoice items from localStorage', e);
        return [];
      }
    }
  }
  return [];
};

// Save invoice items to localStorage
const saveInvoiceItemsToLocalStorage = (invoiceItems: InvoiceItem[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('invoiceItems', JSON.stringify(invoiceItems));
  }
};

// Clear all invoice items from localStorage
const clearInvoiceItemsFromLocalStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('invoiceItems');
  }
};

interface InvoiceItemState {
  invoiceItems: InvoiceItem[];
  loading: boolean;
  error: string | null;
  
  // Invoice item actions
  fetchInvoiceItems: () => Promise<void>;
  addInvoiceItem: (invoiceItem: Omit<InvoiceItem, 'id' | 'createdAt' | 'updatedAt'>) => Promise<InvoiceItem>;
  updateInvoiceItem: (id: string, invoiceItem: Partial<InvoiceItem>) => Promise<void>;
  deleteInvoiceItem: (id: string) => Promise<void>;
  getInvoiceItemsByInvoiceId: (invoiceId: string) => InvoiceItem[];
  clearAllInvoiceItems: () => Promise<void>; // Yeni eklenen fonksiyon
}

export const useInvoiceItemStore = create<InvoiceItemState>((set, get) => ({
  invoiceItems: loadInvoiceItemsFromLocalStorage(),
  loading: false,
  error: null,
  
  // Invoice item actions
  fetchInvoiceItems: async () => {
    set({ loading: true, error: null });
    try {
      // Get current tenantId from tenant store
      const currentTenantId = useTenantStore.getState().tenantId || 'default-tenant';
      
      // Load existing invoice items from localStorage
      const existingInvoiceItems = get().invoiceItems;
      
      // Filter invoice items by tenantId
      const tenantInvoiceItems = existingInvoiceItems.filter(item => item.tenantId === currentTenantId);
      
      set({ invoiceItems: tenantInvoiceItems, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch invoice items', loading: false });
    }
  },

  addInvoiceItem: async (invoiceItemData) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/invoice-items', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(invoiceItemData),
      // });
      // const newInvoiceItem = await response.json();
      
      // Mock implementation
      const currentTenantId = useTenantStore.getState().tenantId || 'default-tenant';
      const newInvoiceItem: InvoiceItem = {
        ...invoiceItemData,
        id: Math.random().toString(36).substr(2, 9),
        tenantId: currentTenantId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      set((state) => {
        const updatedInvoiceItems = [...state.invoiceItems, newInvoiceItem];
        saveInvoiceItemsToLocalStorage(updatedInvoiceItems);
        return { invoiceItems: updatedInvoiceItems };
      });
      
      return newInvoiceItem;
    } catch (error) {
      set({ error: 'Failed to add invoice item' });
      throw error;
    }
  },

  updateInvoiceItem: async (id, invoiceItemData) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch(`/api/invoice-items/${id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(invoiceItemData),
      // });
      // const updatedInvoiceItem = await response.json();
      
      // Mock implementation
      set((state) => {
        const updatedInvoiceItems = state.invoiceItems.map((invoiceItem) =>
          invoiceItem.id === id ? { ...invoiceItem, ...invoiceItemData, updatedAt: new Date() } : invoiceItem
        );
        saveInvoiceItemsToLocalStorage(updatedInvoiceItems);
        return { invoiceItems: updatedInvoiceItems };
      });
    } catch (error) {
      set({ error: 'Failed to update invoice item' });
    }
  },

  deleteInvoiceItem: async (id) => {
    try {
      // In a real app, this would be an API call
      // await fetch(`/api/invoice-items/${id}`, { method: 'DELETE' });
      
      // Mock implementation
      set((state) => {
        const updatedInvoiceItems = state.invoiceItems.filter((invoiceItem) => invoiceItem.id !== id);
        saveInvoiceItemsToLocalStorage(updatedInvoiceItems);
        return { invoiceItems: updatedInvoiceItems };
      });
    } catch (error) {
      set({ error: 'Failed to delete invoice item' });
    }
  },

  getInvoiceItemsByInvoiceId: (invoiceId) => {
    const currentTenantId = useTenantStore.getState().tenantId || 'default-tenant';
    return get().invoiceItems.filter(item => item.invoiceId === invoiceId && item.tenantId === currentTenantId);
  },

  clearAllInvoiceItems: async () => {
    try {
      set({ invoiceItems: [] });
      clearInvoiceItemsFromLocalStorage();
    } catch (error) {
      set({ error: 'Failed to clear all invoice items' });
    }
  },
}));