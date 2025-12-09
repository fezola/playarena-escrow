-- Add new columns to existing profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS wallet_balance DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0;

-- Create friends table
CREATE TABLE IF NOT EXISTS public.friends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  friend_id UUID NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, friend_id)
);

ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own friends" 
ON public.friends FOR SELECT 
USING (
  auth.uid() IN (
    SELECT p.user_id FROM profiles p WHERE p.id = friends.user_id
    UNION
    SELECT p.user_id FROM profiles p WHERE p.id = friends.friend_id
  )
);

CREATE POLICY "Users can send friend requests" 
ON public.friends FOR INSERT 
WITH CHECK (auth.uid() IN (SELECT p.user_id FROM profiles p WHERE p.id = friends.user_id));

CREATE POLICY "Users can update friend status" 
ON public.friends FOR UPDATE 
USING (auth.uid() IN (
  SELECT p.user_id FROM profiles p WHERE p.id = friends.user_id
  UNION
  SELECT p.user_id FROM profiles p WHERE p.id = friends.friend_id
));

-- Create game_invites table for link sharing
CREATE TABLE IF NOT EXISTS public.game_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_by UUID NOT NULL,
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  used_by UUID,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.game_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view invites" 
ON public.game_invites FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create invites" 
ON public.game_invites FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can use invites" 
ON public.game_invites FOR UPDATE USING (true);

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url'
  );
  RETURN NEW;
END;
$$;

-- Create trigger if not exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();