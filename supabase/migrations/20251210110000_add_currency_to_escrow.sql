-- Add currency tracking to escrow table
ALTER TABLE public.escrow
ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'USDC' CHECK (currency IN ('BASE', 'USDC', 'USDT'));

-- Update existing escrow records to have USDC as currency
UPDATE public.escrow SET currency = 'USDC' WHERE currency IS NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_escrow_currency ON public.escrow(currency);

-- Add comment
COMMENT ON COLUMN public.escrow.currency IS 'Currency of the escrowed amount (BASE, USDC, or USDT)';

