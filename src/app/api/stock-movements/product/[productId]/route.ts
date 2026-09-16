import { NextRequest } from "next/server";
import { createServerSupabaseClientForRLS } from "@/lib/supabaseServer";

type Params = {
  productId: string;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Params }
) {
  try {
    const supabase = await createServerSupabaseClientForRLS();

    const { data, error } = await supabase
      .from("stock_movements")
      .select("*")
      .eq("product_id", params.productId)
      .order("created_at", { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error("Error fetching stock movements for product:", error);
    return Response.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
