import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET(
  request: NextRequest, 
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params;
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';
    
    const supabase = createServerSupabaseClient(tenantId);
    
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('product_id', productId)
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error fetching stock movements for product:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}