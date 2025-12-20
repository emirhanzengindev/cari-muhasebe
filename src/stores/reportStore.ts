import { create } from 'zustand';
import { Product, CurrentAccount } from '@/types';

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
      // In a real app, this would be an API call
      // const response = await fetch('/api/reports/sales-by-product');
      // const data = await response.json();
      
      // Mock data for now
      const mockData: SalesByProduct[] = [
        // This would be populated with real data in a real implementation
      ];
      
      set({ salesByProduct: mockData, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch sales by product report', loading: false });
    }
  },

  fetchMonthlyProfitLoss: async () => {
    set({ loading: true, error: null });
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/reports/monthly-profit-loss');
      // const data = await response.json();
      
      // Mock data for now
      const mockData: MonthlyProfitLoss[] = [
        { month: "October", year: 2023, profit: 15000, revenue: 50000, expenses: 35000 },
        { month: "September", year: 2023, profit: 12000, revenue: 45000, expenses: 33000 },
        { month: "August", year: 2023, profit: 8000, revenue: 40000, expenses: 32000 },
        { month: "July", year: 2023, profit: 10000, revenue: 38000, expenses: 28000 },
        { month: "June", year: 2023, profit: 7000, revenue: 35000, expenses: 28000 },
        { month: "May", year: 2023, profit: 9000, revenue: 37000, expenses: 28000 },
      ];
      
      set({ monthlyProfitLoss: mockData, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch monthly profit/loss report', loading: false });
    }
  },

  fetchAccountBalances: async () => {
    set({ loading: true, error: null });
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/reports/account-balances');
      // const data = await response.json();
      
      // Mock data for now
      const mockData: AccountBalance[] = [
        // This would be populated with real data in a real implementation
      ];
      
      set({ accountBalances: mockData, loading: false });
    } catch (error) {
      set({ error: 'Failed to fetch account balances report', loading: false });
    }
  },
}));