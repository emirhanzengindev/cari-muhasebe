export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClientWithRequest } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    console.log('DEBUG: GET /api/stock-movements called')

    const supabase = await createServerSupabaseClientWithRequest()

    const {
      data: { user },
      error: authError
    } = await supabase.auth.getUser()

    if (!user) {
      console.error('DEBUG: Auth session missing')
      return Response.json(
        { error: 'Auth session missing' },
        { status: 401 }
      )
    }

    const userMetadataTenantId =
      typeof user.user_metadata?.tenant_id === 'string'
        ? user.user_metadata.tenant_id
        : null;
    const resolvedTenantId = userMetadataTenantId || user.id;
    const tenantCandidates = Array.from(new Set([resolvedTenantId, user.id]));

    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .in('tenant_id', tenantCandidates)

    if (error) {
      console.error('SUPABASE ERROR:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        status: null // status might not be available in this context
      });
      
      // Handle specific error cases
      if (error.code === '42P01' || error.message.toLowerCase().includes('does not exist')) {
        // Table does not exist - return empty array instead of error
        console.warn('Table stock_movements does not exist, returning empty array');
        return Response.json([]);
      }
      
      // For other errors, return the error message
      return Response.json({ 
        error: error.message,
        code: error.code,
        details: error.details
      }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error fetching stock movements:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const movementData = await request.json()

    const supabase = await createServerSupabaseClientWithRequest();

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json(
        { error: 'Auth session missing' },
        { status: 401 }
      )
    }

    if (!movementData.productId || !movementData.movementType || !movementData.quantity) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Validate movement type is one of the allowed values
    const normalizedMovementType = String(movementData.movementType).toLowerCase();
    const validMovementTypes = ['in', 'out'];
    if (!validMovementTypes.includes(normalizedMovementType)) {
      return Response.json(
        { error: 'Invalid movement type. Must be "in" or "out"' },
        { status: 400 }
      );
    }

    // Use RPC function to atomically update stock and create movement record
    const { data, error } = await supabase.rpc('apply_stock_movement', {
      p_product_id: movementData.productId,
      p_quantity: movementData.quantity,
      p_movement_type: normalizedMovementType,
      p_description: movementData.description || null,
      p_warehouse_id: movementData.warehouseId || null,
      p_price: movementData.price || null
    })

    if (error) {
      console.error('SUPABASE RPC ERROR:', error)
      return Response.json({ error: error.message }, { status: 400 })
    }

    // Return success response (rpc functions don't return data)
    return Response.json({ success: true, message: 'Stock movement applied successfully' })
  } catch (error) {
    console.error('Error creating stock movement:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
