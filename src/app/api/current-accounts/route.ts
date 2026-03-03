import { NextResponse } from "next/server";
import { createServerSupabaseClientForRLS } from "@/lib/supabaseServer";

// GET /api/current-accounts
export async function GET() {
  const supabase = await createServerSupabaseClientForRLS();

  const { data, error } = await supabase
    .from("current_accounts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const mapped = (data || []).map((row: any) => ({
    ...row,
    isActive: row.is_active ?? true,
    accountType: row.account_type ?? "CUSTOMER",
  }));

  return NextResponse.json(mapped);
}

// POST /api/current-accounts
export async function POST(req: Request) {
  const supabase = await createServerSupabaseClientForRLS();
  const body = await req.json();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Auth session missing" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("current_accounts")
    .insert({
      name: body.name,
      phone: body.phone,
      address: body.address,
      tax_number: body.taxNumber ?? body.tax_number,
      tax_office: body.taxOffice ?? body.tax_office,
      company: body.company,
      balance: body.balance ?? 0,
      is_active: body.isActive ?? true,
      account_type: body.accountType ?? body.account_type,
      tenant_id: user.id,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const mapped = {
    ...data,
    isActive: data?.is_active ?? true,
    accountType: data?.account_type ?? "CUSTOMER",
  };

  return NextResponse.json(mapped, { status: 201 });
}
