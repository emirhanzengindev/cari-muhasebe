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

// TRULY GLOBAL SINGLETON BROWSER CLIENT - Used everywhere in frontend
// Using globalThis to ensure true singleton across module reloads
const GLOBAL_KEY = '__SUPABASE_BROWSER_CLIENT__';

type BrowserClientType = ReturnType<typeof createSupabaseBrowserClient>;

declare global {
  var __SUPABASE_BROWSER_CLIENT__: BrowserClientType | undefined;
}

export const getBrowserClient = (): BrowserClientType => {
  if (typeof window === 'undefined') {
    throw new Error('getBrowserClient can only be called in the browser');
  }
  
  // Check if we already have a client in global scope
  if (globalThis.__SUPABASE_BROWSER_CLIENT__) {
    return globalThis.__SUPABASE_BROWSER_CLIENT__;
  }
  
  // Create new client and store in global scope
  const client = createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey);
  globalThis.__SUPABASE_BROWSER_CLIENT__ = client;
  
  return client;
};

// Legacy alias for backward compatibility
export const createBrowserClient = getBrowserClient;

// Default client for server-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);