-- Create likes table to track user likes
CREATE TABLE public.likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  image_id uuid NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, image_id)
);

-- Enable RLS
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for likes
CREATE POLICY "Users can view all likes"
ON public.likes FOR SELECT
USING (true);

CREATE POLICY "Users can create their own likes"
ON public.likes FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own likes"
ON public.likes FOR DELETE
USING (auth.uid() = user_id);

-- Add index for better performance on like counts
CREATE INDEX idx_likes_image_id ON public.likes(image_id);
CREATE INDEX idx_likes_user_id ON public.likes(user_id);

-- Create a function to get like count for images
CREATE OR REPLACE FUNCTION get_image_like_count(image_id_param uuid)
RETURNS bigint
LANGUAGE sql
STABLE
AS $$
  SELECT COUNT(*) FROM public.likes WHERE image_id = image_id_param;
$$;