import { create } from 'zustand';
import { Invoice } from '@/types';
import { useTenantStore } from '@/lib/tenantStore';
import { createBrowserClient } from '@/lib/supabase';

// Helper function to make API requests
const makeApiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const tenantId = useTenantStore.getState().tenantId;
    console.log('DEBUG: Raw tenantId from store in invoiceStore:', tenantId);
  
  console.log('DEBUG: makeApiRequest called for endpoint:', endpoint);
  console.log('DEBUG: Retrieved tenantId:', tenantId);
  
  if (!tenantId) {
    console.warn('WARNING: Tenant ID not available, skipping request for endpoint:', endpoint);
    return null;
  }
  
  // Get Supabase session token
  const supabase = createBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  // Manually set session cookie for server-side authentication
  if (session?.access_token) {
    document.cookie = `sb-access-token=` + session.access_token + `; path=/; SameSite=Lax; Secure`;
    document.cookie = `sb-refresh-token=` + session.refresh_token + `; path=/; SameSite=Lax; Secure`;
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
    
  console.log('DEBUG: Headers being sent:', headers);
  
  // Add Content-Type for methods that typically have a body
  const method = options.method?.toUpperCase();
  if (method === 'POST' || method === 'PUT' || method === 'PATCH' || (method === undefined && options.body !== undefined)) {
    headers['Content-Type'] = 'application/json';
  }
  
  const response = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });
  
  console.log('DEBUG: API response status:', response.status);
  
  if (!response.ok) {
    console.error('ERROR: API request failed with status:', response.status);
    const errorText = await response.text();
    console.error('ERROR: API response text:', errorText);
    
    // Check if it's an auth session error
    if (response.status === 401 && errorText.includes('Auth session missing')) {
      console.error('AUTH SESSION ERROR: Session expired or missing. Letting middleware handle auth...');
      // Let middleware handle auth redirects
      return;
    }
    
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
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

  invoices: [],
  loading: false,
  error: null,

  // Invoice actions
  fetchInvoices: async () => {
    set({ loading: true, error: null });
    try {
      const invoices = await makeApiRequest('/invoices');
      if (invoices !== null) {
        set({ invoices, loading: false });
      } else {
        // API call failed, keep invoices as empty array
        set({ invoices: [], loading: false });
      }
    } catch (error) {
      set({ error: 'Failed to fetch invoices', loading: false, invoices: [] });
    }
  },

  addInvoice: async (invoiceData) => {
    try {
      const newInvoice = await makeApiRequest('/invoices', {
        method: 'POST',
        body: JSON.stringify(invoiceData),
      });
      
      if (newInvoice !== null) {
        set((state) => {
          const updatedInvoices = [...state.invoices, newInvoice];
          return { invoices: updatedInvoices };
        });
        
        return newInvoice;
      }
    } catch (error) {
      set({ error: 'Failed to add invoice' });
      throw error;
    }
  },

  updateInvoice: async (id, invoiceData) => {
    try {
      const updatedInvoice = await makeApiRequest(`/invoices/${id}`, {
        method: 'PUT',
        body: JSON.stringify(invoiceData),
      });
      
      if (updatedInvoice !== null) {
        set((state) => {
          const updatedInvoices = state.invoices.map((invoice) =>
            invoice.id === id ? updatedInvoice : invoice
          );
          return { invoices: updatedInvoices };
        });
      }
    } catch (error) {
      set({ error: 'Failed to update invoice' });
    }
  },

  deleteInvoice: async (id) => {
    try {
      const result = await makeApiRequest(`/invoices/${id}`, {
        method: 'DELETE',
      });
      
      if (result !== null) {
        set((state) => {
          const updatedInvoices = state.invoices.filter((invoice) => invoice.id !== id);
          return { invoices: updatedInvoices };
        });
      }
    } catch (error) {
      set({ error: 'Failed to delete invoice' });
    }
  },

  getInvoiceById: (id) => {
    const invoices = get().invoices;
    return invoices.find(invoice => invoice.id === id);
  },

  clearAllInvoices: async () => {
    try {
      set({ invoices: [] });
    } catch (error) {
      set({ error: 'Failed to clear invoices' });
    }
  },
}));
