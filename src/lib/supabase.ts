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

// SINGLE EXPORTED BROWSER CLIENT - Created once, used everywhere
// This eliminates React Strict Mode double-mounting issues

let browserClient: ReturnType<typeof createSupabaseBrowserClient> | null = null;

// Create the client immediately when module is imported (but only in browser)
if (typeof window !== 'undefined' && !browserClient) {
  browserClient = createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey);
}

// Export the single client instance
export const supabaseBrowser = browserClient;

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