import { create } from 'zustand';
import { InvoiceItem } from '@/types';
import { useTenantStore } from '@/lib/tenantStore';
import { createBrowserClient } from '@/lib/supabase';

// Helper function to make API requests
const makeApiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const tenantId = useTenantStore.getState().tenantId;
  
  if (!tenantId) {
    console.warn('WARNING: Tenant ID not available, skipping request for endpoint:', endpoint);
    return null;
  }
  
  // Get Supabase session token
  const supabase = createBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  // Manually set session cookie for server-side authentication
  if (session?.access_token) {
    document.cookie = `sb-access-token=${session.access_token}; path=/; SameSite=Lax; Secure`;
    document.cookie = `sb-refresh-token=${session.refresh_token}; path=/; SameSite=Lax; Secure`;
    console.log('DEBUG: Session cookies manually set');
  }
    
  // Conditionally add Content-Type header only for requests that have a body
  const headers: any = {
    ...options.headers,
  };
  
  // Add Authorization header if session exists
  if (session?.access_token) {
    headers['Authorization'] = `Bearer ${session.access_token}`;
  }
    
  // Add Content-Type for methods that typically have a body
  const method = options.method?.toUpperCase();
  if (method === 'POST' || method === 'PUT' || method === 'PATCH' || (method === undefined && options.body !== undefined)) {
    headers['Content-Type'] = 'application/json';
  }
  
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
  });
  
  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
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
  invoiceItems: [],
  loading: false,
  error: null,
  
  // Invoice item actions
  fetchInvoiceItems: async () => {
    set({ loading: true, error: null });
    try {
      const invoiceItems = await makeApiRequest('/invoice-items');
      if (invoiceItems !== null) {
        set({ invoiceItems, loading: false });
      } else {
        set({ loading: false });
      }
    } catch (error) {
      set({ error: 'Failed to fetch invoice items', loading: false });
    }
  },

  addInvoiceItem: async (invoiceItemData) => {
    try {
      const newInvoiceItem = await makeApiRequest('/invoice-items', {
        method: 'POST',
        body: JSON.stringify(invoiceItemData),
      });
      
      if (newInvoiceItem !== null) {
        set((state) => {
          const updatedInvoiceItems = [...state.invoiceItems, newInvoiceItem];
          return { invoiceItems: updatedInvoiceItems };
        });
        
        return newInvoiceItem;
      }
    } catch (error) {
      set({ error: 'Failed to add invoice item' });
      throw error;
    }
  },

  updateInvoiceItem: async (id, invoiceItemData) => {
    try {
      const updatedInvoiceItem = await makeApiRequest(`/invoice-items/${id}`, {
        method: 'PUT',
        body: JSON.stringify(invoiceItemData),
      });
      
      if (updatedInvoiceItem !== null) {
        set((state) => {
          const updatedInvoiceItems = state.invoiceItems.map((invoiceItem) =>
            invoiceItem.id === id ? updatedInvoiceItem : invoiceItem
          );
          return { invoiceItems: updatedInvoiceItems };
        });
      }
    } catch (error) {
      set({ error: 'Failed to update invoice item' });
    }
  },

  deleteInvoiceItem: async (id) => {
    try {
      const result = await makeApiRequest(`/invoice-items/${id}`, {
        method: 'DELETE',
      });
      
      if (result !== null) {
        set((state) => {
          const updatedInvoiceItems = state.invoiceItems.filter((invoiceItem) => invoiceItem.id !== id);
          return { invoiceItems: updatedInvoiceItems };
        });
      }
    } catch (error) {
      set({ error: 'Failed to delete invoice item' });
    }
  },

  getInvoiceItemsByInvoiceId: (invoiceId) => {
    return get().invoiceItems.filter(item => item.invoiceId === invoiceId);
  },

  clearAllInvoiceItems: async () => {
    try {
      set({ invoiceItems: [] });
    } catch (error) {
      set({ error: 'Failed to clear all invoice items' });
    }
  },
}));
