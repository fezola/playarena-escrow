-- Add multi-token support to profiles
-- Users can now hold BASE (native token), USDC, and USDT

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS base_balance DECIMAL(18, 6) DEFAULT 0,
ADD COLUMN IF NOT EXISTS usdt_balance DECIMAL(18, 6) DEFAULT 0;

-- wallet_balance will continue to work as USDC balance for backward compatibility

-- Add currency to matches table
ALTER TABLE public.matches
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USDC' CHECK (currency IN ('BASE', 'USDC', 'USDT'));

-- Update existing matches to have USDC as currency
UPDATE public.matches SET currency = 'USDC' WHERE currency IS NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_base_balance ON public.profiles(base_balance);
CREATE INDEX IF NOT EXISTS idx_profiles_usdt_balance ON public.profiles(usdt_balance);
CREATE INDEX IF NOT EXISTS idx_matches_currency ON public.matches(currency);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.wallet_balance IS 'USDC balance (for backward compatibility)';
COMMENT ON COLUMN public.profiles.base_balance IS 'BASE (native token) balance';
COMMENT ON COLUMN public.profiles.usdt_balance IS 'USDT balance';
COMMENT ON COLUMN public.matches.currency IS 'Currency used for match stakes (BASE, USDC, or USDT)';

