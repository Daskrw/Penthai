-- Create community_profiles table
CREATE TABLE public.community_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  social_link TEXT
);

-- Enable RLS
ALTER TABLE public.community_profiles ENABLE ROW LEVEL SECURITY;

-- Public can view all communities
CREATE POLICY "Anyone can view communities"
ON public.community_profiles
FOR SELECT
USING (true);

-- Admins can manage communities
CREATE POLICY "Admins can insert communities"
ON public.community_profiles
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update communities"
ON public.community_profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete communities"
ON public.community_profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_community_profiles_updated_at
BEFORE UPDATE ON public.community_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for community images
INSERT INTO storage.buckets (id, name, public) VALUES ('community-images', 'community-images', true);

-- Storage policies
CREATE POLICY "Anyone can view community images"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-images');

CREATE POLICY "Admins can upload community images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'community-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update community images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'community-images' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete community images"
ON storage.objects FOR DELETE
USING (bucket_id = 'community-images' AND has_role(auth.uid(), 'admin'::app_role));