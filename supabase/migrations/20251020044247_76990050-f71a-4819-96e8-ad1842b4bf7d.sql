-- Fix search_path for get_image_like_count function
CREATE OR REPLACE FUNCTION get_image_like_count(image_id_param uuid)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*) FROM public.likes WHERE image_id = image_id_param;
$$;