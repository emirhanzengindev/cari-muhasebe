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

// LAZY SINGLETON BROWSER CLIENT - Created on first access
// This works in both browser and server environments

let browserClient: ReturnType<typeof createSupabaseBrowserClient> | null = null;

// Lazy getter that creates client only when accessed in browser
const getOrCreateBrowserClient = (): ReturnType<typeof createSupabaseBrowserClient> => {
  if (typeof window === 'undefined') {
    throw new Error('Browser client can only be used in browser environment');
  }
  
  if (!browserClient) {
    browserClient = createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  
  return browserClient;
};

// Export a getter function instead of direct value
export const getSupabaseBrowser = getOrCreateBrowserClient;

// For backward compatibility - throws helpful error if used incorrectly
export const supabaseBrowser: ReturnType<typeof createSupabaseBrowserClient> | null = 
  typeof window !== 'undefined' ? getOrCreateBrowserClient() : null;

// Helper function for backward compatibility (throws if used incorrectly)
export const getBrowserClient = () => {
  if (typeof window === 'undefined') {
    throw new Error('getBrowserClient can only be called in the browser');
  }
  if (!browserClient) {
    throw new Error('Browser client not initialized');
  }
  return browserClient;
};

// Legacy alias for backward compatibility
export const createBrowserClient = getBrowserClient;

// Default client for server-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);