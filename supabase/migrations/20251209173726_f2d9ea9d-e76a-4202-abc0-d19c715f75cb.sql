-- Create escrow table to hold match stakes
CREATE TABLE public.escrow (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USDC',
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held', 'released', 'refunded', 'forfeited')),
  released_to UUID REFERENCES public.profiles(id),
  released_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(match_id, player_id)
);

-- Enable RLS
ALTER TABLE public.escrow ENABLE ROW LEVEL SECURITY;

-- Policies for escrow table
CREATE POLICY "Users can view escrow for their matches"
ON public.escrow
FOR SELECT
USING (
  auth.uid() IN (
    SELECT p.user_id FROM profiles p WHERE p.id = escrow.player_id
  )
  OR
  auth.uid() IN (
    SELECT p.user_id FROM profiles p 
    JOIN match_players mp ON mp.player_id = p.id 
    WHERE mp.match_id = escrow.match_id
  )
);

-- Platform settings table for configurable fee
CREATE TABLE public.platform_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default platform fee (5%)
INSERT INTO public.platform_settings (setting_key, setting_value) 
VALUES ('platform_fee_percent', '5');

-- Enable RLS on platform_settings (read-only for everyone)
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view platform settings"
ON public.platform_settings
FOR SELECT
USING (true);

-- Create function to release escrow to winner
CREATE OR REPLACE FUNCTION public.release_escrow_to_winner(
  _match_id UUID,
  _winner_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _total_pot NUMERIC;
  _platform_fee_percent NUMERIC;
  _platform_fee NUMERIC;
  _winner_payout NUMERIC;
  _escrow_record RECORD;
BEGIN
  -- Get platform fee percentage
  SELECT COALESCE(setting_value::NUMERIC, 5) INTO _platform_fee_percent
  FROM platform_settings WHERE setting_key = 'platform_fee_percent';

  -- Calculate total pot from escrow
  SELECT COALESCE(SUM(amount), 0) INTO _total_pot
  FROM escrow
  WHERE match_id = _match_id AND status = 'held';

  IF _total_pot = 0 THEN
    RETURN json_build_object('success', false, 'error', 'No funds in escrow');
  END IF;

  -- Calculate fee and payout
  _platform_fee := _total_pot * (_platform_fee_percent / 100);
  _winner_payout := _total_pot - _platform_fee;

  -- Update escrow records to released
  UPDATE escrow
  SET status = 'released',
      released_to = _winner_id,
      released_at = now()
  WHERE match_id = _match_id AND status = 'held';

  -- Add winnings to winner's wallet
  UPDATE profiles
  SET wallet_balance = COALESCE(wallet_balance, 0) + _winner_payout,
      total_earnings = COALESCE(total_earnings, 0) + _winner_payout,
      total_wins = COALESCE(total_wins, 0) + 1,
      current_streak = COALESCE(current_streak, 0) + 1
  WHERE id = _winner_id;

  -- Update loser stats
  UPDATE profiles
  SET total_losses = COALESCE(total_losses, 0) + 1,
      current_streak = 0
  WHERE id IN (
    SELECT player_id FROM match_players 
    WHERE match_id = _match_id AND player_id != _winner_id
  );

  -- Record transaction for winner
  INSERT INTO transactions (user_id, amount, tx_type, status, confirmed_at, match_id)
  VALUES (_winner_id, _winner_payout, 'winnings', 'confirmed', now(), _match_id);

  -- Record platform fee transaction (if we track platform revenue)
  IF _platform_fee > 0 THEN
    INSERT INTO transactions (user_id, amount, tx_type, status, confirmed_at, match_id)
    VALUES (_winner_id, _platform_fee, 'platform_fee', 'confirmed', now(), _match_id);
  END IF;

  RETURN json_build_object(
    'success', true,
    'total_pot', _total_pot,
    'platform_fee', _platform_fee,
    'winner_payout', _winner_payout
  );
END;
$$;

-- Create function to refund escrow (for draws or cancellations)
CREATE OR REPLACE FUNCTION public.refund_escrow(
  _match_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _escrow_record RECORD;
  _total_refunded NUMERIC := 0;
BEGIN
  -- Loop through all held escrow for this match
  FOR _escrow_record IN 
    SELECT * FROM escrow WHERE match_id = _match_id AND status = 'held'
  LOOP
    -- Refund to player
    UPDATE profiles
    SET wallet_balance = COALESCE(wallet_balance, 0) + _escrow_record.amount
    WHERE id = _escrow_record.player_id;

    -- Update escrow status
    UPDATE escrow
    SET status = 'refunded',
        released_to = _escrow_record.player_id,
        released_at = now()
    WHERE id = _escrow_record.id;

    -- Record transaction
    INSERT INTO transactions (user_id, amount, tx_type, status, confirmed_at, match_id)
    VALUES (_escrow_record.player_id, _escrow_record.amount, 'refund', 'confirmed', now(), _match_id);

    _total_refunded := _total_refunded + _escrow_record.amount;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'total_refunded', _total_refunded
  );
END;
$$;