-- Create site_reviews table
CREATE TABLE public.site_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_name TEXT NOT NULL,
  comment TEXT NOT NULL,
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  avatar_url TEXT
);

-- Enable RLS
ALTER TABLE public.site_reviews ENABLE ROW LEVEL SECURITY;

-- Anyone can view reviews
CREATE POLICY "Anyone can view reviews"
ON public.site_reviews
FOR SELECT
USING (true);

-- Anyone can create reviews
CREATE POLICY "Anyone can create reviews"
ON public.site_reviews
FOR INSERT
WITH CHECK (true);

-- Admins can update reviews
CREATE POLICY "Admins can update reviews"
ON public.site_reviews
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete reviews
CREATE POLICY "Admins can delete reviews"
ON public.site_reviews
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add trigger for updated_at
CREATE TRIGGER update_site_reviews_updated_at
BEFORE UPDATE ON public.site_reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();