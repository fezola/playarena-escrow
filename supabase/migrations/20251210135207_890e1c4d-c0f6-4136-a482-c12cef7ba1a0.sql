-- Add base_balance and usdt_balance columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS base_balance numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS usdt_balance numeric DEFAULT 0;

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.wallet_balance IS 'USDC balance on Base network';
COMMENT ON COLUMN public.profiles.base_balance IS 'Native ETH/BASE balance on Base network';
COMMENT ON COLUMN public.profiles.usdt_balance IS 'USDT balance on Base network';