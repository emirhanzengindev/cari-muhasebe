export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerSupabaseClientWithRequest } from '@/lib/supabaseServer';

const resolveStockValue = (product: any): number => {
  const raw =
    product?.stock_quantity ??
    product?.stock ??
    product?.quantity ??
    0;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
};

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
    const normalizedProductId = String(
      movementData?.productId ?? movementData?.product_id ?? ''
    ).trim();
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

    if (!normalizedProductId || !movementData.movementType || !movementData.quantity) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    if (!uuidRegex.test(normalizedProductId)) {
      return Response.json(
        { error: `Invalid productId format: ${normalizedProductId}` },
        { status: 400 }
      );
    }

    const numericQuantity = Number(movementData.quantity);
    if (!Number.isFinite(numericQuantity) || numericQuantity <= 0) {
      return Response.json(
        { error: 'Quantity must be a positive number' },
        { status: 400 }
      );
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

    const userMetadataTenantId =
      typeof user.user_metadata?.tenant_id === 'string'
        ? user.user_metadata.tenant_id
        : null;
    const resolvedTenantId = userMetadataTenantId || user.id;
    const tenantCandidates = Array.from(new Set([resolvedTenantId, user.id]));
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const admin =
      serviceRoleKey && supabaseUrl
        ? createClient(supabaseUrl, serviceRoleKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          })
        : null;

    // Primary path: DB RPC (atomic).
    const { error } = await supabase.rpc('apply_stock_movement', {
      p_product_id: normalizedProductId,
      p_quantity: numericQuantity,
      p_movement_type: normalizedMovementType,
      p_description: movementData.description || null,
      p_warehouse_id: movementData.warehouseId || null,
      p_price: movementData.price || null
    })

    if (error) {
      console.warn('SUPABASE RPC ERROR (falling back to app-level update):', error)

      const applyFallback = async (client: any) => {
        const { data: product, error: productError } = await client
          .from('products')
          .select('*')
          .eq('id', normalizedProductId)
          .maybeSingle();

        if (productError) {
          return {
            ok: false,
            message: `Product query failed: ${productError.message}`,
          };
        }

        if (!product) {
          return {
            ok: false,
            message: `Product not found for id: ${normalizedProductId}`,
          };
        }

        if (admin && !tenantCandidates.includes(String(product.tenant_id))) {
          console.warn('STOCK MOVEMENT TENANT MISMATCH:', {
            productId: normalizedProductId,
            normalizedProductId,
            productTenantId: product.tenant_id,
            tenantCandidates,
          });
        }

        const currentStock = resolveStockValue(product);
        if (normalizedMovementType === 'out' && currentStock < numericQuantity) {
          return {
            ok: false,
            message: `Insufficient stock. Available: ${currentStock}, Requested: ${numericQuantity}`,
          };
        }

        const nextStock =
          normalizedMovementType === 'out'
            ? currentStock - numericQuantity
            : currentStock + numericQuantity;

        const updatePayloadCandidates = [
          { stock_quantity: nextStock, updated_at: new Date().toISOString() },
          { stock: nextStock, updated_at: new Date().toISOString() },
        ];
        let stockUpdateError: any = null;
        for (const payload of updatePayloadCandidates) {
          const { error: candidateError } = await client
            .from('products')
            .update(payload)
            .eq('id', normalizedProductId);
          if (!candidateError) {
            stockUpdateError = null;
            break;
          }
          stockUpdateError = candidateError;
          const msg = String(candidateError.message || '').toLowerCase();
          if (!msg.includes('column') || !msg.includes('does not exist')) {
            break;
          }
        }

        if (stockUpdateError) {
          return { ok: false, message: `Stock update failed: ${stockUpdateError.message}` };
        }

        const insertTenantId = product.tenant_id || resolvedTenantId;
        const { data: movementRow, error: movementInsertError } = await client
          .from('stock_movements')
          .insert({
            product_id: normalizedProductId,
            movement_type: normalizedMovementType,
            quantity: numericQuantity,
            description: movementData.description || null,
            warehouse_id: movementData.warehouseId || null,
            price: movementData.price || null,
            tenant_id: insertTenantId,
          })
          .select('*')
          .maybeSingle();

        if (movementInsertError) {
          return { ok: false, message: movementInsertError.message };
        }

        return {
          ok: true,
          payload: movementRow ?? { success: true, message: 'Stock movement applied successfully (fallback path)' },
        };
      };

      const primaryFallback = await applyFallback(supabase);
      if (primaryFallback.ok) {
        return Response.json(primaryFallback.payload);
      }

      if (admin) {
        const adminFallback = await applyFallback(admin);
        if (adminFallback.ok) {
          return Response.json(adminFallback.payload);
        }
        return Response.json({ error: adminFallback.message }, { status: 400 });
      }

      return Response.json({ error: primaryFallback.message }, { status: 400 });
    }

    // RPC succeeded
    return Response.json({ success: true, message: 'Stock movement applied successfully' })
  } catch (error) {
    console.error('Error creating stock movement:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
