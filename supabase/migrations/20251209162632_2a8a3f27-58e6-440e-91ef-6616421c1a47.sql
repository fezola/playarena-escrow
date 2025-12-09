-- =============================================
-- PlayArena Gaming Platform Database Schema
-- =============================================

-- Enum for game types
CREATE TYPE public.game_type AS ENUM ('tic-tac-toe', 'chess', 'scrabble');

-- Enum for match states
CREATE TYPE public.match_state AS ENUM ('waiting', 'depositing', 'active', 'complete', 'cancelled');

-- =============================================
-- 1. Profiles Table
-- =============================================
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  wallet_address TEXT,
  display_name TEXT,
  avatar_url TEXT,
  total_wins INTEGER NOT NULL DEFAULT 0,
  total_losses INTEGER NOT NULL DEFAULT 0,
  total_earnings DECIMAL(18, 6) NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. Matches Table
-- =============================================
CREATE TABLE public.matches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_type public.game_type NOT NULL,
  stake_amount DECIMAL(18, 6) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USDC',
  players_required INTEGER NOT NULL DEFAULT 2,
  rounds INTEGER NOT NULL DEFAULT 1,
  current_round INTEGER NOT NULL DEFAULT 0,
  state public.match_state NOT NULL DEFAULT 'waiting',
  winner_id UUID REFERENCES public.profiles(id),
  contract_match_id TEXT,
  creator_id UUID NOT NULL REFERENCES public.profiles(id),
  game_state JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 3. Match Players Table
-- =============================================
CREATE TABLE public.match_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  player_symbol TEXT,
  has_deposited BOOLEAN NOT NULL DEFAULT false,
  deposit_tx_hash TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(match_id, player_id)
);

ALTER TABLE public.match_players ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. Moves Table
-- =============================================
CREATE TABLE public.moves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id),
  round_number INTEGER NOT NULL,
  move_data JSONB NOT NULL,
  move_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.moves ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 5. Transactions Table
-- =============================================
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  match_id UUID REFERENCES public.matches(id) ON DELETE SET NULL,
  tx_type TEXT NOT NULL CHECK (tx_type IN ('deposit', 'withdrawal', 'payout', 'refund')),
  amount DECIMAL(18, 6) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USDC',
  tx_hash TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies (after all tables created)
-- =============================================

-- Profiles policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- Matches policies
CREATE POLICY "Matches are viewable by everyone" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create matches" ON public.matches FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Match creator can update" ON public.matches FOR UPDATE
  USING (auth.uid() IN (SELECT p.user_id FROM public.profiles p WHERE p.id = creator_id));

-- Match players policies
CREATE POLICY "Match players are viewable by everyone" ON public.match_players FOR SELECT USING (true);
CREATE POLICY "Authenticated users can join matches" ON public.match_players FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = player_id));
CREATE POLICY "Players can update their own entry" ON public.match_players FOR UPDATE
  USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = player_id));

-- Moves policies
CREATE POLICY "Moves are viewable by everyone" ON public.moves FOR SELECT USING (true);
CREATE POLICY "Match participants can create moves" ON public.moves FOR INSERT
  WITH CHECK (auth.uid() IN (
    SELECT p.user_id FROM public.profiles p
    JOIN public.match_players mp ON mp.player_id = p.id
    WHERE mp.match_id = moves.match_id
  ));

-- Transactions policies
CREATE POLICY "Users can view their own transactions" ON public.transactions FOR SELECT
  USING (auth.uid() IN (SELECT p.user_id FROM public.profiles p WHERE p.id = user_id));
CREATE POLICY "Users can create their own transactions" ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() IN (SELECT p.user_id FROM public.profiles p WHERE p.id = user_id));

-- =============================================
-- Indexes
-- =============================================
CREATE INDEX idx_matches_state ON public.matches(state);
CREATE INDEX idx_matches_game_type ON public.matches(game_type);
CREATE INDEX idx_matches_creator ON public.matches(creator_id);
CREATE INDEX idx_match_players_match ON public.match_players(match_id);
CREATE INDEX idx_match_players_player ON public.match_players(player_id);
CREATE INDEX idx_moves_match ON public.moves(match_id);
CREATE INDEX idx_transactions_user ON public.transactions(user_id);

-- =============================================
-- Triggers
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', 'Player'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_players;
ALTER PUBLICATION supabase_realtime ADD TABLE public.moves;