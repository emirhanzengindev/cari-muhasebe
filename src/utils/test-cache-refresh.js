// Quick Test Script - Run after cache refresh
// Paste this in your browser console or create a simple test page

import { getSupabaseBrowser } from '@/lib/supabase';

async function testCacheRefresh() {
  const supabase = getSupabaseBrowser();
  
  console.log('Testing minimal query after cache refresh...');
  
  try {
    const { data, error } = await supabase
      .from('current_accounts')
      .select('id, name')
      .limit(1);
    
    if (error) {
      console.error('❌ Cache refresh FAILED:', error);
      console.log('Error code:', error.code);
      console.log('Error message:', error.message);
      return false;
    }
    
    console.log('✅ Cache refresh SUCCESS!');
    console.log('Data received:', data);
    return true;
    
  } catch (err) {
    console.error('❌ Test failed with exception:', err);
    return false;
  }
}

// Run the test
testCacheRefresh().then(success => {
  if (success) {
    console.log('🎉 PostgREST schema cache is now synchronized!');
  } else {
    console.log('⚠️ Cache refresh may still be propagating - wait a bit longer');
  }
});