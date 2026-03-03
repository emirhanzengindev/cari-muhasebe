import { create } from 'zustand';
import { Invoice } from '@/types';
import { useTenantStore } from '@/lib/tenantStore';
import { getSupabaseBrowser } from '../lib/supabase';

// Helper function to make API requests
const makeApiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const tenantId = useTenantStore.getState().tenantId;
  
  if (!tenantId) {
    return null;
  }
  
  // Get Supabase session token
  const supabase = getSupabaseBrowser();
  const { data: { session } } = await supabase.auth.getSession();
    
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
    credentials: 'include',
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    
    // Check if it's an auth session error
    if (response.status === 401 && errorText.includes('Auth session missing')) {
      // Let middleware handle auth redirects
      return;
    }

    let parsedMessage = "";
    try {
      const parsed = JSON.parse(errorText);
      parsedMessage = parsed?.error || parsed?.message || "";
    } catch {
      parsedMessage = "";
    }

    throw new Error(
      parsedMessage || `API request failed: ${response.status} ${response.statusText}`
    );
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

      if (newInvoice === null) {
        throw new Error('Fatura olusturulamadi. Oturum veya yetki problemi olabilir.');
      }

      set((state) => {
        const updatedInvoices = [...state.invoices, newInvoice];
        return { invoices: updatedInvoices };
      });
      
      return newInvoice;
    } catch (error: any) {
      const message = error?.message || 'Failed to add invoice';
      set({ error: message });
      throw new Error(message);
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
