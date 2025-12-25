import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';
    
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error fetching stock movement:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const movementData = await request.json();
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';
    
    const { data, error } = await supabase
      .from('stock_movements')
      .update({
        ...movementData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Update product stock quantity
    if (movementData.product_id) {
      // First get all stock movements for this product to recalculate the stock
      const { data: allMovements, error: movementsError } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('product_id', movementData.product_id)
        .eq('tenant_id', tenantId);

      if (!movementsError && allMovements) {
        const totalStock = allMovements.reduce((sum, movement) => {
          return movement.movement_type === 'IN' 
            ? sum + (movement.quantity || 0)
            : sum - (movement.quantity || 0);
        }, 0);

        await supabase
          .from('products')
          .update({ 
            stock_quantity: totalStock,
            updated_at: new Date().toISOString()
          })
          .eq('id', movementData.product_id)
          .eq('tenant_id', tenantId);
      }
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error updating stock movement:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';
    
    // Get the stock movement before deleting to access product_id
    const { data: movement, error: fetchError } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (fetchError) {
      return Response.json({ error: fetchError.message }, { status: 500 });
    }

    const { error } = await supabase
      .from('stock_movements')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    // Recalculate product stock quantity
    if (movement && movement.product_id) {
      const { data: allMovements, error: movementsError } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('product_id', movement.product_id)
        .eq('tenant_id', tenantId);

      if (!movementsError && allMovements) {
        const totalStock = allMovements.reduce((sum, mov) => {
          return mov.movement_type === 'IN' 
            ? sum + (mov.quantity || 0)
            : sum - (mov.quantity || 0);
        }, 0);

        await supabase
          .from('products')
          .update({ 
            stock_quantity: totalStock,
            updated_at: new Date().toISOString()
          })
          .eq('id', movement.product_id)
          .eq('tenant_id', tenantId);
      }
    }

    return Response.json({ message: 'Stock movement deleted successfully' });
  } catch (error) {
    console.error('Error deleting stock movement:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}