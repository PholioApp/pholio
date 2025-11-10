-- Create promotions table for image promotion
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  amount_paid NUMERIC NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  impressions INTEGER NOT NULL DEFAULT 0,
  clicks INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create seller_earnings table to track what sellers have earned
CREATE TABLE IF NOT EXISTS public.seller_earnings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL,
  purchase_id UUID NOT NULL REFERENCES public.purchases(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_earnings ENABLE ROW LEVEL SECURITY;

-- Promotions policies
CREATE POLICY "Promotions are viewable by everyone"
  ON public.promotions FOR SELECT
  USING (status = 'active');

CREATE POLICY "Sellers can create promotions for their images"
  ON public.promotions FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can view their own promotions"
  ON public.promotions FOR SELECT
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own promotions"
  ON public.promotions FOR UPDATE
  USING (auth.uid() = seller_id);

-- Seller earnings policies
CREATE POLICY "Sellers can view their own earnings"
  ON public.seller_earnings FOR SELECT
  USING (auth.uid() = seller_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promotions_image_id ON public.promotions(image_id);
CREATE INDEX IF NOT EXISTS idx_promotions_seller_id ON public.promotions(seller_id);
CREATE INDEX IF NOT EXISTS idx_promotions_status ON public.promotions(status);
CREATE INDEX IF NOT EXISTS idx_seller_earnings_seller_id ON public.seller_earnings(seller_id);

-- Function to automatically create seller earnings when a purchase is completed
CREATE OR REPLACE FUNCTION public.create_seller_earning()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    INSERT INTO public.seller_earnings (seller_id, purchase_id, amount)
    SELECT i.seller_id, NEW.id, NEW.amount * 0.85
    FROM public.images i
    WHERE i.id = NEW.image_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create seller earnings
CREATE TRIGGER on_purchase_completed
  AFTER INSERT OR UPDATE ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.create_seller_earning();