export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClientWithRequest } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    console.log('DEBUG: GET /api/stock-movements called')

    const supabase = createServerSupabaseClientWithRequest(request)

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

    const { data, error } = await supabase
      .from('stock_movements')
      .select('*')
      .eq('tenant_id', user.id)  // Filter by authenticated user's tenant ID

    if (error) {
      console.error('SUPABASE ERROR:', error);
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
    const movementData = await request.json()

    const supabase = createServerSupabaseClientWithRequest(request)

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
    const validMovementTypes = ['in', 'out'];
    if (!validMovementTypes.includes(movementData.movementType.toLowerCase())) {
      return Response.json(
        { error: 'Invalid movement type. Must be "in" or "out"' },
        { status: 400 }
      );
    }

    // Use RPC function to atomically update stock and create movement record
    const { data, error } = await supabase.rpc('apply_stock_movement', {
      p_product_id: movementData.productId,
      p_quantity: movementData.quantity,
      p_movement_type: movementData.movementType,
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