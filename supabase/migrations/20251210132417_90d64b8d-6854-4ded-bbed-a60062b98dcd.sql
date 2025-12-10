-- Allow match participants to update match state (not just creator)
DROP POLICY IF EXISTS "Match creator can update" ON public.matches;

CREATE POLICY "Match participants can update"
ON public.matches
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT p.user_id FROM profiles p WHERE p.id = matches.creator_id
  )
  OR
  auth.uid() IN (
    SELECT p.user_id FROM profiles p 
    JOIN match_players mp ON mp.player_id = p.id 
    WHERE mp.match_id = matches.id
  )
);