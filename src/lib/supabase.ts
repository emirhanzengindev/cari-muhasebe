import { createClient } from '@supabase/supabase-js';
import { createBrowserClient as createSupabaseBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');
}

// TRULY GLOBAL SINGLETON BROWSER CLIENT - Created once globally
// This eliminates React Strict Mode double-instantiation

// Define a global property to store the client
const GLOBAL_CLIENT_KEY = '__SUPABASE_BROWSER_CLIENT_INSTANCE__';

declare global {
  interface Window {
    [GLOBAL_CLIENT_KEY]: ReturnType<typeof createSupabaseBrowserClient> | undefined;
  }
}

// Function to get or create the client
const getOrCreateGlobalClient = (): ReturnType<typeof createSupabaseBrowserClient> => {
  if (typeof window === 'undefined') {
    throw new Error('Browser client can only be used in browser environment');
  }
  
  // Check if client already exists in global scope
  if (!window[GLOBAL_CLIENT_KEY]) {
    window[GLOBAL_CLIENT_KEY] = createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  
  return window[GLOBAL_CLIENT_KEY]!;
};

// Export the getter function
export const getSupabaseBrowser = getOrCreateGlobalClient;

// Also export a direct access for advanced use cases
export const supabaseBrowser = typeof window !== 'undefined' ? getOrCreateGlobalClient() : null;

// Helper function for backward compatibility (throws if used incorrectly)
export const getBrowserClient = () => {
  if (typeof window === 'undefined') {
    throw new Error('getBrowserClient can only be called in the browser');
  }
  return getOrCreateGlobalClient();
};

// Legacy alias for backward compatibility
export const createBrowserClient = getBrowserClient;

// Default client for server-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);