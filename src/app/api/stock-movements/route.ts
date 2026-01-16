import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    console.log('DEBUG: GET /api/stock-movements called')

    const supabase = createServerSupabaseClient()

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
      .eq('tenant_id', user.id)

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

    const supabase = createServerSupabaseClient()

    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json(
        { error: 'Auth session missing' },
        { status: 401 }
      )
    }

    const movement: any = {}

    if (movementData.productId !== undefined) movement.product_id = movementData.productId
    if (movementData.movementType !== undefined) movement.movement_type = movementData.movementType
    if (movementData.quantity !== undefined) movement.quantity = movementData.quantity
    if (movementData.description !== undefined) movement.description = movementData.description
    if (movementData.reference !== undefined) movement.reference = movementData.reference
    if (movementData.date !== undefined) movement.date = movementData.date

    movement.created_at = new Date().toISOString()
    movement.updated_at = new Date().toISOString()
    movement.tenant_id = user.id // Set tenant_id from authenticated user

    if (!movement.product_id || !movement.movement_type || !movement.quantity) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    // Validate movement type is one of the allowed values
    const validMovementTypes = ['in', 'out'];
    if (!validMovementTypes.includes(movement.movement_type.toLowerCase())) {
      return Response.json(
        { error: 'Invalid movement type. Must be "in" or "out"' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('stock_movements')
      .insert(movement)
      .select()
      .single()

    if (error) {
      console.error('SUPABASE ERROR:', error)
      return Response.json({ error: error.message }, { status: 500 })
    }

    return Response.json(data)
  } catch (error) {
    console.error('Error creating stock movement:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}