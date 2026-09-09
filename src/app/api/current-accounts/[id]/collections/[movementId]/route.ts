import { NextResponse } from "next/server";
import { createServerSupabaseClientWithRequest } from "@/lib/supabaseServer";

type Params = {
  id: string;
  movementId: string;
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

const deletableMovementTypes = ["COLLECTION", "PAYMENT", "ADJUSTMENT"];

export async function DELETE(
  _request: Request,
  context: { params: Promise<Params> }
) {
  const { id, movementId } = await context.params;
  const supabase = await createServerSupabaseClientWithRequest();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Auth session missing" }, { status: 401 });
  }

  const resolvedTenantId = resolveTenantIdForUser(user);
  const tenantCandidates = Array.from(new Set([resolvedTenantId, user.id]));

  const { data: account, error: accountError } = await supabase
    .from("current_accounts")
    .select("id, tenant_id, user_id")
    .eq("id", id)
    .maybeSingle();

  if (accountError) {
    return NextResponse.json({ error: accountError.message }, { status: 500 });
  }

  if (!account) {
    return NextResponse.json({ error: "Cari hesap bulunamadı." }, { status: 404 });
  }

  const canAccessAccount =
    account.user_id === user.id || tenantCandidates.includes(String(account.tenant_id));

  if (!canAccessAccount) {
    return NextResponse.json({ error: "Bu cari hesap için yetkiniz yok." }, { status: 403 });
  }

  const { data: movement, error: movementError } = await supabase
    .from("current_account_movements")
    .select(
      "id, current_account_id, movement_type, amount, signed_amount, invoice_id, tenant_id, user_id, collection_invoice_matches(*)"
    )
    .eq("id", movementId)
    .eq("current_account_id", id)
    .in("movement_type", deletableMovementTypes)
    .in("tenant_id", tenantCandidates)
    .maybeSingle();

  if (movementError) {
    return NextResponse.json({ error: movementError.message }, { status: 500 });
  }

  if (!movement) {
    return NextResponse.json({ error: "Tahsilat bulunamadı." }, { status: 404 });
  }

  const canDeleteMovement =
    movement.user_id === user.id || tenantCandidates.includes(String(movement.tenant_id));

  if (!canDeleteMovement) {
    return NextResponse.json({ error: "Bu tahsilatı silmeye yetkiniz yok." }, { status: 403 });
  }

  const linkedInvoiceIds = Array.from(
    new Set([
      movement.invoice_id,
      ...(Array.isArray(movement.collection_invoice_matches)
        ? movement.collection_invoice_matches.map((match: { invoice_id?: string }) => match.invoice_id)
        : []),
    ].filter(Boolean))
  );

  if (linkedInvoiceIds.length > 0) {
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .select("id, account_id")
      .in("id", linkedInvoiceIds);

    if (invoiceError) {
      return NextResponse.json(
        { error: "Tahsilatın fatura ilişkisi kontrol edilemedi." },
        { status: 500 }
      );
    }

    if ((invoice || []).length !== linkedInvoiceIds.length) {
      return NextResponse.json(
        { error: "Tahsilatın bağlı olduğu fatura bulunamadı veya erişilemiyor." },
        { status: 409 }
      );
    }

    if (invoice?.some((item) => item.account_id && String(item.account_id) !== String(id))) {
      return NextResponse.json(
        { error: "Tahsilatın bağlı olduğu fatura bu cari hesaba ait değil." },
        { status: 409 }
      );
    }
  }

  const { data: deletedMovement, error: deleteError } = await supabase.rpc(
    "delete_current_account_movement",
    { p_movement_id: movementId }
  );

  if (deleteError) {
    console.error("SUPABASE ERROR (DELETE current_account_movements):", deleteError);
    return NextResponse.json(
      { error: deleteError.message || "Tahsilat silinemedi." },
      { status: 500 }
    );
  }

  const { data: updatedAccount, error: updatedAccountError } = await supabase
    .from("current_accounts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (updatedAccountError) {
    return NextResponse.json({ error: updatedAccountError.message }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    movement: deletedMovement,
    account: updatedAccount,
  });
}
