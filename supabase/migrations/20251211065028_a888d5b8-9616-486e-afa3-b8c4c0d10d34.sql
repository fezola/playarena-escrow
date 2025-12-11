-- Add sports-prediction to game_type enum
ALTER TYPE public.game_type ADD VALUE IF NOT EXISTS 'sports-prediction';

-- Create sports matches table (tracks real sports events)
CREATE TABLE public.sports_matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  external_id text NOT NULL UNIQUE,
  sport text NOT NULL,
  league text NOT NULL,
  home_team text NOT NULL,
  away_team text NOT NULL,
  home_logo text,
  away_logo text,
  match_date timestamp with time zone NOT NULL,
  status text NOT NULL DEFAULT 'scheduled',
  home_score integer,
  away_score integer,
  is_live boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create prediction pools table (the betting pool for a sports match)
CREATE TABLE public.prediction_pools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sports_match_id uuid REFERENCES public.sports_matches(id) ON DELETE CASCADE NOT NULL,
  creator_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  prediction_type text NOT NULL DEFAULT 'exact_score',
  min_stake numeric NOT NULL DEFAULT 5,
  max_stake numeric,
  currency text NOT NULL DEFAULT 'USDC',
  total_pot numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  settled_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create individual predictions table
CREATE TABLE public.predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pool_id uuid REFERENCES public.prediction_pools(id) ON DELETE CASCADE NOT NULL,
  player_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  stake_amount numeric NOT NULL,
  predicted_home_score integer NOT NULL,
  predicted_away_score integer NOT NULL,
  accuracy_score numeric,
  payout_amount numeric,
  is_winner boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.sports_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prediction_pools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sports_matches (public read)
CREATE POLICY "Anyone can view sports matches"
ON public.sports_matches FOR SELECT
USING (true);

-- RLS Policies for prediction_pools
CREATE POLICY "Anyone can view prediction pools"
ON public.prediction_pools FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can create pools"
ON public.prediction_pools FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Pool participants can update"
ON public.prediction_pools FOR UPDATE
USING (auth.uid() IN (
  SELECT p.user_id FROM profiles p WHERE p.id = prediction_pools.creator_id
));

-- RLS Policies for predictions
CREATE POLICY "Users can view all predictions in pools they joined"
ON public.predictions FOR SELECT
USING (true);

CREATE POLICY "Users can create predictions"
ON public.predictions FOR INSERT
WITH CHECK (auth.uid() IN (SELECT p.user_id FROM profiles p WHERE p.id = predictions.player_id));

-- Add trigger for updated_at
CREATE TRIGGER update_sports_matches_updated_at
BEFORE UPDATE ON public.sports_matches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_prediction_pools_updated_at
BEFORE UPDATE ON public.prediction_pools
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to settle prediction pool with proportional payouts
CREATE OR REPLACE FUNCTION public.settle_prediction_pool(
  _pool_id uuid,
  _home_score integer,
  _away_score integer
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _prediction RECORD;
  _total_accuracy numeric := 0;
  _platform_fee_percent numeric;
  _platform_fee numeric;
  _distributable numeric;
  _pool_total numeric;
  _payout numeric;
BEGIN
  -- Get platform fee
  SELECT COALESCE(setting_value::numeric, 5) INTO _platform_fee_percent
  FROM platform_settings WHERE setting_key = 'platform_fee_percent';

  -- Get pool total
  SELECT total_pot INTO _pool_total FROM prediction_pools WHERE id = _pool_id;
  
  IF _pool_total = 0 THEN
    RETURN json_build_object('success', false, 'error', 'No funds in pool');
  END IF;

  -- Calculate accuracy for each prediction (inverse of distance)
  -- Accuracy = 1 / (1 + abs(pred_home - actual_home) + abs(pred_away - actual_away))
  FOR _prediction IN 
    SELECT * FROM predictions WHERE pool_id = _pool_id
  LOOP
    UPDATE predictions 
    SET accuracy_score = 1.0 / (1.0 + ABS(_prediction.predicted_home_score - _home_score) + ABS(_prediction.predicted_away_score - _away_score))
    WHERE id = _prediction.id;
  END LOOP;

  -- Get total accuracy sum
  SELECT COALESCE(SUM(accuracy_score), 0) INTO _total_accuracy
  FROM predictions WHERE pool_id = _pool_id;

  IF _total_accuracy = 0 THEN
    -- Refund everyone if no accuracy
    FOR _prediction IN SELECT * FROM predictions WHERE pool_id = _pool_id LOOP
      UPDATE profiles SET wallet_balance = COALESCE(wallet_balance, 0) + _prediction.stake_amount
      WHERE id = _prediction.player_id;
    END LOOP;
    UPDATE prediction_pools SET status = 'settled', settled_at = now() WHERE id = _pool_id;
    RETURN json_build_object('success', true, 'refunded', true);
  END IF;

  -- Calculate platform fee and distributable amount
  _platform_fee := _pool_total * (_platform_fee_percent / 100);
  _distributable := _pool_total - _platform_fee;

  -- Distribute proportionally based on accuracy
  FOR _prediction IN 
    SELECT * FROM predictions WHERE pool_id = _pool_id
  LOOP
    _payout := _distributable * (_prediction.accuracy_score / _total_accuracy);
    
    -- Mark exact predictions as winners
    UPDATE predictions 
    SET payout_amount = _payout,
        is_winner = (_prediction.predicted_home_score = _home_score AND _prediction.predicted_away_score = _away_score)
    WHERE id = _prediction.id;
    
    -- Credit payout
    UPDATE profiles 
    SET wallet_balance = COALESCE(wallet_balance, 0) + _payout,
        total_earnings = COALESCE(total_earnings, 0) + GREATEST(_payout - _prediction.stake_amount, 0)
    WHERE id = _prediction.player_id;
    
    -- Record transaction
    INSERT INTO transactions (user_id, amount, tx_type, status, confirmed_at)
    VALUES (_prediction.player_id, _payout, 'prediction_payout', 'confirmed', now());
  END LOOP;

  -- Update pool status
  UPDATE prediction_pools SET status = 'settled', settled_at = now() WHERE id = _pool_id;

  RETURN json_build_object(
    'success', true,
    'total_pot', _pool_total,
    'platform_fee', _platform_fee,
    'distributed', _distributable
  );
END;
$$;