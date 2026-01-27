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

// SINGLETON BROWSER CLIENT - Used everywhere in frontend
let browserClient: ReturnType<typeof createSupabaseBrowserClient> | null = null;

export const getBrowserClient = () => {
  if (typeof window === 'undefined') {
    throw new Error('getBrowserClient can only be called in the browser');
  }
  
  if (!browserClient) {
    browserClient = createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey);
  }
  
  return browserClient;
};

// Legacy alias for backward compatibility
export const createBrowserClient = getBrowserClient;

// Default client for server-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);