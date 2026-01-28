-- EMERGENCY PostgREST Restart Command
-- This is the definitive solution when schema cache issues persist
-- Execute via Supabase Dashboard: Settings → API → Restart REST Service

-- Alternative SQL approach if dashboard restart isn't available:
-- This forces complete PostgREST service restart
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE application_name LIKE '%postgrest%';

-- Note: The above should only be used in development environments
-- Production restart should be done via Supabase Dashboard