-- POSTGREST SCHEMA CACHE REFRESH - DEFinitIVE SOLUTION
-- Execute this in Supabase SQL Editor to force immediate cache refresh

COMMENT ON TABLE public.current_accounts IS 'refresh postgrest cache';

-- This single command triggers PostgREST to re-read the complete table schema
-- Wait 10-20 seconds after execution before testing