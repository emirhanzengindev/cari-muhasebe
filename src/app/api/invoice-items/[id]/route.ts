import { NextRequest } from 'next/server';
import { createServerSupabaseClient, getTenantIdFromJWT } from '@/lib/supabaseServer';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const tenantId = await getTenantIdFromJWT();
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
    
    const supabase = createServerSupabaseClient();
    
    const { data, error, status } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error && status === 404) {
      console.error('Table invoice_items does not exist for select operation');
      return Response.json({ error: 'Invoice items table does not exist' }, { status: 500 });
    }
    
    if (error) {
      console.error('SUPABASE ERROR (GET invoice_items by id):', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return Response.json({ error: 'Invoice item not found' }, { status: 404 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error fetching invoice item:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const invoiceItemData = await request.json();
    const tenantId = await getTenantIdFromJWT();
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
    
    const supabase = createServerSupabaseClient();
    
    // First check if the record exists and belongs to the tenant
    const { data: existingItem, error: fetchError } = await supabase
      .from('invoice_items')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();
      
    if (fetchError) {
      console.error('SUPABASE ERROR (check existing invoice_item):', fetchError);
      return Response.json({ error: 'Invoice item not found' }, { status: 404 });
    }
    
    if (!existingItem) {
      return Response.json({ error: 'Invoice item not found' }, { status: 404 });
    }
    
    const { data, error, status } = await supabase
      .from('invoice_items')
      .update({
        ...invoiceItemData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error && status === 404) {
      console.error('Table invoice_items does not exist for update operation');
      return Response.json({ error: 'Invoice items table does not exist' }, { status: 500 });
    }
    
    if (error) {
      console.error('SUPABASE ERROR (PUT invoice_items):', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error updating invoice item:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const tenantId = await getTenantIdFromJWT();
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
    
    const supabase = createServerSupabaseClient();
    
    // First check if the record exists and belongs to the tenant
    const { data: existingItem, error: fetchError } = await supabase
      .from('invoice_items')
      .select('id')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();
      
    if (fetchError) {
      console.error('SUPABASE ERROR (check existing invoice_item):', fetchError);
      return Response.json({ error: 'Invoice item not found' }, { status: 404 });
    }
    
    if (!existingItem) {
      return Response.json({ error: 'Invoice item not found' }, { status: 404 });
    }
    
    const { error, status } = await supabase
      .from('invoice_items')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error && status === 404) {
      console.error('Table invoice_items does not exist for delete operation');
      return Response.json({ error: 'Invoice items table does not exist' }, { status: 500 });
    }
    
    if (error) {
      console.error('SUPABASE ERROR (DELETE invoice_items):', error);
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error('Error deleting invoice item:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}