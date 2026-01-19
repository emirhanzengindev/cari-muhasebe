import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getTenantIdFromJWT } from '@/lib/supabaseServer';

export async function GET(
  request: NextRequest, 
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params;
    const tenantId = await getTenantIdFromJWT();
    
    if (!tenantId) {
      return Response.json(
        { error: 'Tenant ID missing' },
        { status: 401 }
      );
    }
    
    // Validate that tenantId is a proper UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      console.error('INVALID TENANT ID FORMAT:', tenantId);
      return Response.json(
        { error: 'Invalid tenant ID format' },
        { status: 400 }
      );
    }
    
    const supabase = createServerSupabaseClient();
    
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