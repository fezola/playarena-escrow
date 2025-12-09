-- Update the handle_new_user function to auto-generate a wallet address
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, avatar_url, wallet_address)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data ->> 'avatar_url',
    'PA-' || UPPER(SUBSTRING(NEW.id::text, 1, 8))
  );
  RETURN NEW;
END;
$$;

-- Update existing profiles that don't have wallet addresses
UPDATE public.profiles 
SET wallet_address = 'PA-' || UPPER(SUBSTRING(user_id::text, 1, 8))
WHERE wallet_address IS NULL;