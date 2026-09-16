import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClientForRLS } from "@/lib/supabaseServer";

type Params = {
  id: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClientForRLS();

  const { data, error } = await supabase
    .from("warehouses")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClientForRLS();
  const body = await request.json();

  const { data, error } = await supabase
    .from("warehouses")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  const { id } = await params;
  const supabase = await createServerSupabaseClientForRLS();

  const { error } = await supabase
    .from("warehouses")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
