const { createClient } = require('@supabase/supabase-js');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testApi() {
  try {
    console.log('Testing current_accounts API...');
    
    // First, try to get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('User:', user);
    console.log('User Error:', userError);
    
    if (!user) {
      console.log('No authenticated user found');
      return;
    }
    
    // Try to insert a test record
    const testAccount = {
      name: 'Test Account ' + Date.now(),
      phone: '+1234567890',
      address: 'Test Address',
      tax_number: '123456789',
      tax_office: 'Test Tax Office',
      company: 'Test Company',
      balance: 0,
      tenant_id: user.id,
      is_active: true,
      account_type: 'CUSTOMER'
    };
    
    console.log('Inserting test account:', testAccount);
    
    const { data, error } = await supabase
      .from('current_accounts')
      .insert([testAccount])
      .select()
      .single();
    
    console.log('Insert result:', { data, error });
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testApi();