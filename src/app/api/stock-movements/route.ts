import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getTenantIdFromJWT } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    const { data: { user }, error: userError } = await createServerSupabaseClient().auth.getUser();
    
    if (userError || !user) {
      return Response.json(
        { error: 'Auth session missing' },
        { status: 401 }
      );
    }
    
    let tenantId = user.user_metadata?.tenant_id;
    
    // Clean tenant ID if it has unwanted suffix
    if (tenantId && typeof tenantId === 'string') {
      if (tenantId.endsWith('ENANT_ID')) {
        // Remove the suffix
        tenantId = tenantId.replace(/ENANT_ID$/, '');
      }
    }
    
    if (!tenantId) {
      return Response.json(
        { error: 'Tenant ID missing from JWT' },
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
    const { data: { user }, error: userError } = await createServerSupabaseClient().auth.getUser();
    
    if (userError || !user) {
      return Response.json(
        { error: 'Auth session missing' },
        { status: 401 }
      );
    }
    
    let tenantId = user.user_metadata?.tenant_id;
    
    // Clean tenant ID if it has unwanted suffix
    if (tenantId && typeof tenantId === 'string') {
      if (tenantId.endsWith('ENANT_ID')) {
        // Remove the suffix
        tenantId = tenantId.replace(/ENANT_ID$/, '');
      }
    }
    
    if (!tenantId) {
      return Response.json(
        { error: 'Tenant ID missing from JWT' },
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
    
    // Map camelCase fields to snake_case for database insertion
    const movementWithTenant: any = {};
    
    // Explicitly map each field to ensure no camelCase fields leak through
    if (movementData.productId !== undefined) movementWithTenant.product_id = movementData.productId;
    if (movementData.movementType !== undefined) movementWithTenant.movement_type = movementData.movementType;
    if (movementData.quantity !== undefined) movementWithTenant.quantity = movementData.quantity;
    if (movementData.description !== undefined) movementWithTenant.description = movementData.description;
    if (movementData.reference !== undefined) movementWithTenant.reference = movementData.reference;
    if (movementData.date !== undefined) movementWithTenant.date = movementData.date;
    
    movementWithTenant.tenant_id = tenantId;
    movementWithTenant.created_at = new Date().toISOString();
    movementWithTenant.updated_at = new Date().toISOString();
    
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

    const supabase = createServerSupabaseClient();
    
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