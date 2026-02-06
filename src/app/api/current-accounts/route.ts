import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function createSupabaseClient() {
  const cookieStore = await cookies(); // ✅ FIX

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);

          });
        },
      },
    }
  );
}

/* =======================
   GET
======================= */
export async function GET() {
  const supabase = await createSupabaseClient();

  const { data, error } = await supabase
    .from("current_accounts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

/* =======================
   POST
======================= */
export async function POST(req: Request) {
  const supabase = await createSupabaseClient();

  const body = await req.json();

  const payload = {
    name: body.name,
    phone: body.phone,
    address: body.address,
    tax_number: body.taxNumber ?? body.tax_number,
    tax_office: body.taxOffice ?? body.tax_office,
    company: body.company,
    balance: body.balance ?? 0,
    is_active: body.isActive ?? true,
    tenant_id: body.tenant_id,
    account_type: body.accountType ?? body.account_type,
  };

  const { data, error } = await supabase
    .from("current_accounts")
    .insert(payload)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}
//test
