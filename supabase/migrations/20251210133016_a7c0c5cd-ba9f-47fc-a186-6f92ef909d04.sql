-- Add new game types to the enum
ALTER TYPE public.game_type ADD VALUE IF NOT EXISTS 'connect-four';
ALTER TYPE public.game_type ADD VALUE IF NOT EXISTS 'rock-paper-scissors';
ALTER TYPE public.game_type ADD VALUE IF NOT EXISTS 'wordle';
ALTER TYPE public.game_type ADD VALUE IF NOT EXISTS 'checkers';
ALTER TYPE public.game_type ADD VALUE IF NOT EXISTS 'dots-and-boxes';
ALTER TYPE public.game_type ADD VALUE IF NOT EXISTS 'boggle';
ALTER TYPE public.game_type ADD VALUE IF NOT EXISTS 'pool';
ALTER TYPE public.game_type ADD VALUE IF NOT EXISTS 'ping-pong';
ALTER TYPE public.game_type ADD VALUE IF NOT EXISTS 'battleship';
ALTER TYPE public.game_type ADD VALUE IF NOT EXISTS 'trivia';