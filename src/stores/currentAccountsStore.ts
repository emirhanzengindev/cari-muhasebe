import { create } from "zustand";
import { CurrentAccount } from "@/types";
import { useTenantStore } from "@/lib/tenantStore";
import { getSupabaseBrowser } from "@/lib/supabase";

/* =========================
   API HELPER
========================= */
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

/* =========================
   STORE
========================= */
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

  // ✅ EKSİK OLAN BUYDU
  updateAccountBalance: (
    accountId: string,
    amount: number
  ) => Promise<void>;
}

export const useCurrentAccountsStore =
  create<CurrentAccountState>((set, get) => ({
    accounts: [],
    loading: false,
    error: null,

    fetchAccounts: async () => {
      set({ loading: true });
      try {
        const data = await makeApiRequest("/current-accounts");
        set({ accounts: data ?? [], loading: false });
      } catch {
        set({ error: "Hesaplar alınamadı", loading: false });
      }
    },

    addAccount: async (account) => {
      const created = await makeApiRequest("/current-accounts", {
        method: "POST",
        body: JSON.stringify(account),
      });
      if (!created) return;

      set((state) => ({
        accounts: [created, ...state.accounts],
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

      const updated = await makeApiRequest(
        `/current-accounts/${id}`,
        {
          method: "PUT",
          body: JSON.stringify({ isActive: !acc.isActive }),
        }
      );

      set((state) => ({
        accounts: state.accounts.map((a) =>
          a.id === id ? updated : a
        ),
      }));
    },

    /* =========================
       ✅ BAKİYE GÜNCELLEME
    ========================= */
    updateAccountBalance: async (accountId, amount) => {
      const updated = await makeApiRequest(
        `/current-accounts/${accountId}/balance`,
        {
          method: "PATCH",
          body: JSON.stringify({ amount }),
        }
      );

      if (!updated) return;

      set((state) => ({
        accounts: state.accounts.map((a) =>
          a.id === accountId ? updated : a
        ),
      }));
    },
  }));
