export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server';
import { headers, cookies } from 'next/headers';
import { createServerSupabaseClientWithRequest } from '@/lib/supabaseServer';

export async function GET(request: NextRequest) {
  try {
    console.log('DEBUG: GET /api/products called')

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
      .from('products')
      .select('*')
      .eq('tenant_id', user.id)  // Filter by authenticated user's tenant ID

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
        console.warn('Table products does not exist, returning empty array');
        return Response.json([]);
      }
      
      // For other errors, return the error message
      return Response.json({ 
        error: error.message,
        code: error.code,
        details: error.details
      }, { status: 500 });
    }

    console.log('DEBUG: Successfully fetched', data?.length || 0, 'products')
    return Response.json(data)
  } catch (error) {
    console.error('Error fetching products:', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('API HIT: products');
    
    const productData = await request.json();
    console.log('BODY:', productData);
    console.log('RAW BODY 👉', productData);
    
    const supabase = createServerSupabaseClientWithRequest(request);
    
    const {
      data: { user }
    } = await supabase.auth.getUser();
    
    if (!user) {
      return Response.json(
        { error: 'Auth session missing' },
        { status: 401 }
      );
    }
    
    // Map camelCase fields to snake_case for database insertion
    const productWithTenant: any = {};
    
    // Explicitly map each field to ensure no camelCase fields leak through
    if (productData.name !== undefined) productWithTenant.name = productData.name;
    if (productData.sku !== undefined) productWithTenant.sku = productData.sku;
    if (productData.barcode !== undefined) productWithTenant.barcode = productData.barcode;
    if (productData.categoryId !== undefined) productWithTenant.category_id = productData.categoryId;
    if (productData.warehouseId !== undefined) productWithTenant.warehouse_id = productData.warehouseId;
    if (productData.buyPrice !== undefined) productWithTenant.buy_price = productData.buyPrice;
    if (productData.sellPrice !== undefined) productWithTenant.sell_price = productData.sellPrice;
    if (productData.vatRate !== undefined) productWithTenant.vat_rate = productData.vatRate;
    if (productData.stockQuantity !== undefined) productWithTenant.stock_quantity = productData.stockQuantity;
    if (productData.criticalLevel !== undefined) productWithTenant.critical_level = productData.criticalLevel;
    if (productData.minStockLevel !== undefined) productWithTenant.min_stock_level = productData.minStockLevel;
    if (productData.maxStockLevel !== undefined) productWithTenant.max_stock_level = productData.maxStockLevel;
    if (productData.reorderPoint !== undefined) productWithTenant.reorder_point = productData.reorderPoint;
    if (productData.unit !== undefined) productWithTenant.unit = productData.unit;
    if (productData.width !== undefined) productWithTenant.width = productData.width;
    if (productData.height !== undefined) productWithTenant.height = productData.height;
    if (productData.weight !== undefined) productWithTenant.weight = productData.weight;
    if (productData.color !== undefined) productWithTenant.color = productData.color;
    if (productData.size !== undefined) productWithTenant.size = productData.size;
    if (productData.description !== undefined) productWithTenant.description = productData.description;
    if (productData.isActive !== undefined) productWithTenant.is_active = productData.isActive;
    if (productData.reorderThreshold !== undefined) productWithTenant.reorder_threshold = productData.reorderThreshold;
    
    productWithTenant.created_at = new Date().toISOString();
    productWithTenant.updated_at = new Date().toISOString();
    
    // Use the user.id as tenant_id since that's how RLS is configured
    productWithTenant.tenant_id = user.id;
    
    console.log('PRODUCT WITH TENANT:', productWithTenant);
    
    // Validate required fields
    if (!productWithTenant.name) {
      console.error('MISSING REQUIRED FIELD: name');
      return Response.json({ error: 'Product name is required' }, { status: 400 });
    }
    
    const { data, error } = await supabase
      .from('products')
      .insert(productWithTenant)
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

    console.log('SUCCESS DATA:', data);
    return Response.json(data);
  } catch (error) {
    console.error('Error creating product:', error);
    return Response.json({ error: String(error) }, { status: 500 });
  }
}