export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createServerSupabaseClientWithRequest } from "@/lib/supabaseServer";
import { resolveTenantId } from '@/lib/tenant';

type SupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClientWithRequest>>;

// Tenant comes only from app_metadata (see src/lib/tenant.ts).
const resolveTenantIdForUser = (user: any): string => resolveTenantId(user) ?? user.id;

const isMissingTableError = (error: any) =>
  error?.code === "42P01" ||
  String(error?.message || "").toLowerCase().includes("does not exist");

const readTenantRows = async (
  supabase: SupabaseClient,
  table: string,
  columns: string,
  tenantCandidates: string[]
) => {
  try {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .in("tenant_id", tenantCandidates);

    if (error) {
      if (isMissingTableError(error)) {
        return { rows: [], warning: `${table} tablosu henuz hazir degil.` };
      }

      console.error(`Dashboard ${table} query error:`, error);
      return {
        rows: [],
        warning: `${table} verisi okunamadi. Supabase RLS veya sema ayarini kontrol edin.`,
      };
    }

    return { rows: data || [], warning: null };
  } catch (error) {
    console.error(`Dashboard ${table} request error:`, error);
    return {
      rows: [],
      warning: `${table} verisi okunamadi. Supabase baglantisini kontrol edin.`,
    };
  }
};

const toNumber = (...values: unknown[]) => {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const isCurrentMonth = (value: unknown, start: Date, end: Date) => {
  if (!value) return false;
  const date = new Date(String(value));
  return Number.isFinite(date.getTime()) && date >= start && date < end;
};

export async function GET() {
  try {
    const supabase = await createServerSupabaseClientWithRequest();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Auth session missing" }, { status: 401 });
    }

    const resolvedTenantId = resolveTenantIdForUser(user);
    const tenantCandidates = Array.from(new Set([resolvedTenantId, user.id]));
    const warnings: string[] = [];

    const [accountsResult, productsResult, invoicesResult, movementsResult] =
      await Promise.all([
        readTenantRows(supabase, "current_accounts", "id, name", tenantCandidates),
        readTenantRows(
          supabase,
          "products",
          "*",
          tenantCandidates
        ),
        readTenantRows(
          supabase,
          "invoices",
          "*",
          tenantCandidates
        ),
        readTenantRows(
          supabase,
          "current_account_movements",
          "id, current_account_id, signed_amount, document_date",
          tenantCandidates
        ),
      ]);

    for (const result of [
      accountsResult,
      productsResult,
      invoicesResult,
      movementsResult,
    ]) {
      if (result.warning) warnings.push(result.warning);
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const accountBalances = new Map<string, number>();
    for (const movement of movementsResult.rows as any[]) {
      const accountId = String(movement.current_account_id || "");
      if (!accountId) continue;
      accountBalances.set(
        accountId,
        (accountBalances.get(accountId) || 0) + toNumber(movement.signed_amount)
      );
    }

    const movementBalances = Array.from(accountBalances.values()).map((value) =>
      Math.round(value * 100) / 100
    );
    const totalReceivable = movementBalances.reduce(
      (sum, balance) => sum + (balance > 0 ? balance : 0),
      0
    );
    const totalDebt = movementBalances.reduce(
      (sum, balance) => sum + (balance < 0 ? Math.abs(balance) : 0),
      0
    );

    const stockValue = (productsResult.rows as any[]).reduce((sum, product) => {
      const quantity = toNumber(product.stock_quantity);
      const unitCost = toNumber(product.buy_price, product.price, product.sell_price);
      return sum + quantity * unitCost;
    }, 0);

    const invoices = invoicesResult.rows as any[];
    const monthlySales = invoices.reduce((sum, invoice) => {
      const type = String(invoice.invoice_type || invoice.type || "").toUpperCase();
      const invoiceDate = invoice.date || invoice.invoice_date;
      if (type !== "SALES" || !isCurrentMonth(invoiceDate, monthStart, nextMonthStart)) {
        return sum;
      }
      return sum + toNumber(invoice.total_amount, invoice.total, invoice.amount);
    }, 0);

    const pendingInvoices = invoices.filter((invoice) => {
      const status = String(invoice.status || "").toUpperCase();
      return !invoice.is_draft && !["PAID", "CANCELLED", "CANCELED"].includes(status);
    });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const overdueInvoices = pendingInvoices.filter((invoice) => {
      if (!invoice.due_date && !invoice.dueDate) return false;
      const dueDate = new Date(String(invoice.due_date || invoice.dueDate));
      return Number.isFinite(dueDate.getTime()) && dueDate < today;
    });

    // --- Son 12 ay: aylık satış ve ay sonu alacak/borç serileri (kartlardaki çizgiler) ---
    const boundaries = Array.from(
      { length: 13 },
      (_, i) => new Date(now.getFullYear(), now.getMonth() - 11 + i, 1)
    );
    const monthKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

    const salesByMonth = new Array(12).fill(0);
    for (const invoice of invoices) {
      const type = String(invoice.invoice_type || invoice.type || "").toUpperCase();
      if (type !== "SALES") continue;
      const date = new Date(String(invoice.date || invoice.invoice_date || ""));
      if (!Number.isFinite(date.getTime())) continue;
      for (let i = 0; i < 12; i++) {
        if (date >= boundaries[i] && date < boundaries[i + 1]) {
          salesByMonth[i] += toNumber(invoice.total_amount, invoice.total, invoice.amount);
          break;
        }
      }
    }

    const movementRows = (movementsResult.rows as any[]).map((movement) => ({
      accountId: String(movement.current_account_id || ""),
      amount: toNumber(movement.signed_amount),
      time: new Date(String(movement.document_date || "")).getTime(),
    }));
    const balanceTotalsUntil = (limit: number | null) => {
      const balances = new Map<string, number>();
      for (const row of movementRows) {
        if (!row.accountId) continue;
        if (limit !== null && !(Number.isFinite(row.time) && row.time < limit)) continue;
        balances.set(row.accountId, (balances.get(row.accountId) || 0) + row.amount);
      }
      let receivable = 0;
      let debt = 0;
      for (const value of balances.values()) {
        const rounded = Math.round(value * 100) / 100;
        if (rounded > 0) receivable += rounded;
        else debt += Math.abs(rounded);
      }
      return { receivable, debt };
    };

    const series = boundaries.slice(0, 12).map((start, i) => {
      // Son nokta bugünkü toplamla birebir aynı olsun diye tüm hareketleri alır.
      const totals = balanceTotalsUntil(i === 11 ? null : boundaries[i + 1].getTime());
      return {
        month: monthKey(start),
        sales: Math.round(salesByMonth[i] * 100) / 100,
        receivable: Math.round(totals.receivable * 100) / 100,
        debt: Math.round(totals.debt * 100) / 100,
      };
    });

    // --- Son faturalar ---
    const accountNames = new Map<string, string>(
      (accountsResult.rows as any[]).map((account) => [String(account.id), String(account.name || "")])
    );
    const overdueIds = new Set(overdueInvoices.map((invoice) => String(invoice.id)));
    const invoiceTime = (invoice: any) => {
      const time = new Date(String(invoice.date || invoice.invoice_date || invoice.created_at || "")).getTime();
      return Number.isFinite(time) ? time : 0;
    };
    const recentInvoices = [...invoices]
      .sort((a, b) => invoiceTime(b) - invoiceTime(a))
      .slice(0, 5)
      .map((invoice) => {
        const accountId = String(invoice.account_id || invoice.current_account_id || "");
        return {
          id: String(invoice.id),
          number: String(invoice.invoice_number ?? invoice.invoice_no ?? invoice.number ?? ""),
          date: invoice.date || invoice.invoice_date || invoice.created_at || null,
          type: String(invoice.invoice_type || invoice.type || "SALES").toUpperCase(),
          total: toNumber(invoice.total_amount, invoice.total, invoice.amount),
          accountName: accountNames.get(accountId) || "",
          isDraft: Boolean(invoice.is_draft),
          overdue: overdueIds.has(String(invoice.id)),
        };
      });

    return NextResponse.json({
      series,
      recentInvoices,
      totalAccounts: accountsResult.rows.length,
      stockValue,
      monthlySales,
      pendingInvoicesCount: pendingInvoices.length,
      pendingInvoicesTotal: pendingInvoices.reduce(
        (sum, invoice) => sum + toNumber(invoice.total_amount, invoice.total, invoice.amount),
        0
      ),
      overdueInvoicesCount: overdueInvoices.length,
      overdueInvoicesTotal: overdueInvoices.reduce(
        (sum, invoice) => sum + toNumber(invoice.total_amount, invoice.total, invoice.amount),
        0
      ),
      totalReceivable,
      totalDebt,
      netBalance: totalReceivable - totalDebt,
      sources: {
        totalAccounts: "current_accounts.id",
        stockValue: "products.stock_quantity * products.buy_price",
        monthlySales: "invoices.total_amount for SALES invoices in current month",
        pendingInvoices: "invoices.status / invoices.is_draft",
        receivableDebt: "current_account_movements.signed_amount grouped by current_account_id",
      },
      warnings,
    });
  } catch (error: any) {
    console.error("GET /api/dashboard/summary error:", error);
    return NextResponse.json(
      { error: "Dashboard ozeti alinamadi." },
      { status: 500 }
    );
  }
}
