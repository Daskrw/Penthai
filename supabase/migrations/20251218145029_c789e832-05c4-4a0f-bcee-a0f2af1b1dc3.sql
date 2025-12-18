-- Create portfolio_posts table
CREATE TABLE public.portfolio_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  event_date DATE NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT true,
  user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.portfolio_posts ENABLE ROW LEVEL SECURITY;

-- Public can view published posts
CREATE POLICY "Anyone can view published posts"
ON public.portfolio_posts
FOR SELECT
USING (is_published = true);

-- Admins can view all posts
CREATE POLICY "Admins can view all posts"
ON public.portfolio_posts
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can insert posts
CREATE POLICY "Admins can insert posts"
ON public.portfolio_posts
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Admins can update posts
CREATE POLICY "Admins can update posts"
ON public.portfolio_posts
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete posts
CREATE POLICY "Admins can delete posts"
ON public.portfolio_posts
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Add updated_at trigger
CREATE TRIGGER update_portfolio_posts_updated_at
BEFORE UPDATE ON public.portfolio_posts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for portfolio images
INSERT INTO storage.buckets (id, name, public) VALUES ('portfolio-images', 'portfolio-images', true);

-- Storage policies
CREATE POLICY "Anyone can view portfolio images"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio-images');

CREATE POLICY "Admins can upload portfolio images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'portfolio-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update portfolio images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'portfolio-images' AND has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete portfolio images"
ON storage.objects FOR DELETE
USING (bucket_id = 'portfolio-images' AND has_role(auth.uid(), 'admin'));