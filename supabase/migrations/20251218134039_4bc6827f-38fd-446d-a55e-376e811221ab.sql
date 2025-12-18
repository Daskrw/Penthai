-- Create status enum for community enterprises
CREATE TYPE public.enterprise_status AS ENUM ('pending', 'approved', 'rejected');

-- Create community_enterprises table
CREATE TABLE public.community_enterprises (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  citizen_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  enterprise_name TEXT NOT NULL,
  province TEXT NOT NULL,
  district TEXT,
  address TEXT,
  member_count INTEGER DEFAULT 7,
  status enterprise_status NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  documents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.community_enterprises ENABLE ROW LEVEL SECURITY;

-- Users can view their own registrations
CREATE POLICY "Users can view their own registrations"
ON public.community_enterprises
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own registrations
CREATE POLICY "Users can create registrations"
ON public.community_enterprises
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all registrations
CREATE POLICY "Admins can view all registrations"
ON public.community_enterprises
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Admins can update all registrations
CREATE POLICY "Admins can update all registrations"
ON public.community_enterprises
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Admins can delete registrations
CREATE POLICY "Admins can delete registrations"
ON public.community_enterprises
FOR DELETE
USING (has_role(auth.uid(), 'admin'));

-- Create system settings table for registration system
CREATE TABLE public.enterprise_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  registration_open BOOLEAN NOT NULL DEFAULT true,
  notification_email TEXT,
  announcement TEXT,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on settings
ALTER TABLE public.enterprise_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view settings (for checking if registration is open)
CREATE POLICY "Anyone can view settings"
ON public.enterprise_settings
FOR SELECT
USING (true);

-- Only admins can update settings
CREATE POLICY "Admins can update settings"
ON public.enterprise_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Only admins can insert settings
CREATE POLICY "Admins can insert settings"
ON public.enterprise_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Insert default settings
INSERT INTO public.enterprise_settings (registration_open, notification_email, announcement)
VALUES (true, '', 'ระบบเปิดรับลงทะเบียนวิสาหกิจชุมชนใหม่');

-- Create trigger for updated_at
CREATE TRIGGER update_community_enterprises_updated_at
BEFORE UPDATE ON public.community_enterprises
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_enterprise_settings_updated_at
BEFORE UPDATE ON public.enterprise_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();