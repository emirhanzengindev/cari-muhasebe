import { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseServer';

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';
    
    const { data, error } = await supabaseServer
      .from('categories')
      .select('*')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error fetching category:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const categoryData = await request.json();
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';
    
    const { data, error } = await supabaseServer
      .from('categories')
      .update({
        ...categoryData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json(data);
  } catch (error) {
    console.error('Error updating category:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const tenantId = request.headers.get('x-tenant-id') || 'default-tenant';
    
    const { error } = await supabaseServer
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('tenant_id', tenantId);

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}