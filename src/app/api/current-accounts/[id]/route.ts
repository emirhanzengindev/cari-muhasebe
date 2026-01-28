import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClientWithRequest, getTenantIdFromJWTWithRequest } from '@/lib/supabaseServer'

type Params = {
  id: string
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const { id } = await context.params
  const tenantId = await getTenantIdFromJWTWithRequest(request)

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant ID missing' }, { status: 401 })
  }

  const supabase = createServerSupabaseClientWithRequest(request)

  const { data, error } = await supabase
    .from('current_accounts')
    .select('*')
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Map database fields to frontend interface fields
  const mappedData = {
    ...data,
    isActive: data.is_active !== undefined ? data.is_active : true,
    accountType: data.account_type || 'CUSTOMER'
  };
  
  return NextResponse.json(mappedData)
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const { id } = await context.params
  const body = await request.json()
  const tenantId = await getTenantIdFromJWTWithRequest(request)

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant ID missing' }, { status: 401 })
  }

  const supabase = createServerSupabaseClientWithRequest(request)

  const { data, error } = await supabase
    .from('current_accounts')
    .update(body)
    .eq('id', id)
    .eq('tenant_id', tenantId)
    .select()
    .single()

  if (error) {
    console.error('SUPABASE ERROR (PUT current_accounts):', {
      message: error.message,
      code: error.code,
      details: error.details
    });
    
    // Handle PostgREST schema cache errors specifically
    if (error.code === 'PGRST204' && (error.message.includes('accountType') || error.message.includes('account_type') || error.message.includes('is_active'))) {
      console.warn('SCHEMA CACHE ISSUE DETECTED during update: Column schema cache mismatch');
      console.warn('Attempting update without problematic fields');
      
      // Remove problematic fields and try again
      const { is_active, account_type, isActive, accountType, ...cleanBody } = body;
      
      const { data: cleanData, error: cleanError } = await supabase
        .from('current_accounts')
        .update(cleanBody)
        .eq('id', id)
        .eq('tenant_id', tenantId)
        .select()
        .single();
        
      if (cleanError) {
        console.error('Clean update also failed:', cleanError);
        return NextResponse.json({ error: cleanError.message }, { status: 500 });
      }
      
      // Map the response data
      const mappedData = {
        ...cleanData,
        created_at: new Date(cleanData.created_at),
        updated_at: new Date(cleanData.updated_at),
        isActive: cleanData.is_active !== undefined ? cleanData.is_active : true,
        accountType: cleanData.account_type || 'CUSTOMER'
      };
      
      return NextResponse.json(mappedData);
    }
    
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Map database fields to frontend interface fields
  const mappedData = {
    ...data,
    created_at: new Date(data.created_at),
    updated_at: new Date(data.updated_at),
    isActive: data.is_active !== undefined ? data.is_active : true,
    accountType: data.account_type || 'CUSTOMER'
  };
  
  return NextResponse.json(mappedData)
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<Params> }
) {
  const { id } = await context.params
  const tenantId = await getTenantIdFromJWTWithRequest(request)

  if (!tenantId) {
    return NextResponse.json({ error: 'Tenant ID missing' }, { status: 401 })
  }

  const supabase = createServerSupabaseClientWithRequest(request)

  const { error } = await supabase
    .from('current_accounts')
    .delete()
    .eq('id', id)
    .eq('tenant_id', tenantId)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}