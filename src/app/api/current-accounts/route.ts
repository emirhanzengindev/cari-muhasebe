import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function createSupabaseClient() {
  const cookieStore = await cookies(); // ✅ DOĞRUSU BU

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

// =====================
// GET
// =====================
export async function GET() {
  const supabase = await createSupabaseClient(); // ✅ await şart

  const { data, error } = await supabase
    .from("current_accounts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 403 });
  }

  return NextResponse.json(data);
}

// =====================
// POST
// =====================
export async function POST(req: Request) {
  const supabase = await createSupabaseClient(); // ✅ await şart

  try {
    const body = await req.json();

    const { data, error } = await supabase
      .from("current_accounts")
      .insert(body)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 403 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }
}
