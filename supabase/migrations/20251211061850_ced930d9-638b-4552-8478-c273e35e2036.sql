-- Fix escrow table RLS to allow authenticated users to insert
-- The current policy only allows viewing, not inserting

-- Drop the existing restrictive policy if any
DROP POLICY IF EXISTS "Users can insert escrow" ON public.escrow;

-- Create policy to allow authenticated users to insert escrow for themselves
CREATE POLICY "Users can insert escrow for themselves" 
ON public.escrow 
FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT p.user_id FROM profiles p WHERE p.id = player_id
  )
);

-- Also add update policy for the system to release escrow
DROP POLICY IF EXISTS "System can update escrow" ON public.escrow;
CREATE POLICY "Match participants can view escrow status"
ON public.escrow
FOR UPDATE
USING (
  auth.uid() IN (
    SELECT p.user_id FROM profiles p 
    JOIN match_players mp ON mp.player_id = p.id 
    WHERE mp.match_id = escrow.match_id
  )
);