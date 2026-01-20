import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient, getTenantIdFromJWT } from '@/lib/supabaseServer';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = await getTenantIdFromJWT();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID missing' },
        { status: 401 }
      );
    }
    
    // Validate that tenantId is a proper UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      console.error('INVALID TENANT ID FORMAT:', tenantId);
      return NextResponse.json(
        { error: 'Invalid tenant ID format' },
        { status: 400 }
      );
    }
    
    const supabase = createServerSupabaseClient();
    
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching stock movement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const movementData = await request.json();
    const tenantId = await getTenantIdFromJWT();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID missing' },
        { status: 401 }
      );
    }
    
    // Validate that tenantId is a proper UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      console.error('INVALID TENANT ID FORMAT:', tenantId);
      return NextResponse.json(
        { error: 'Invalid tenant ID format' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    // Update the stock movement
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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update product stock quantity
    if (movementData.product_id) {
      // First get all stock movements for this product to recalculate the stock
      const { data: allMovements, error: movementsError } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('product_id', movementData.product_id)
        .eq('tenant_id', tenantId);

      if (movementsError) {
        return Response.json({ error: movementsError.message }, { status: 500 });
      }

      // Calculate the total stock based on all movements
      const totalStock = allMovements.reduce((sum: number, mov: any) => {
        return mov.movement_type.toLowerCase() === 'in' 
          ? sum + (mov.quantity || 0) 
          : sum - (mov.quantity || 0);
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

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error updating stock movement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const tenantId = await getTenantIdFromJWT();
    if (!tenantId) {
      return NextResponse.json(
        { error: 'Tenant ID missing' },
        { status: 401 }
      );
    }
    
    // Validate that tenantId is a proper UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      console.error('INVALID TENANT ID FORMAT:', tenantId);
      return NextResponse.json(
        { error: 'Invalid tenant ID format' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

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
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Recalculate product stock quantity
    if (movement && movement.product_id) {
      const { data: allMovements, error: movementsError } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('product_id', movement.product_id)
        .eq('tenant_id', tenantId);

      if (movementsError) {
        return Response.json({ error: movementsError.message }, { status: 500 });
      }

      // Calculate the total stock based on all remaining movements
      const totalStock = allMovements.reduce((sum: number, mov: any) => {
        return mov.movement_type.toLowerCase() === 'in' 
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting stock movement:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}