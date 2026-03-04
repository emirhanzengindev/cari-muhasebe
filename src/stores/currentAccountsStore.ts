import { create } from "zustand";
import { CurrentAccount } from "@/types";
import { useTenantStore } from "@/lib/tenantStore";
import { getSupabaseBrowser } from "@/lib/supabase";

const normalizeAccount = (account: any): CurrentAccount => ({
  ...account,
  isActive: account?.isActive ?? account?.is_active ?? true,
  accountType: account?.accountType ?? account?.account_type ?? "CUSTOMER",
  balance: Number(account?.balance ?? 0),
});

const makeApiRequest = async (
  endpoint: string,
  options: RequestInit = {}
) => {
  const tenantId = useTenantStore.getState().tenantId;
  if (!tenantId) return;

  const supabase = getSupabaseBrowser();
  const { data } = await supabase.auth.getSession();
  const session = data.session;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (session?.access_token) {
    headers.Authorization = `Bearer ${session.access_token}`;
  }

  if (options.body) {
    headers["Content-Type"] = "application/json";
  }

  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  return res.json();
};

interface CurrentAccountState {
  accounts: CurrentAccount[];
  loading: boolean;
  error: string | null;

  fetchAccounts: () => Promise<void>;
  addAccount: (
    data: Omit<CurrentAccount, "id" | "created_at" | "updated_at">
  ) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  toggleAccountStatus: (id: string) => Promise<void>;
  updateAccountBalance: (accountId: string, amount: number) => Promise<void>;
  addCollection: (
    accountId: string,
    payload: {
      amount: number;
      movementType?: "COLLECTION" | "PAYMENT" | "ADJUSTMENT";
      direction?: 1 | -1;
      currency?: "TRY" | "USD";
      description?: string;
      documentNo?: string;
      documentDate?: string;
      invoiceId?: string;
      matches?: Array<{ invoiceId: string; amount: number }>;
    }
  ) => Promise<void>;
}

export const useCurrentAccountsStore = create<CurrentAccountState>((set, get) => ({
  accounts: [],
  loading: false,
  error: null,

  fetchAccounts: async () => {
    set({ loading: true, error: null });
    try {
      const data = await makeApiRequest("/current-accounts");
      const normalized = Array.isArray(data)
        ? data.map((item: any) => normalizeAccount(item))
        : [];
      set({ accounts: normalized, loading: false });
    } catch {
      set({ error: "Hesaplar alinamadi", loading: false });
    }
  },

  addAccount: async (account) => {
    const created = await makeApiRequest("/current-accounts", {
      method: "POST",
      body: JSON.stringify(account),
    });
    if (!created) return;

    set((state) => ({
      accounts: [normalizeAccount(created), ...state.accounts],
    }));
  },

  deleteAccount: async (id) => {
    await makeApiRequest(`/current-accounts/${id}`, {
      method: "DELETE",
    });
    set((state) => ({
      accounts: state.accounts.filter((a) => a.id !== id),
    }));
  },

  toggleAccountStatus: async (id) => {
    const acc = get().accounts.find((a) => a.id === id);
    if (!acc) return;

    const updated = await makeApiRequest(`/current-accounts/${id}`, {
      method: "PUT",
      body: JSON.stringify({ isActive: !acc.isActive }),
    });

    if (!updated) return;

    set((state) => ({
      accounts: state.accounts.map((a) => (a.id === id ? normalizeAccount(updated) : a)),
    }));
  },

  updateAccountBalance: async (accountId, amount) => {
    const updated = await makeApiRequest(`/current-accounts/${accountId}/balance`, {
      method: "PATCH",
      body: JSON.stringify({ amount }),
    });

    if (!updated) return;

    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === accountId ? normalizeAccount(updated) : a
      ),
    }));
  },

  addCollection: async (accountId, payload) => {
    const movementType = payload.movementType ?? "COLLECTION";
    const normalizedDirection =
      movementType === "COLLECTION"
        ? -1
        : movementType === "PAYMENT"
          ? 1
          : payload.direction;

    const result = await makeApiRequest(`/current-accounts/${accountId}/collections`, {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        movementType,
        direction: normalizedDirection,
      }),
    });

    if (!result?.account) return;

    set((state) => ({
      accounts: state.accounts.map((a) =>
        a.id === accountId ? normalizeAccount(result.account) : a
      ),
    }));
  },
}));
