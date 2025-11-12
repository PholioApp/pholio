-- Fix Payment Bypass Vulnerabilities
-- Remove INSERT RLS policies that allow direct client-side payment record creation

-- Drop vulnerable INSERT policy for purchases table
-- Purchases must only be created via verify-payment edge function after Stripe verification
DROP POLICY IF EXISTS "Users can create purchases" ON public.purchases;

-- Drop vulnerable INSERT policy for ads table
-- Ads must only be created via verify-ad-payment edge function after Stripe verification
DROP POLICY IF EXISTS "Advertisers can create ads" ON public.ads;

-- Drop vulnerable INSERT policy for promotions table
-- Promotions must only be created via verify-promotion-payment edge function after Stripe verification
DROP POLICY IF EXISTS "Sellers can create promotions for their images" ON public.promotions;