-- Create challenges table
CREATE TABLE public.challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  theme TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  voting_end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'voting', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create challenge submissions table
CREATE TABLE public.challenge_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  votes_count INTEGER NOT NULL DEFAULT 0,
  is_winner BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(challenge_id, image_id)
);

-- Create challenge votes table
CREATE TABLE public.challenge_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID NOT NULL REFERENCES public.challenge_submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(submission_id, user_id)
);

-- Enable RLS
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_votes ENABLE ROW LEVEL SECURITY;

-- Challenges policies
CREATE POLICY "Challenges are viewable by everyone"
  ON public.challenges FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage challenges"
  ON public.challenges FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Challenge submissions policies
CREATE POLICY "Submissions are viewable by everyone"
  ON public.challenge_submissions FOR SELECT
  USING (true);

CREATE POLICY "Users can create their own submissions"
  ON public.challenge_submissions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own submissions"
  ON public.challenge_submissions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own submissions"
  ON public.challenge_submissions FOR DELETE
  USING (auth.uid() = user_id);

-- Challenge votes policies
CREATE POLICY "Votes are viewable by everyone"
  ON public.challenge_votes FOR SELECT
  USING (true);

CREATE POLICY "Users can create votes"
  ON public.challenge_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON public.challenge_votes FOR DELETE
  USING (auth.uid() = user_id);

-- Function to update votes count
CREATE OR REPLACE FUNCTION public.update_submission_votes_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.challenge_submissions
    SET votes_count = votes_count + 1
    WHERE id = NEW.submission_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.challenge_submissions
    SET votes_count = votes_count - 1
    WHERE id = OLD.submission_id;
  END IF;
  RETURN NULL;
END;
$$;

-- Trigger to update votes count
CREATE TRIGGER update_challenge_votes_count
AFTER INSERT OR DELETE ON public.challenge_votes
FOR EACH ROW
EXECUTE FUNCTION public.update_submission_votes_count();

-- Trigger for updated_at
CREATE TRIGGER update_challenges_updated_at
BEFORE UPDATE ON public.challenges
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Insert 45 challenge themes
INSERT INTO public.challenges (title, theme, description, end_date, voting_end_date, status) VALUES
('Urban Life', 'Urban Exploration', 'Capture the essence of city living', now() + interval '7 days', now() + interval '10 days', 'active'),
('Nature''s Beauty', 'Natural Landscapes', 'Show the stunning beauty of nature', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Golden Hour', 'Sunset & Sunrise', 'Capture magical golden hour moments', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Street Photography', 'Urban Streets', 'Life on the streets', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Wildlife Wonder', 'Wildlife', 'Animals in their natural habitat', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Black & White', 'Monochrome', 'Classic black and white photography', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Abstract Art', 'Abstract', 'Creative abstract compositions', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Portrait Perfection', 'Portraits', 'Stunning portrait photography', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Architecture', 'Buildings & Structures', 'Architectural wonders', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Food Photography', 'Culinary Art', 'Mouth-watering food shots', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Macro Magic', 'Macro Photography', 'Tiny details up close', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Reflections', 'Mirror Images', 'Beautiful reflections', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Minimalism', 'Minimal Composition', 'Less is more', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Night Photography', 'Night Scenes', 'Capture the night', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Water World', 'Water & Ocean', 'All things water', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Mountain Majesty', 'Mountains', 'Majestic peaks and ranges', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Sky & Clouds', 'Cloudscapes', 'Beautiful sky formations', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Vintage Vibes', 'Retro & Vintage', 'Nostalgic photography', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Sports Action', 'Sports & Motion', 'Dynamic action shots', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Pet Photography', 'Pets & Animals', 'Adorable pet moments', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Winter Wonderland', 'Snow & Ice', 'Snowy landscapes', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Spring Bloom', 'Flowers & Gardens', 'Colorful blooms', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Summer Days', 'Summer Vibes', 'Warm summer moments', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Autumn Colors', 'Fall Foliage', 'Beautiful autumn leaves', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Travel Stories', 'Travel & Adventure', 'Wanderlust moments', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Urban Decay', 'Abandoned Places', 'Beauty in decay', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Silhouettes', 'Shadow & Light', 'Dramatic silhouettes', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Aerial Views', 'Drone Photography', 'Birds eye perspective', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Long Exposure', 'Motion Blur', 'Creative long exposures', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Candid Moments', 'Street Candids', 'Unposed authentic moments', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Textures & Patterns', 'Details', 'Interesting textures', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Color Splash', 'Vibrant Colors', 'Bold and colorful', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Foggy Morning', 'Mist & Fog', 'Mysterious foggy scenes', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Rain & Storm', 'Weather Drama', 'Dramatic weather', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Desert Beauty', 'Desert Landscapes', 'Arid landscapes', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Forest Life', 'Woods & Trees', 'Forest photography', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Beach Scenes', 'Coastal Views', 'Beautiful beaches', now() + interval '7 days', now() + interval '10 days', 'draft'),
('City Lights', 'Urban Night', 'Nighttime cityscapes', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Industrial', 'Factories & Industry', 'Industrial photography', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Doors & Windows', 'Architectural Details', 'Interesting entryways', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Transportation', 'Vehicles', 'Cars, trains, planes', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Still Life', 'Object Photography', 'Arranged compositions', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Underwater', 'Aquatic Life', 'Below the surface', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Fire & Light', 'Light & Heat', 'Fire and illumination', now() + interval '7 days', now() + interval '10 days', 'draft'),
('Emotion', 'Human Expression', 'Capturing feelings', now() + interval '7 days', now() + interval '10 days', 'draft');