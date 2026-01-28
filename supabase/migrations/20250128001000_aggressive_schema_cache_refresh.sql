-- AGGRESSIVE PostgREST schema cache refresh
-- This forces immediate cache invalidation and rebuild

-- Method 1: Touch the table to force cache refresh
ALTER TABLE public.current_accounts ALTER COLUMN updated_at SET DEFAULT NOW();

-- Method 2: Add and immediately drop a dummy column (forces complete schema reload)
ALTER TABLE public.current_accounts ADD COLUMN temp_cache_refresh BOOLEAN DEFAULT FALSE;
ALTER TABLE public.current_accounts DROP COLUMN temp_cache_refresh;

-- Method 3: Update table statistics to trigger cache refresh
ANALYZE public.current_accounts;

-- Method 4: Comment change to ensure cache recognizes all columns
COMMENT ON TABLE public.current_accounts IS 'Schema cache refreshed - contains all columns including address';