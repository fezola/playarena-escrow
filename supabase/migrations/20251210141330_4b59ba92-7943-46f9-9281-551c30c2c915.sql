-- Create match_chat table for in-game messaging
CREATE TABLE public.match_chat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.match_chat ENABLE ROW LEVEL SECURITY;

-- Players in the match can view all messages
CREATE POLICY "Match participants can view chat messages"
ON public.match_chat
FOR SELECT
USING (
  auth.uid() IN (
    SELECT p.user_id FROM profiles p
    JOIN match_players mp ON mp.player_id = p.id
    WHERE mp.match_id = match_chat.match_id
  )
);

-- Players in the match can send messages
CREATE POLICY "Match participants can send chat messages"
ON public.match_chat
FOR INSERT
WITH CHECK (
  auth.uid() IN (
    SELECT p.user_id FROM profiles p
    JOIN match_players mp ON mp.player_id = p.id
    WHERE mp.match_id = match_chat.match_id
  )
  AND auth.uid() IN (
    SELECT p.user_id FROM profiles p WHERE p.id = match_chat.player_id
  )
);

-- Enable realtime for chat messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_chat;