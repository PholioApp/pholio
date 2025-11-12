-- Create ads table
CREATE TABLE IF NOT EXISTS public.ads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  advertiser_id UUID NOT NULL,
  site_url TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  amount_paid NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ads ENABLE ROW LEVEL SECURITY;

-- Ads are viewable by everyone (only active ones)
CREATE POLICY "Active ads are viewable by everyone"
  ON public.ads
  FOR SELECT
  USING (status = 'active' AND end_date > now());

-- Advertisers can view their own ads
CREATE POLICY "Advertisers can view their own ads"
  ON public.ads
  FOR SELECT
  USING (auth.uid() = advertiser_id);

-- Advertisers can create ads
CREATE POLICY "Advertisers can create ads"
  ON public.ads
  FOR INSERT
  WITH CHECK (auth.uid() = advertiser_id);

-- Advertisers can update their own ads
CREATE POLICY "Advertisers can update their own ads"
  ON public.ads
  FOR UPDATE
  USING (auth.uid() = advertiser_id);