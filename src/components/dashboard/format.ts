// Panel bileşenlerinin ortak biçimlendirme yardımcıları.

export type MonthPoint = {
  month: string; // "2026-11"
  sales: number;
  receivable: number;
  debt: number;
};

export type RecentInvoice = {
  id: string;
  number: string;
  date: string | null;
  type: string; // SALES | PURCHASE
  total: number;
  accountName: string;
  isDraft: boolean;
  overdue: boolean;
};

export type PanelSummary = {
  totalAccounts: number;
  stockValue: number;
  monthlySales: number;
  pendingInvoicesCount: number;
  pendingInvoicesTotal: number;
  overdueInvoicesCount: number;
  overdueInvoicesTotal: number;
  totalReceivable: number;
  totalDebt: number;
  netBalance: number;
  series?: MonthPoint[];
  recentInvoices?: RecentInvoice[];
  warnings?: string[];
};

const tlFormatter = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const tl = (value: number) => {
  const safe = Number.isFinite(value) ? value : 0;
  return `${safe < 0 ? "−" : ""}₺${tlFormatter.format(Math.abs(safe))}`;
};

export const tlShort = (value: number) =>
  value >= 1000
    ? `₺${(value / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} bin`
    : `₺${Math.round(value)}`;

export const MONTHS = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];

export const monthLabel = (key: string) => MONTHS[Number(key.split("-")[1]) - 1] ?? key;

export const initials = (name: string) =>
  (name || "?")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0] ?? "")
    .join("")
    .toLocaleUpperCase("tr-TR") || "?";

const PALETTE = ["#16a34a", "#2563eb", "#7c3aed", "#d97706", "#db2777", "#0891b2", "#52525b"];

export const colorOf = (name: string) =>
  PALETTE[[...(name || "")].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % PALETTE.length];
