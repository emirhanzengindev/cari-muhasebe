import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClientWithRequest } from "@/lib/supabaseServer";

type Params = {
  id: string;
};

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

const normalizeMatchPayload = (matches: unknown) => {
  if (!Array.isArray(matches)) return [];

  return matches
    .map((item) => {
      const row = item as { invoiceId?: string; invoice_id?: string; amount?: number };
      const invoiceId = row.invoiceId || row.invoice_id || "";
      const amount = Number(row.amount ?? 0);
      if (!invoiceId || !Number.isFinite(amount) || amount <= 0) return null;
      return {
        invoice_id: invoiceId,
        amount,
      };
    })
    .filter(Boolean);
};

const resolveDirection = (movementType: string, direction?: number) => {
  // Never trust client-provided direction for fixed movement types.
  if (movementType === "COLLECTION") return -1;
  if (movementType === "PAYMENT") return -1;
  if (movementType === "ADJUSTMENT" && (direction === 1 || direction === -1)) {
    return direction;
  }
  return null;
};

const normalizePaymentMethod = (value: unknown) => {
  const method = String(value || "").toUpperCase();
  if (["CASH", "BANK", "OTHER"].includes(method)) return method as "CASH" | "BANK" | "OTHER";
  return null;
};

const updateFinanceAccountBalance = async (
  supabase: any,
  payload: {
    table: "safes" | "banks";
    id: string;
    tenantCandidates: string[];
    amountDelta: number;
  }
) => {
  const { data: account, error: accountError } = await supabase
    .from(payload.table)
    .select("id, balance, tenant_id")
    .eq("id", payload.id)
    .in("tenant_id", payload.tenantCandidates)
    .maybeSingle();

  if (accountError) {
    throw new Error(accountError.message);
  }

  if (!account) {
    throw new Error(payload.table === "safes" ? "Kasa hesabı bulunamadı." : "Banka hesabı bulunamadı.");
  }

  const nextBalance = Math.round((Number(account.balance || 0) + payload.amountDelta) * 100) / 100;
  const { error: updateError } = await supabase
    .from(payload.table)
    .update({
      balance: nextBalance,
      updated_at: new Date().toISOString(),
    })
    .eq("id", payload.id)
    .in("tenant_id", payload.tenantCandidates);

  if (updateError) {
    throw new Error(updateError.message);
  }
};

export async function GET(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const { id } = await context.params;
  const supabase = await createServerSupabaseClientWithRequest();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Auth session missing" }, { status: 401 });
  }

  const resolvedTenantId = resolveTenantIdForUser(user);
  const tenantCandidates = Array.from(new Set([resolvedTenantId, user.id]));

  const { data, error } = await supabase
    .from("current_account_movements")
    .select("*, collection_invoice_matches(*)")
    .eq("current_account_id", id)
    .in("movement_type", ["COLLECTION", "PAYMENT", "ADJUSTMENT"])
    .in("tenant_id", tenantCandidates)
    .order("document_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const { id } = await context.params;
  const body = await request.json();
  const supabase = await createServerSupabaseClientWithRequest();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Auth session missing" }, { status: 401 });
  }

  const movementType = String(body.movementType ?? "COLLECTION").toUpperCase();
  if (!["COLLECTION", "PAYMENT", "ADJUSTMENT"].includes(movementType)) {
    return NextResponse.json(
      { error: "movementType must be COLLECTION, PAYMENT, or ADJUSTMENT" },
      { status: 400 }
    );
  }

  const amount = Number(body.amount ?? 0);
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: "amount must be greater than 0" }, { status: 400 });
  }

  const direction = resolveDirection(movementType, body.direction);
  if (direction === null) {
    return NextResponse.json(
      { error: "direction is required for ADJUSTMENT and must be 1 or -1" },
      { status: 400 }
    );
  }

  const resolvedTenantId = resolveTenantIdForUser(user);
  const tenantCandidates = Array.from(new Set([resolvedTenantId, user.id]));
  const paymentMethod = normalizePaymentMethod(body.paymentMethod || body.payment_method);
  const safeId = body.safeId || body.safe_id || null;
  const bankId = body.bankId || body.bank_id || null;

  if (paymentMethod === "CASH" && !safeId) {
    return NextResponse.json(
      { error: "Nakit işlem için kasa hesabı seçilmelidir." },
      { status: 400 }
    );
  }

  if (paymentMethod === "BANK" && !bankId) {
    return NextResponse.json(
      { error: "Banka işlem için banka hesabı seçilmelidir." },
      { status: 400 }
    );
  }

  const matches = normalizeMatchPayload(body.matches);
  const { data, error } = await supabase.rpc("record_current_account_movement", {
    p_current_account_id: id,
    p_movement_type: movementType,
    p_amount: amount,
    p_direction: direction,
    p_currency: body.currency || "TRY",
    p_document_no: body.documentNo || body.document_no || null,
    p_document_date: body.documentDate || body.document_date || null,
    p_description: body.description || null,
    p_invoice_id: body.invoiceId || body.invoice_id || null,
    p_matches: matches,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const shouldRecordFinanceTransaction = Boolean(paymentMethod);

  if (shouldRecordFinanceTransaction) {
    const transactionPayload: any = {
      transaction_type: movementType === "PAYMENT" ? "PAYMENT" : "COLLECTION",
      amount,
      account_id: id,
      description: body.description || (movementType === "PAYMENT" ? "Ödeme" : "Tahsilat"),
      date: body.documentDate || body.document_date || new Date().toISOString().split("T")[0],
    };

    if (paymentMethod === "CASH") {
      transactionPayload.safe_id = safeId;
    }
    if (paymentMethod === "BANK") {
      transactionPayload.bank_id = bankId;
    }

    const { error: transactionError } = await supabase
      .from("transactions")
      .insert(transactionPayload);

    if (transactionError) {
      console.error("SUPABASE ERROR (POST collection finance transaction):", transactionError);
      return NextResponse.json(
        {
          error: "Cari hareket oluÅŸtu ancak finans iÅŸlemi kaydedilemedi.",
          details: transactionError.message,
          code: transactionError.code,
        },
        { status: transactionError.code === "42501" ? 403 : 500 }
      );
    }

    const amountDelta = movementType === "PAYMENT" ? -amount : amount;

    try {
      if (paymentMethod === "CASH") {
        await updateFinanceAccountBalance(supabase, {
          table: "safes",
          id: safeId,
          tenantCandidates,
          amountDelta,
        });
      }

      if (paymentMethod === "BANK") {
        await updateFinanceAccountBalance(supabase, {
          table: "banks",
          id: bankId,
          tenantCandidates,
          amountDelta,
        });
      }
    } catch (financeError: any) {
      console.error("SUPABASE ERROR (collection finance balance update):", financeError);
      return NextResponse.json(
        { error: financeError?.message || "Finans hesabı güncellenemedi." },
        { status: 500 }
      );
    }
  }

  const { data: updatedAccount, error: accountError } = await supabase
    .from("current_accounts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (accountError) {
    return NextResponse.json({ error: accountError.message }, { status: 500 });
  }

  return NextResponse.json({
    movement: data,
    account: updatedAccount,
  });
}
