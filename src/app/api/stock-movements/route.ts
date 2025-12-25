import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';
    
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const movementData = await request.json();
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';
    
    const movementWithTenant = {
      ...movementData,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('stock_movements')
      .insert([movementWithTenant])
      .select();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Update product stock quantity
    if (movementData.product_id) {
      const productResponse = await supabase
        .from('products')
        .select('stock_quantity')
        .eq('id', movementData.product_id)
        .eq('tenant_id', tenantId)
        .single();

      if (productResponse.data) {
        const currentQuantity = productResponse.data.stock_quantity || 0;
        const newQuantity = movementData.movement_type === 'IN' 
          ? currentQuantity + movementData.quantity 
          : currentQuantity - movementData.quantity;

        await supabase
          .from('products')
          .update({ 
            stock_quantity: newQuantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', movementData.product_id)
          .eq('tenant_id', tenantId);
      }
    }

    return Response.json(data[0]);
  } catch (error) {
    console.error('Error creating stock movement:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}