
-- Add skill scoring columns to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS skill_score numeric NOT NULL DEFAULT 1000,
ADD COLUMN IF NOT EXISTS win_rate numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS volatility_score numeric NOT NULL DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS consistency_index numeric NOT NULL DEFAULT 0.5,
ADD COLUMN IF NOT EXISTS risk_tier text NOT NULL DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS total_matches_played integer NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_stake numeric NOT NULL DEFAULT 0;

-- Create skill history table for audit trail and anti-manipulation
CREATE TABLE public.skill_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id uuid NOT NULL REFERENCES public.profiles(id),
  match_id uuid NOT NULL REFERENCES public.matches(id),
  skill_before numeric NOT NULL,
  skill_after numeric NOT NULL,
  skill_delta numeric NOT NULL,
  volatility_before numeric NOT NULL,
  volatility_after numeric NOT NULL,
  opponent_skill numeric NOT NULL,
  match_result text NOT NULL, -- 'win', 'loss', 'draw'
  game_type text NOT NULL,
  stake_amount numeric NOT NULL,
  payout_amount numeric NOT NULL DEFAULT 0,
  risk_tier_before text NOT NULL,
  risk_tier_after text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS on skill_history
ALTER TABLE public.skill_history ENABLE ROW LEVEL SECURITY;

-- Everyone can view skill history (public leaderboard transparency)
CREATE POLICY "Skill history viewable by everyone"
ON public.skill_history FOR SELECT
USING (true);

-- Only system (via security definer functions) can insert
CREATE POLICY "System can insert skill history"
ON public.skill_history FOR INSERT
WITH CHECK (false);

-- Enable realtime for skill_history
ALTER PUBLICATION supabase_realtime ADD TABLE public.skill_history;

-- Create match_settlement_log for atomic settlement audit
CREATE TABLE public.match_settlement_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id uuid NOT NULL REFERENCES public.matches(id) UNIQUE,
  settled_by text NOT NULL DEFAULT 'system',
  total_pot numeric NOT NULL,
  platform_fee numeric NOT NULL,
  settlement_data jsonb NOT NULL, -- full breakdown of payouts per player
  skill_updates jsonb NOT NULL, -- skill deltas for each player
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.match_settlement_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Settlement logs viewable by everyone"
ON public.match_settlement_log FOR SELECT
USING (true);

CREATE POLICY "System can insert settlement logs"
ON public.match_settlement_log FOR INSERT
WITH CHECK (false);

