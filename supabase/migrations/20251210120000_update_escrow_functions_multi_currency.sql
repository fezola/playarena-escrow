-- Update release_escrow_to_winner function to handle multiple currencies
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
  _match_currency TEXT;
BEGIN
  -- Get platform fee percentage
  SELECT COALESCE(setting_value::NUMERIC, 5) INTO _platform_fee_percent
  FROM platform_settings WHERE setting_key = 'platform_fee_percent';

  -- Get match currency
  SELECT currency INTO _match_currency
  FROM matches WHERE id = _match_id;

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

  -- Add winnings to winner's wallet (correct currency balance)
  UPDATE profiles
  SET 
    wallet_balance = CASE WHEN _match_currency = 'USDC' THEN COALESCE(wallet_balance, 0) + _winner_payout ELSE wallet_balance END,
    base_balance = CASE WHEN _match_currency = 'BASE' THEN COALESCE(base_balance, 0) + _winner_payout ELSE base_balance END,
    usdt_balance = CASE WHEN _match_currency = 'USDT' THEN COALESCE(usdt_balance, 0) + _winner_payout ELSE usdt_balance END,
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
  INSERT INTO transactions (user_id, amount, tx_type, status, confirmed_at, match_id, currency)
  VALUES (_winner_id, _winner_payout, 'winnings', 'confirmed', now(), _match_id, _match_currency);

  -- Record platform fee transaction
  IF _platform_fee > 0 THEN
    INSERT INTO transactions (user_id, amount, tx_type, status, confirmed_at, match_id, currency)
    VALUES (_winner_id, _platform_fee, 'platform_fee', 'confirmed', now(), _match_id, _match_currency);
  END IF;

  RETURN json_build_object(
    'success', true,
    'total_pot', _total_pot,
    'platform_fee', _platform_fee,
    'winner_payout', _winner_payout,
    'currency', _match_currency
  );
END;
$$;

-- Update refund_escrow function to handle multiple currencies
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
  _match_currency TEXT;
BEGIN
  -- Get match currency
  SELECT currency INTO _match_currency
  FROM matches WHERE id = _match_id;

  -- Loop through all held escrow for this match
  FOR _escrow_record IN 
    SELECT * FROM escrow WHERE match_id = _match_id AND status = 'held'
  LOOP
    -- Refund to player (correct currency balance)
    UPDATE profiles
    SET 
      wallet_balance = CASE WHEN _match_currency = 'USDC' THEN COALESCE(wallet_balance, 0) + _escrow_record.amount ELSE wallet_balance END,
      base_balance = CASE WHEN _match_currency = 'BASE' THEN COALESCE(base_balance, 0) + _escrow_record.amount ELSE base_balance END,
      usdt_balance = CASE WHEN _match_currency = 'USDT' THEN COALESCE(usdt_balance, 0) + _escrow_record.amount ELSE usdt_balance END
    WHERE id = _escrow_record.player_id;

    -- Update escrow status
    UPDATE escrow
    SET status = 'refunded',
        released_to = _escrow_record.player_id,
        released_at = now()
    WHERE id = _escrow_record.id;

    -- Record transaction
    INSERT INTO transactions (user_id, amount, tx_type, status, confirmed_at, match_id, currency)
    VALUES (_escrow_record.player_id, _escrow_record.amount, 'refund', 'confirmed', now(), _match_id, _match_currency);

    _total_refunded := _total_refunded + _escrow_record.amount;
  END LOOP;

  RETURN json_build_object(
    'success', true,
    'total_refunded', _total_refunded,
    'currency', _match_currency
  );
END;
$$;

