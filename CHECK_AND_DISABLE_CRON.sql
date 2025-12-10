-- =============================================
-- CHECK AND DISABLE CRON JOBS
-- =============================================
-- This script checks for any scheduled cron jobs that might be calling
-- Edge Functions and causing 404 errors

-- 1. Check if pg_cron extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- 2. List all scheduled cron jobs
SELECT * FROM cron.job;

-- 3. View recent cron job runs
SELECT * FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 20;

-- 4. DISABLE ALL CRON JOBS (uncomment to execute)
-- This will stop any automatic calls to Edge Functions

-- Unschedule deposit monitoring if it exists
SELECT cron.unschedule('check-deposits-every-minute');
SELECT cron.unschedule('check-deposits');
SELECT cron.unschedule('check-deposits-mainnet');
SELECT cron.unschedule('monitor-deposits');

-- List all jobs again to confirm they're removed
SELECT * FROM cron.job;

-- =============================================
-- RESULT
-- =============================================
-- If you see any jobs listed, they are calling Edge Functions
-- and causing 404 errors. The unschedule commands above will
-- remove them.

