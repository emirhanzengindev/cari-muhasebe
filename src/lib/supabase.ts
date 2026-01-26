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

// Create browser client for Next.js App Router
export const createBrowserClient = () => {
  if (typeof window === 'undefined') {
    throw new Error('createBrowserClient can only be called in the browser');
  }
  return createSupabaseBrowserClient(supabaseUrl, supabaseAnonKey);
};

// Default client for server-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey);