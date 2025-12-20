import { create } from 'zustand';
import { CurrentAccount } from '@/types/index';
import { useTenantData } from '@/lib/tenantFilter';

// Load accounts from localStorage on initial load
const loadAccountsFromLocalStorage = (): CurrentAccount[] => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('currentAccounts');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Convert date strings back to Date objects
        return parsed.map((account: any) => ({
          ...account,
          createdAt: new Date(account.createdAt),
          updatedAt: new Date(account.updatedAt)
        }));
      } catch (e) {
        console.error('Failed to parse accounts from localStorage', e);
        return [];
      }
    }
  }
  return [];
};

// Save accounts to localStorage
const saveAccountsToLocalStorage = (accounts: CurrentAccount[]) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('currentAccounts', JSON.stringify(accounts));
  }
};

interface CurrentAccountsState {
  accounts: CurrentAccount[];
  loading: boolean;
  error: string | null;
  fetchAccounts: () => Promise<void>;
  addAccount: (account: Omit<CurrentAccount, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateAccount: (id: string, account: Partial<CurrentAccount>) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  toggleAccountStatus: (id: string) => Promise<void>;
  updateAccountBalance: (id: string, amount: number, invoiceType: 'SALES' | 'PURCHASE') => Promise<void>;
}

export const useCurrentAccountsStore = create<CurrentAccountsState>((set, get) => ({
  accounts: loadAccountsFromLocalStorage(),
  loading: false,
  error: null,

  fetchAccounts: async () => {
    set({ loading: true, error: null });
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/current-accounts');
      // const accounts = await response.json();
      
      // Mock data for now - sıfırlandı
      const existingAccounts = get().accounts;
      const mockAccounts: CurrentAccount[] = [
        {
          id: '1',
          name: 'Nilüfer Baza',
          email: 'info@niluferbaza.com',
          phone: '+90 212 123 4567',
          address: 'Levent Mahallesi, Şehit Sk. No: 123, Beşiktaş, İstanbul',
          taxOffice: 'Beşiktaş',
          taxNumber: '1234567890',
          isActive: true,
          accountType: 'CUSTOMER',
          balance: 0.0,
          tenantId: 'tenant-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '2',
          name: 'İbrahim Suriye',
          email: 'info@ibrahimsuriye.com',
          phone: '+90 216 987 6543',
          address: 'Maslak Mahallesi, Büyükdere Cd. No: 456',
          taxOffice: 'Maslak',
          taxNumber: '0987654321',
          isActive: true,
          accountType: 'CUSTOMER',
          balance: 0.0,
          tenantId: 'tenant-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '3',
          name: 'Bazacı Ali',
          email: 'hello@bazaciali.com',
          phone: '+90 532 111 2233',
          address: 'Nişantaşı Mahallesi, Abdi İpekçi Cd. No: 789',
          taxOffice: 'Nişantaşı',
          taxNumber: '1122334455',
          isActive: true,
          accountType: 'CUSTOMER',
          balance: 0.0,
          tenantId: 'tenant-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '4',
          name: 'Gürsu Koltuk',
          email: 'contact@gursukoltuk.com',
          phone: '+90 535 555 6677',
          address: 'Etiler Mahallesi, Cumhuriyet Cd. No: 321',
          taxOffice: 'Etiler',
          taxNumber: '5566778899',
          isActive: true,
          accountType: 'CUSTOMER',
          balance: 0.0,
          tenantId: 'tenant-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '5',
          name: 'Mmaz Karapınar',
          email: 'info@mmazkarapinar.com',
          phone: '+90 544 444 3322',
          address: 'Kadıköy Mahallesi, Bağdat Cd. No: 999',
          taxOffice: 'Kadıköy',
          taxNumber: '9988776655',
          isActive: true,
          accountType: 'CUSTOMER',
          balance: 0.0,
          tenantId: 'tenant-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '6',
          name: 'Şerif Hannen',
          email: 'contact@serifhannen.com',
          phone: '+90 533 222 1144',
          address: 'Beşiktaş Mahallesi, Çırağan Cd. No: 777',
          taxOffice: 'Beşiktaş',
          taxNumber: '7766554433',
          isActive: true,
          accountType: 'CUSTOMER',
          balance: 0.0,
          tenantId: 'tenant-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '7',
          name: 'Koltukcu Tuncay',
          email: 'hello@koltukcutuncay.com',
          phone: '+90 531 999 8877',
          address: 'Moda Mahallesi, Moda Cd. No: 555',
          taxOffice: 'Kadıköy',
          taxNumber: '3344556677',
          isActive: true,
          accountType: 'CUSTOMER',
          balance: 0.0,
          tenantId: 'tenant-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '8',
          name: 'Bazacı Şevki',
          email: 'info@bazacisevki.com',
          phone: '+90 530 111 2233',
          address: 'Maltepe Mahallesi, E-5 Cd. No: 222',
          taxOffice: 'Maltepe',
          taxNumber: '2233445566',
          isActive: true,
          accountType: 'CUSTOMER',
          balance: 0.0,
          tenantId: 'tenant-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '9',
          name: 'Cihan Seccade',
          email: 'contact@cihanseccade.com',
          phone: '+90 536 444 5566',
          address: 'Beşiktaş Mahallesi, Levazım Cd. No: 333',
          taxOffice: 'Beşiktaş',
          taxNumber: '3344556677',
          isActive: true,
          accountType: 'CUSTOMER',
          balance: 0.0,
          tenantId: 'tenant-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '10',
          name: 'Ottoman İpek Emin',
          email: 'info@ottomanipekemin.com',
          phone: '+90 537 777 8899',
          address: 'Nişantaşı Mahallesi, Teşvikiye Cd. No: 444',
          taxOffice: 'Nişantaşı',
          taxNumber: '4455667788',
          isActive: true,
          accountType: 'CUSTOMER',
          balance: 0.0,
          tenantId: 'tenant-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '11',
          name: 'Eymen Çarşamba',
          email: 'hello@eymencarsamba.com',
          phone: '+90 538 999 0011',
          address: 'Kadıköy Mahallesi, Hasanpaşa Cd. No: 555',
          taxOffice: 'Kadıköy',
          taxNumber: '5566778899',
          isActive: true,
          accountType: 'CUSTOMER',
          balance: 0.0,
          tenantId: 'tenant-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: '12',
          name: 'Sigresi',
          email: 'info@sigresi.com',
          phone: '+90 530 123 4567',
          address: 'Maltepe Mahallesi, E-5 Cd. No: 111',
          taxOffice: 'Maltepe',
          taxNumber: '1122334455',
          isActive: true,
          accountType: 'SUPPLIER',
          balance: 0.0,
          tenantId: 'tenant-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];
      
      // Merge existing accounts with mock data to avoid duplicates
      const mergedAccounts = [...existingAccounts];
      mockAccounts.forEach(mockAccount => {
        if (!mergedAccounts.some(acc => acc.id === mockAccount.id)) {
          mergedAccounts.push(mockAccount);
        }
      });
      
      set({ accounts: mergedAccounts, loading: false });
      saveAccountsToLocalStorage(mergedAccounts);
    } catch (error) {
      set({ error: 'Failed to fetch accounts', loading: false });
    }
  },

  addAccount: async (accountData) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch('/api/current-accounts', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(accountData),
      // });
      // const newAccount = await response.json();
      
      // Mock implementation
      const newAccount: CurrentAccount = {
        ...accountData,
        id: Math.random().toString(36).substr(2, 9),
        balance: 0,
        tenantId: 'tenant-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      
      set((state) => {
        const updatedAccounts = [...state.accounts, newAccount];
        saveAccountsToLocalStorage(updatedAccounts);
        return { accounts: updatedAccounts };
      });
    } catch (error) {
      set({ error: 'Failed to add account' });
    }
  },

  updateAccount: async (id, accountData) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch(`/api/current-accounts/${id}`, {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(accountData),
      // });
      // const updatedAccount = await response.json();
      
      // Mock implementation
      set((state) => {
        const updatedAccounts = state.accounts.map((account) =>
          account.id === id ? { ...account, ...accountData, updatedAt: new Date() } : account
        );
        saveAccountsToLocalStorage(updatedAccounts);
        return { accounts: updatedAccounts };
      });
    } catch (error) {
      set({ error: 'Failed to update account' });
    }
  },

  deleteAccount: async (id) => {
    try {
      // In a real app, this would be an API call
      // await fetch(`/api/current-accounts/${id}`, { method: 'DELETE' });
      
      // Mock implementation
      set((state) => {
        const updatedAccounts = state.accounts.filter((account) => account.id !== id);
        saveAccountsToLocalStorage(updatedAccounts);
        return { accounts: updatedAccounts };
      });
    } catch (error) {
      set({ error: 'Failed to delete account' });
    }
  },

  toggleAccountStatus: async (id) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch(`/api/current-accounts/${id}/toggle-status`, { method: 'POST' });
      // const updatedAccount = await response.json();
      
      // Mock implementation
      set((state) => {
        const updatedAccounts = state.accounts.map((account) =>
          account.id === id ? { ...account, isActive: !account.isActive, updatedAt: new Date() } : account
        );
        saveAccountsToLocalStorage(updatedAccounts);
        return { accounts: updatedAccounts };
      });
    } catch (error) {
      set({ error: 'Failed to toggle account status' });
    }
  },

  updateAccountBalance: async (id, amount, invoiceType) => {
    try {
      // In a real app, this would be an API call
      // const response = await fetch(`/api/current-accounts/${id}/update-balance`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ amount, invoiceType }),
      // });
      // const updatedAccount = await response.json();
      
      // Mock implementation
      set((state) => {
        const updatedAccounts = state.accounts.map((account) =>
          account.id === id 
            ? { 
                ...account, 
                balance: invoiceType === 'SALES' 
                  ? account.balance + amount 
                  : account.balance - amount,
                updatedAt: new Date() 
              } 
            : account
        );
        saveAccountsToLocalStorage(updatedAccounts);
        return { accounts: updatedAccounts };
      });
    } catch (error) {
      set({ error: 'Failed to update account balance' });
    }
  },
}));