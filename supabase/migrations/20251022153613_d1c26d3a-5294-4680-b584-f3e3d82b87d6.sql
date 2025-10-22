-- Add banned status to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT false;

-- Update profiles RLS to prevent banned users from doing anything
CREATE POLICY "Banned users cannot update profiles"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id AND banned = false);

-- Allow admins to view all profiles and update ban status
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Prevent banned users from uploading images
CREATE POLICY "Banned users cannot upload images"
ON public.images
FOR INSERT
WITH CHECK (
  auth.uid() = seller_id 
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND banned = true
  )
);

-- Prevent banned users from creating likes
CREATE POLICY "Banned users cannot like"
ON public.likes
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND NOT EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND banned = true
  )
);