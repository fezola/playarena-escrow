-- Enable pg_cron extension for scheduled jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a function to call the deposit monitoring edge function
CREATE OR REPLACE FUNCTION public.trigger_deposit_monitoring()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  supabase_url text;
  service_key text;
BEGIN
  -- Get Supabase URL from environment (you'll need to set this)
  -- For now, this is a placeholder - you'll configure the actual cron job in Supabase dashboard
  
  -- This function is a placeholder for documentation
  -- The actual cron job should be set up via Supabase dashboard or external service
  
  RAISE NOTICE 'Deposit monitoring should be triggered via external cron or Supabase cron';
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.trigger_deposit_monitoring() TO service_role;

-- Note: To set up the actual cron job, run this in your Supabase SQL editor:
-- 
-- SELECT cron.schedule(
--   'check-deposits-every-minute',
--   '* * * * *',
--   $$
--   SELECT net.http_post(
--     url := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/monitor-deposits',
--     headers := jsonb_build_object(
--       'Authorization', 'Bearer YOUR_SERVICE_ROLE_KEY',
--       'Content-Type', 'application/json'
--     )
--   );
--   $$
-- );
--
-- Replace YOUR_PROJECT_REF and YOUR_SERVICE_ROLE_KEY with your actual values

-- To view scheduled jobs:
-- SELECT * FROM cron.job;

-- To unschedule a job:
-- SELECT cron.unschedule('check-deposits-every-minute');

