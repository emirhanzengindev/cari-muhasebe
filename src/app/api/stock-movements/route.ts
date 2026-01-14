import { NextRequest } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const tenantId = request.headers.get('x-tenant-id');
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
    
    const supabase = createServerSupabaseClient(tenantId);
    
    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('tenant_id', tenantId);

    if (error) {
      console.error('SUPABASE ERROR DETAILS (GET):', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return Response.json({ error: error.message, details: error }, { status: 500 });
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
    const tenantId = request.headers.get('x-tenant-id');
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
    
    const movementWithTenant = {
      ...movementData,
      tenant_id: tenantId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Validate required fields
    if (!movementWithTenant.product_id) {
      console.error('MISSING REQUIRED FIELD: product_id');
      return Response.json({ error: 'Product ID is required' }, { status: 400 });
    }
    if (!movementWithTenant.movement_type) {
      console.error('MISSING REQUIRED FIELD: movement_type');
      return Response.json({ error: 'Movement type is required' }, { status: 400 });
    }
    if (!movementWithTenant.quantity) {
      console.error('MISSING REQUIRED FIELD: quantity');
      return Response.json({ error: 'Quantity is required' }, { status: 400 });
    }

    const supabase = createServerSupabaseClient(tenantId);
    
    const { data, error } = await supabase
      .from('stock_movements')
      .insert([movementWithTenant])
      .select()
      .single();

    if (error) {
      console.error('SUPABASE ERROR DETAILS:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      return Response.json({ error: error.message, details: error }, { status: 500 });
    }

    // Update product stock quantity
    if (movementData.product_id) {
      // Get all stock movements for this product to recalculate the stock
      const { data: allMovements, error: movementsError } = await supabase
        .from('stock_movements')
        .select('*')
        .eq('product_id', movementData.product_id)
        .eq('tenant_id', tenantId);

      if (movementsError) {
        console.error('Error fetching stock movements for recalculation:', movementsError);
      } else {
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
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error creating stock movement:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}