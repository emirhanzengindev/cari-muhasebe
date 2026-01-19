import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

if (!supabaseUrl) {
  throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined');
}

if (!supabaseAnonKey) {
  throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not defined');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const createBrowserClient = () => {
  if (typeof window === 'undefined') {
    throw new Error('createBrowserClient can only be called in the browser');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};