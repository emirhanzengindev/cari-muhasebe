export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { createServerSupabaseClientWithRequest } from "@/lib/supabaseServer";

type SupabaseClient = Awaited<ReturnType<typeof createServerSupabaseClientWithRequest>>;

const resolveTenantIdForUser = (user: any): string => {
  const appMetaTenantId =
    typeof user?.app_metadata?.tenant_id === "string"
      ? user.app_metadata.tenant_id
      : null;
  const userMetaTenantId =
    typeof user?.user_metadata?.tenant_id === "string"
      ? user.user_metadata.tenant_id
      : null;

  return appMetaTenantId || userMetaTenantId || user.id;
};

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
        readTenantRows(supabase, "current_accounts", "id", tenantCandidates),
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
          "id, current_account_id, signed_amount",
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

    return NextResponse.json({
      totalAccounts: accountsResult.rows.length,
      stockValue,
      monthlySales,
      pendingInvoicesCount: pendingInvoices.length,
      pendingInvoicesTotal: pendingInvoices.reduce(
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
