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

  if (!tenantId) {
    console.warn("Tenant ID not ready, request skipped:", endpoint);
    return undefined;
  }

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

  let body = options.body;
  if (options.method === "POST" && body) {
    body = JSON.stringify({
      ...JSON.parse(body as string),
      tenant_id: tenantId,
      user_id: session?.user?.id,
    });
  }

  const res = await fetch(`/api${endpoint}`, {
    ...options,
    headers,
    body,
    credentials: "include",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || res.statusText);
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
}

export const useCurrentAccountsStore = create<CurrentAccountState>((set, get) => ({
  accounts: [],
  loading: false,
  error: null,

  fetchAccounts: async () => {
    const tenantId = useTenantStore.getState().tenantId;
    if (!tenantId) return;

    set({ loading: true, error: null });

    try {
      const data = await makeApiRequest("/current-accounts");
      set({ accounts: Array.isArray(data) ? data : [], loading: false });
    } catch {
      set({ error: "Hesaplar alınamadı", loading: false });
    }
  },

  addAccount: async (account) => {
    try {
      const created = await makeApiRequest("/current-accounts", {
        method: "POST",
        body: JSON.stringify(account),
      });

      if (!created) return;

      set((state) => ({
        accounts: [created, ...state.accounts],
      }));
    } catch {
      set({ error: "Hesap eklenemedi" });
    }
  },

  deleteAccount: async (id) => {
    await makeApiRequest(`/current-accounts/${id}`, { method: "DELETE" });
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
      accounts: state.accounts.map((a) =>
        a.id === id ? updated : a
      ),
    }));
  },
}));
