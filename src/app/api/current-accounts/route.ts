import { NextResponse } from "next/server";
import {
  createServerSupabaseClient,
  getTenantIdFromJWT,
} from "@/lib/supabaseServer";

// GET /api/current-accounts
export async function GET() {
  const supabase = await createServerSupabaseClient();

  const { data, error } = await supabase
    .from("current_accounts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

// POST /api/current-accounts
export async function POST(req: Request) {
  const supabase = await createServerSupabaseClient();
  const body = await req.json();

  // 🔴 KRİTİK SATIR
  const tenantId = await getTenantIdFromJWT();

  if (!tenantId) {
    return NextResponse.json(
      { error: "Tenant bulunamadı (unauthorized)" },
      { status: 401 }
    );
  }

  const { data, error } = await supabase
    .from("current_accounts")
    .insert({
      tenant_id: tenantId, // ✅ RLS BUNU BEKLİYOR
      name: body.name,
      phone: body.phone,
      address: body.address,
      tax_number: body.taxNumber ?? body.tax_number,
      tax_office: body.taxOffice ?? body.tax_office,
      company: body.company,
      balance: body.balance ?? 0,
      is_active: body.isActive ?? true,
      account_type: body.accountType ?? body.account_type,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
// PUT /api/current-accounts/:id