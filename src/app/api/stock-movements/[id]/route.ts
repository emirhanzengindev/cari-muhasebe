import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClientForRLS } from "@/lib/supabaseServer";

type Params = {
  id: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  const supabase = await createServerSupabaseClientForRLS();

  const { data, error } = await supabase
    .from("stock_movements")
    .select("*")
    .eq("id", params.id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Params }
) {
  const supabase = await createServerSupabaseClientForRLS();
  const body = await request.json();

  const { data, error } = await supabase
    .from("stock_movements")
    .update(body)
    .eq("id", params.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Params }
) {
  const supabase = await createServerSupabaseClientForRLS();

  const { error } = await supabase
    .from("stock_movements")
    .delete()
    .eq("id", params.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