-- Create the atomic settlement function
CREATE OR REPLACE FUNCTION public.settle_match_with_skill(
  _match_id uuid,
  _winner_id uuid,
  _settlement_data jsonb,
  _skill_updates jsonb
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _total_pot numeric;
  _platform_fee_percent numeric;
  _platform_fee numeric;
  _player_record jsonb;
  _skill_record jsonb;
  _player_id uuid;
  _payout numeric;
  _skill_before numeric;
  _skill_after numeric;
  _volatility_before numeric;
  _volatility_after numeric;
  _risk_tier_before text;
  _risk_tier_after text;
  _opponent_skill numeric;
  _match_result text;
  _game_type text;
  _stake_amount numeric;
  _match record;
BEGIN
  -- Check if already settled
  IF EXISTS (SELECT 1 FROM match_settlement_log WHERE match_id = _match_id) THEN
    RETURN json_build_object('success', false, 'error', 'Match already settled');
  END IF;

  -- Get match info
  SELECT * INTO _match FROM matches WHERE id = _match_id;
  IF _match IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Match not found');
  END IF;
  IF _match.state = 'complete' THEN
    RETURN json_build_object('success', false, 'error', 'Match already complete');
  END IF;

  _game_type := _match.game_type::text;

  -- Get platform fee
  SELECT COALESCE(setting_value::numeric, 5) INTO _platform_fee_percent
  FROM platform_settings WHERE setting_key = 'platform_fee_percent';

  -- Calculate total pot
  SELECT COALESCE(SUM(amount), 0) INTO _total_pot
  FROM escrow WHERE match_id = _match_id AND status = 'held';

  IF _total_pot = 0 THEN
    RETURN json_build_object('success', false, 'error', 'No funds in escrow');
  END IF;

  _platform_fee := _total_pot * (_platform_fee_percent / 100);

  -- Process each player's payout from settlement_data
  FOR _player_record IN SELECT * FROM jsonb_array_elements(_settlement_data)
  LOOP
    _player_id := (_player_record->>'player_id')::uuid;
    _payout := (_player_record->>'payout')::numeric;

    IF _payout > 0 THEN
      -- Credit player wallet
      UPDATE profiles
      SET wallet_balance = COALESCE(wallet_balance, 0) + _payout,
          total_earnings = COALESCE(total_earnings, 0) + _payout
      WHERE id = _player_id;

      -- Record payout transaction
      INSERT INTO transactions (user_id, amount, tx_type, status, confirmed_at, match_id)
      VALUES (_player_id, _payout, 'skill_weighted_payout', 'confirmed', now(), _match_id);
    END IF;
  END LOOP;

  -- Process skill updates
  FOR _skill_record IN SELECT * FROM jsonb_array_elements(_skill_updates)
  LOOP
    _player_id := (_skill_record->>'player_id')::uuid;
    _skill_before := (_skill_record->>'skill_before')::numeric;
    _skill_after := (_skill_record->>'skill_after')::numeric;
    _volatility_before := (_skill_record->>'volatility_before')::numeric;
    _volatility_after := (_skill_record->>'volatility_after')::numeric;
    _risk_tier_before := _skill_record->>'risk_tier_before';
    _risk_tier_after := _skill_record->>'risk_tier_after';
    _opponent_skill := (_skill_record->>'opponent_skill')::numeric;
    _match_result := _skill_record->>'match_result';
    _stake_amount := COALESCE((_skill_record->>'stake_amount')::numeric, 0);
    _payout := COALESCE((_skill_record->>'payout_amount')::numeric, 0);

    -- Update player profile
    UPDATE profiles
    SET skill_score = _skill_after,
        volatility_score = _volatility_after,
        risk_tier = _risk_tier_after,
        total_matches_played = COALESCE(total_matches_played, 0) + 1,
        win_rate = CASE 
          WHEN COALESCE(total_matches_played, 0) + 1 > 0 
          THEN (COALESCE(total_wins, 0) + CASE WHEN _match_result = 'win' THEN 1 ELSE 0 END)::numeric 
               / (COALESCE(total_matches_played, 0) + 1)::numeric
          ELSE 0
        END,
        total_wins = CASE WHEN _match_result = 'win' THEN COALESCE(total_wins, 0) + 1 ELSE total_wins END,
        total_losses = CASE WHEN _match_result = 'loss' THEN COALESCE(total_losses, 0) + 1 ELSE total_losses END,
        current_streak = CASE 
          WHEN _match_result = 'win' THEN COALESCE(current_streak, 0) + 1 
          ELSE 0 
        END
    WHERE id = _player_id;

    -- Insert skill history (bypass RLS via SECURITY DEFINER)
    INSERT INTO skill_history (
      player_id, match_id, skill_before, skill_after, skill_delta,
      volatility_before, volatility_after, opponent_skill,
      match_result, game_type, stake_amount, payout_amount,
      risk_tier_before, risk_tier_after
    ) VALUES (
      _player_id, _match_id, _skill_before, _skill_after, _skill_after - _skill_before,
      _volatility_before, _volatility_after, _opponent_skill,
      _match_result, _game_type, _stake_amount, _payout,
      _risk_tier_before, _risk_tier_after
    );
  END LOOP;

  -- Update escrow to released
  UPDATE escrow
  SET status = 'released', released_to = _winner_id, released_at = now()
  WHERE match_id = _match_id AND status = 'held';

  -- Update match to complete
  UPDATE matches
  SET state = 'complete', winner_id = _winner_id, ended_at = now()
  WHERE id = _match_id;

  -- Insert settlement log
  INSERT INTO match_settlement_log (match_id, total_pot, platform_fee, settlement_data, skill_updates)
  VALUES (_match_id, _total_pot, _platform_fee, _settlement_data, _skill_updates);

  RETURN json_build_object(
    'success', true,
    'total_pot', _total_pot,
    'platform_fee', _platform_fee,
    'winner_id', _winner_id
  );
END;
$$;
