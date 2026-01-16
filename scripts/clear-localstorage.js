// Script to clear problematic localStorage entries
// Run this in browser console or as part of app initialization

(function() {
  console.log('🧹 Clearing localStorage entries...');
  
  // Clear all tenant-related storage
  const keysToRemove = [
    'tenant-storage',
    'tenantId',
    'auth-token',
    'sb-access-token',
    'sb-refresh-token'
  ];
  
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      console.log(`🗑️  Removing localStorage key: ${key}`);
      localStorage.removeItem(key);
    }
  });
  
  // Also clear all Supabase-related items
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('sb-')) {
      console.log(`🗑️  Removing Supabase key: ${key}`);
      localStorage.removeItem(key);
    }
  });
  
  console.log('✅ localStorage cleanup completed!');
  console.log('🔄 Please refresh the page to start with clean state');
})();