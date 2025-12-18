-- Create enum for seller application status
CREATE TYPE public.seller_application_status AS ENUM ('pending', 'contacted', 'approved', 'rejected');

-- Create seller_applications table
CREATE TABLE public.seller_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Contact Information
  contact_name TEXT NOT NULL,
  shop_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  line_id TEXT,
  
  -- Product Details
  product_name TEXT,
  category TEXT,
  price NUMERIC,
  description TEXT,
  
  -- Certifications & Images
  product_images JSONB DEFAULT '[]'::jsonb,
  certifications JSONB DEFAULT '[]'::jsonb,
  other_certification TEXT,
  
  -- Status tracking
  status seller_application_status NOT NULL DEFAULT 'pending',
  admin_notes TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  
  -- User reference (optional - can submit without login)
  user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Anyone can submit a seller application
CREATE POLICY "Anyone can create seller applications"
ON public.seller_applications
FOR INSERT
WITH CHECK (true);

-- Users can view their own applications
CREATE POLICY "Users can view their own applications"
ON public.seller_applications
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all applications
CREATE POLICY "Admins can view all seller applications"
ON public.seller_applications
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update applications
CREATE POLICY "Admins can update seller applications"
ON public.seller_applications
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete applications
CREATE POLICY "Admins can delete seller applications"
ON public.seller_applications
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_seller_applications_updated_at
BEFORE UPDATE ON public.seller_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public) VALUES ('seller-product-images', 'seller-product-images', true);

-- Storage policies for product images
CREATE POLICY "Anyone can upload product images"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'seller-product-images');

CREATE POLICY "Anyone can view product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'seller-product-images');

CREATE POLICY "Admins can delete product images"
ON storage.objects
FOR DELETE
USING (bucket_id = 'seller-product-images' AND has_role(auth.uid(), 'admin'));