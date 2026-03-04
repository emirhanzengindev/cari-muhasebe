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
  if (direction === 1 || direction === -1) return direction;

  switch (movementType) {
    case "COLLECTION":
      return -1;
    case "PAYMENT":
      return 1;
    default:
      return null;
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

