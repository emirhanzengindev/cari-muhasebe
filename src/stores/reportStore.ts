import { create } from 'zustand';
import { Product, CurrentAccount } from '@/types';
import { useTenantStore } from '@/lib/tenantStore';

interface SalesByProduct {
  product: Product;
  totalSales: number;
  quantitySold: number;
}

interface MonthlyProfitLoss {
  month: string;
  year: number;
  profit: number;
  revenue: number;
  expenses: number;
}

interface AccountBalance {
  account: CurrentAccount;
  balance: number;
}

interface ReportState {
  loading: boolean;
  error: string | null;
  
  // Report data
  salesByProduct: SalesByProduct[];
  monthlyProfitLoss: MonthlyProfitLoss[];
  accountBalances: AccountBalance[];
  
  // Report actions
  fetchSalesByProduct: () => Promise<void>;
  fetchMonthlyProfitLoss: () => Promise<void>;
  fetchAccountBalances: () => Promise<void>;
}

export const useReportStore = create<ReportState>((set, get) => ({
  loading: false,
  error: null,
  salesByProduct: [],
  monthlyProfitLoss: [],
  accountBalances: [],

  fetchSalesByProduct: async () => {
    set({ loading: true, error: null });
    try {
      const tenantId = useTenantStore.getState().tenantId;
      if (!tenantId) {
        console.warn('WARNING: Tenant ID not available, skipping request for report');
        set({ loading: false });
        return;
      }
      
      const response = await fetch('/api/reports/sales-by-product', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch sales by product report');
      }
      
      const data = await response.json();
      
      set({ salesByProduct: data, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch sales by product report', loading: false });
    }
  },

  fetchMonthlyProfitLoss: async () => {
    set({ loading: true, error: null });
    try {
      const tenantId = useTenantStore.getState().tenantId;
      if (!tenantId) {
        console.warn('WARNING: Tenant ID not available, skipping request for report');
        set({ loading: false });
        return;
      }
      
      const response = await fetch('/api/reports/monthly-profit-loss', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch monthly profit/loss report');
      }
      
      const data = await response.json();
      
      set({ monthlyProfitLoss: data, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch monthly profit/loss report', loading: false });
    }
  },

  fetchAccountBalances: async () => {
    set({ loading: true, error: null });
    try {
      const tenantId = useTenantStore.getState().tenantId;
      if (!tenantId) {
        console.warn('WARNING: Tenant ID not available, skipping request for report');
        set({ loading: false });
        return;
      }
      
      const response = await fetch('/api/reports/account-balances', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch account balances report');
      }
      
      const data = await response.json();
      
      set({ accountBalances: data, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch account balances report', loading: false });
    }
  },
}));
