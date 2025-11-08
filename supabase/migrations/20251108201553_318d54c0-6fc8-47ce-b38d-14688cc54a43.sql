-- Create achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement_type TEXT NOT NULL, -- 'likes', 'purchases', 'uploads', 'swipes', 'challenge_wins'
  requirement_count INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_achievements table
CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Achievements are viewable by everyone
CREATE POLICY "Achievements are viewable by everyone"
ON public.achievements
FOR SELECT
USING (true);

-- Users can view their own achievements
CREATE POLICY "Users can view their own achievements"
ON public.user_achievements
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own achievements
CREATE POLICY "Users can insert their own achievements"
ON public.user_achievements
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Insert initial achievements
INSERT INTO public.achievements (name, description, icon, requirement_type, requirement_count) VALUES
  ('First Love', 'Like your first photo', '💖', 'likes', 1),
  ('Heart Collector', 'Like 10 photos', '❤️', 'likes', 10),
  ('Love Machine', 'Like 50 photos', '💕', 'likes', 50),
  ('Swipe Master', 'Swipe through 100 photos', '👆', 'swipes', 100),
  ('First Purchase', 'Buy your first photo', '💰', 'purchases', 1),
  ('Art Collector', 'Purchase 5 photos', '🎨', 'purchases', 5),
  ('Gallery Owner', 'Purchase 20 photos', '🖼️', 'purchases', 20),
  ('First Upload', 'Upload your first photo', '📸', 'uploads', 1),
  ('Content Creator', 'Upload 10 photos', '🌟', 'uploads', 10),
  ('Pro Photographer', 'Upload 50 photos', '📷', 'uploads', 50),
  ('Challenge Winner', 'Win your first challenge', '🏆', 'challenge_wins', 1),
  ('Champion', 'Win 5 challenges', '👑', 'challenge_wins', 5);